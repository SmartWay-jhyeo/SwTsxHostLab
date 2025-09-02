import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { propertyId, rentalCosts } = await request.json()

    if (!propertyId || !rentalCosts) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 정보가 누락되었습니다.",
        },
        { status: 400 },
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // property_pricing 테이블에서 해당 property_id의 레코드 업데이트
    const { data, error } = await supabase
      .from("property_pricing")
      .update({
        monthly_rent: rentalCosts.monthly_rent || 0,
        monthly_maintenance: rentalCosts.monthly_maintenance || 0,
        cleaning_cost: rentalCosts.cleaning_cost || 100000,
        initial_setup_cost: rentalCosts.initial_setup_cost || 2000000,
        deposit: rentalCosts.deposit || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("property_id", propertyId)
      .select()

    if (error) {
      console.error("월 단위 비용 정보 업데이트 실패:", error)
      return NextResponse.json(
        {
          success: false,
          error: `월 단위 비용 정보 업데이트 실패: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "월 단위 비용 정보가 성공적으로 업데이트되었습니다.",
      data,
    })
  } catch (error: any) {
    console.error("월 단위 비용 정보 업데이트 중 오류:", error)
    return NextResponse.json(
      {
        success: false,
        error: `월 단위 비용 정보 업데이트 중 오류가 발생했습니다: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
