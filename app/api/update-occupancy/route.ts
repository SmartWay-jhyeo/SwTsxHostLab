import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 환경 변수에서 Supabase 정보 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱
    const { propertyId, occupancyRates } = await request.json()

    console.log("=== UPDATE OCCUPANCY API START ===")
    console.log("Received data for update:", {
      propertyId,
      occupancyRates,
    })

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }

    // 기존 occupancyRates 검증 부분을 더 상세하게 수정
    if (!occupancyRates || typeof occupancyRates !== "object") {
      return NextResponse.json({ error: "Occupancy rates are required" }, { status: 400 })
    }

    // 각 예약률 값 검증 추가
    const { occupancy_rate, occupancy_2rate, occupancy_3rate } = occupancyRates

    if (typeof occupancy_rate !== "number" || occupancy_rate < 0 || occupancy_rate > 100) {
      return NextResponse.json({ error: "1개월 예약률은 0-100 사이의 숫자여야 합니다." }, { status: 400 })
    }

    if (typeof occupancy_2rate !== "number" || occupancy_2rate < 0 || occupancy_2rate > 100) {
      return NextResponse.json({ error: "2개월 예약률은 0-100 사이의 숫자여야 합니다." }, { status: 400 })
    }

    if (typeof occupancy_3rate !== "number" || occupancy_3rate < 0 || occupancy_3rate > 100) {
      return NextResponse.json({ error: "3개월 예약률은 0-100 사이의 숫자여야 합니다." }, { status: 400 })
    }

    // 환경 변수 확인
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        {
          error: "Server configuration error: Missing Supabase credentials",
          availableEnvVars: Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
        },
        { status: 500 },
      )
    }

    // Supabase 클라이언트 직접 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // properties 테이블에서 해당 property 조회
    console.log("Checking if property exists...")
    const { data: existingProperty, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .limit(1)
      .single()

    if (fetchError) {
      console.error("Error fetching property:", fetchError)
      return NextResponse.json(
        {
          error: `Property not found: ${fetchError.message}`,
          details: fetchError,
        },
        { status: 404 },
      )
    }

    console.log("Found property:", existingProperty.id)

    // property_occupancy 테이블에 예약률 저장 (upsert 사용)
    console.log(`Updating property_occupancy for property ${propertyId} with occupancy rates:`, occupancyRates)

    // occupancyData 객체에 모든 예약률 포함
    const occupancyData = {
      property_id: propertyId,
      occupancy_rate: occupancy_rate,
      occupancy_2rate: occupancy_2rate,
      occupancy_3rate: occupancy_3rate,
      updated_at: new Date().toISOString(),
    }

    console.log("Data to be upserted:", occupancyData)

    const { data: upsertData, error: occupancyError } = await supabase
      .from("property_occupancy")
      .upsert(occupancyData, {
        onConflict: "property_id",
        ignoreDuplicates: false,
      })
      .select()

    if (occupancyError) {
      console.error("Property_occupancy table update error:", occupancyError)
      console.error("Error details:", {
        message: occupancyError.message,
        details: occupancyError.details,
        hint: occupancyError.hint,
        code: occupancyError.code,
      })

      return NextResponse.json(
        {
          error: occupancyError.message,
          details: occupancyError,
          hint: "property_occupancy 테이블 업데이트에 실패했습니다.",
        },
        { status: 500 },
      )
    }

    console.log("Property_occupancy table updated successfully:", upsertData)

    // 업데이트 후 다시 확인
    console.log("Verifying update...")
    const { data: verifyData, error: verifyError } = await supabase
      .from("property_occupancy")
      .select("*")
      .eq("property_id", propertyId)
      .single()

    console.log("Verified data after update:", verifyData)
    if (verifyError) {
      console.error("Error verifying update:", verifyError)
    }

    console.log("=== UPDATE OCCUPANCY API SUCCESS ===")
    return NextResponse.json({
      success: true,
      message: "예약률이 성공적으로 업데이트되었습니다.",
      data: {
        propertyId,
        occupancyRates,
        updatedData: upsertData,
        verifiedData: verifyData,
      },
    })
  } catch (error: any) {
    console.error("=== UPDATE OCCUPANCY API ERROR ===")
    console.error("Error in update-occupancy API:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred",
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
