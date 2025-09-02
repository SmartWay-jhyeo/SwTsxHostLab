import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // 폼 데이터에서 필드 추출
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const dataJson = formData.get("data") as string
    const existingId = formData.get("existingId") as string

    // 필수 필드 검증
    if (!title) {
      return NextResponse.json({ success: false, error: "제목은 필수 입력 항목입니다." }, { status: 400 })
    }

    if (!location) {
      return NextResponse.json({ success: false, error: "지역은 필수 입력 항목입니다." }, { status: 400 })
    }

    // 데이터 검증
    if (!dataJson) {
      console.error("데이터가 없습니다")
      return NextResponse.json({ success: false, error: "분석 데이터가 없습니다." }, { status: 400 })
    }

    // 데이터 파싱
    let data
    try {
      data = JSON.parse(dataJson)

      // 데이터가 배열인지 확인
      if (!Array.isArray(data)) {
        console.log("데이터가 배열이 아니므로 배열로 변환합니다.")
        data = [data]
      }

      // 데이터 구조 로깅 (디버깅용)
      console.log("데이터 구조 확인:", JSON.stringify(data[0] ? Object.keys(data[0]) : "빈 데이터", null, 2))
      if (data[0] && data[0].naver_property_data) {
        console.log("네이버 부동산 데이터 존재함")
      } else {
        console.log("네이버 부동산 데이터 없음")
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError)
      return NextResponse.json(
        { success: false, error: `분석 데이터를 처리할 수 없습니다: ${parseError.message}` },
        { status: 400 },
      )
    }

    // Supabase 클라이언트 생성
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // 현재 시간
    const createdAt = new Date().toISOString()

    // 현재 사용자 정보 가져오기
    let userId = null
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch (userError) {
      console.error("사용자 정보 가져오기 오류:", userError)
      // 사용자 정보를 가져오는 데 실패해도 계속 진행
    }

    let result

    // 기존 파일 업데이트 또는 새 파일 생성
    if (existingId) {
      // 기존 파일 업데이트
      const { data: updatedData, error } = await supabase
        .from("analysis_results")
        .update({
          title,
          description: description || null,
          location: location,
          data: data,
          room_count: data.length || 0,
          // updated_at 필드 제거
        })
        .eq("id", existingId)
        .select("id")
        .single()

      if (error) {
        console.error("업데이트 오류:", error)
        return NextResponse.json(
          { success: false, error: `데이터 업데이트 중 오류가 발생했습니다: ${error.message}` },
          { status: 500 },
        )
      }

      result = updatedData
    } else {
      // 새 파일 생성
      const { data: savedData, error } = await supabase
        .from("analysis_results")
        .insert({
          title,
          description: description || null,
          location: location,
          data: data,
          created_at: createdAt,
          // updated_at 필드 제거
          room_count: data.length || 0,
          user_id: userId,
        })
        .select("id")
        .single()

      if (error) {
        console.error("저장 오류:", error)

        // 테이블이 없는 경우 테이블 생성 시도
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          try {
            // 테이블 생성 시도
            const createTableResult = await supabase.rpc("create_analysis_results_table")
            console.log("테이블 생성 결과:", createTableResult)

            // 테이블 생성 후 다시 저장 시도
            const { data: retryData, error: retryError } = await supabase
              .from("analysis_results")
              .insert({
                title,
                description: description || null,
                location: location,
                data: data,
                created_at: createdAt,
                // updated_at 필드 제거
                room_count: data.length || 0,
                user_id: userId,
              })
              .select("id")
              .single()

            if (retryError) {
              console.error("재시도 저장 오류:", retryError)
              return NextResponse.json(
                { success: false, error: `테이블 생성 후 저장 중 오류가 발생했습니다: ${retryError.message}` },
                { status: 500 },
              )
            }

            result = retryData
          } catch (createError) {
            console.error("테이블 생성 오류:", createError)
            return NextResponse.json(
              { success: false, error: "테이블이 존재하지 않아 자동 생성을 시도했으나 실패했습니다." },
              { status: 500 },
            )
          }
        } else {
          return NextResponse.json(
            { success: false, error: `데이터 저장 중 오류가 발생했습니다: ${error.message}` },
            { status: 500 },
          )
        }
      } else {
        result = savedData
      }
    }

    // 캐시 갱신
    revalidatePath("/region-data")

    // 성공 응답
    return NextResponse.json({ success: true, id: result.id })
  } catch (error: any) {
    console.error("저장 처리 오류:", error)
    return NextResponse.json(
      { success: false, error: `데이터 처리 중 오류가 발생했습니다: ${error.message || error}` },
      { status: 500 },
    )
  }
}
