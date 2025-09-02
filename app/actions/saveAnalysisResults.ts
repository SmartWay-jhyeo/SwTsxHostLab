"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/session"

export async function saveAnalysisResults(formData: FormData) {
  const password = formData.get("password") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const location = formData.get("location") as string
  const dataJson = formData.get("data")
  const existingId = formData.get("existingId") as string // 기존 파일 ID
  const clientName = formData.get("client_name") as string // 고객 이름 추가

  // 필수 필드 검증
  if (!title) {
    return { success: false, error: "제목은 필수 입력 항목입니다." }
  }

  // 데이터 검증
  if (!dataJson) {
    console.error("데이터가 없습니다:", dataJson)
    return { success: false, error: "분석 데이터가 없습니다." }
  }

  try {
    // 데이터 파싱 전 문자열 확인
    const dataJsonString = typeof dataJson === "string" ? dataJson : String(dataJson)
    console.log("서버에서 받은 데이터 문자열 길이:", dataJsonString.length)

    // 빈 문자열이나 'undefined' 문자열 체크
    if (!dataJsonString || dataJsonString === "undefined" || dataJsonString === "null") {
      console.error("유효하지 않은 데이터:", dataJsonString)
      return { success: false, error: "유효하지 않은 분석 데이터입니다." }
    }

    // 데이터 파싱
    let data
    try {
      data = JSON.parse(dataJsonString)

      // 데이터가 객체인지 확인 (배열 또는 일반 객체)
      if (typeof data !== "object" || data === null) {
        console.error("데이터가 객체가 아닙니다:", data)
        return { success: false, error: "분석 데이터 형식이 올바르지 않습니다." }
      }

      // 배열이 아닌 경우 배열로 변환
      if (!Array.isArray(data)) {
        console.log("데이터가 배열이 아니므로 배열로 변환합니다.")
        data = [data]
      }

      // 빈 배열 체크
      if (Array.isArray(data) && data.length === 0) {
        console.warn("데이터 배열이 비어 있습니다.")
        // 빈 배열도 허용하되 경고 로그만 남김
      }

      // 데이터 구조 로깅 (디버깅용)
      console.log("데이터 구조 확인:", JSON.stringify(data[0] ? Object.keys(data[0]) : "빈 데이터", null, 2))
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError, "원본 데이터 일부:", dataJsonString.substring(0, 100))
      return { success: false, error: "분석 데이터를 처리할 수 없습니다. 유효한 JSON 형식이 아닙니다." }
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 현재 시간
    const createdAt = new Date().toISOString()

    // 현재 사용자 ID 가져오기 (오류 처리 추가)
    let userId = null
    try {
      const user = await getCurrentUser()
      userId = user?.id || null
    } catch (userError) {
      console.error("사용자 정보 가져오기 오류:", userError)
      // 사용자 정보를 가져오는 데 실패해도 계속 진행
    }

    let result

    // 새로운 테이블 사용 여부 확인
    const useNewTable = true // 새 테이블 구조 사용 설정

    if (useNewTable) {
      // 새로운 테이블 구조 사용
      if (existingId) {
        // 기존 분석 결과 업데이트
        const { data: updatedData, error } = await supabase
          .from("analysis_results_new")
          .update({
            title,
            description: description || null,
            location: location || null,
            room_count: Array.isArray(data) ? data.length : 1,
            password: password || null,
            client_name: clientName || null,
            updated_at: createdAt,
          })
          .eq("id", existingId)
          .select("id")
          .single()

        if (error) {
          console.error("업데이트 오류:", error)
          return { success: false, error: `데이터 업데이트 중 오류가 발생했습니다: ${error.message}` }
        }

        // 기존 매물 정보 삭제
        await supabase.from("analysis_properties").delete().eq("analysis_id", existingId)

        // 새 매물 정보 삽입
        for (const property of data) {
          await supabase.from("analysis_properties").insert({
            analysis_id: existingId,
            property_id: property.id || 0,
            name: property.name || "이름 없음",
            address: property.address || null,
            building_type: property.building_type || null,
            room_count: property.room_count || 1,
            weekly_price: property.weekly_price || 0,
            weekly_maintenance: property.weekly_maintenance || 0,
            cleaning_fee: property.cleaning_fee || 0,
            size_pyeong: property.size_pyeong || 0,
            occupancy_rate: property.occupancy_rate || 0,
            images: property.images || [],
            latitude: property.latitude || null,
            longitude: property.longitude || null,
          })
        }

        result = updatedData
      } else {
        // 새 분석 결과 생성
        const { data: savedData, error } = await supabase
          .from("analysis_results_new")
          .insert({
            title,
            description: description || null,
            location: location || null,
            room_count: Array.isArray(data) ? data.length : 1,
            password: password || null,
            client_name: clientName || null,
            created_at: createdAt,
            updated_at: createdAt,
            user_id: userId,
          })
          .select("id")
          .single()

        if (error) {
          console.error("저장 오류:", error)
          return { success: false, error: `데이터 저장 중 오류가 발생했습니다: ${error.message}` }
        }

        // 매물 정보 삽입
        for (const property of data) {
          await supabase.from("analysis_properties").insert({
            analysis_id: savedData.id,
            property_id: property.id || 0,
            name: property.name || "이름 없음",
            address: property.address || null,
            building_type: property.building_type || null,
            room_count: property.room_count || 1,
            weekly_price: property.weekly_price || 0,
            weekly_maintenance: property.weekly_maintenance || 0,
            cleaning_fee: property.cleaning_fee || 0,
            size_pyeong: property.size_pyeong || 0,
            occupancy_rate: property.occupancy_rate || 0,
            images: property.images || [],
            latitude: property.latitude || null,
            longitude: property.longitude || null,
          })
        }

        result = savedData
      }
    } else {
      // 기존 테이블 구조 사용 (이전 코드 유지)
      if (existingId) {
        // 기존 파일 업데이트
        const { data: updatedData, error } = await supabase
          .from("analysis_results")
          .update({
            title,
            description: description || null,
            location: location || null,
            data: data,
            room_count: Array.isArray(data) ? data.length : 1,
            password: password || null,
            client_name: clientName || null,
          })
          .eq("id", existingId)
          .select("id")
          .single()

        if (error) {
          console.error("업데이트 오류:", error)
          return { success: false, error: `데이터 업데이트 중 오류가 발생했습니다: ${error.message}` }
        }

        result = updatedData
      } else {
        // 새 파일 생성
        const { data: savedData, error } = await supabase
          .from("analysis_results")
          .insert({
            title,
            description: description || null,
            location: location || null,
            data: data,
            created_at: createdAt,
            room_count: Array.isArray(data) ? data.length : 1,
            password: password || null,
            client_name: clientName || null,
            user_id: userId,
          })
          .select("id")
          .single()

        if (error) {
          console.error("저장 오류:", error)
          return { success: false, error: `데이터 저장 중 오류가 발생했습니다: ${error.message}` }
        }

        result = savedData
      }
    }

    // 캐시 갱신
    revalidatePath("/saved-results")

    // 성공 시 저장된 결과 페이지로 리다이렉트
    return { success: true, id: result.id }
  } catch (error: any) {
    console.error("저장 처리 오류:", error)
    return { success: false, error: `데이터 처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
