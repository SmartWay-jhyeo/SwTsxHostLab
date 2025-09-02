import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get("cityId")
    const districtId = searchParams.get("districtId")
    const neighborhoodId = searchParams.get("neighborhoodId")
    const includeProperties = searchParams.get("includeProperties") === "true"

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    if (neighborhoodId) {
      // 특정 동의 부동산 데이터 조회
      const { data: properties, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_details(*),
          property_pricing(*),
          property_occupancy(*),
          property_images(*),
          property_reviews(*),
          property_review_summary(*),
          neighborhoods(
            neighborhood_name,
            districts(
              district_name,
              cities(city_name)
            )
          )
        `)
        .eq("neighborhood_id", neighborhoodId)
        .eq("is_active", true)

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: properties,
        type: "properties",
      })
    }

    if (districtId) {
      // 특정 구의 동 목록 조회
      let query = supabase
        .from("neighborhoods")
        .select(`
          *,
          districts(
            district_name,
            cities(city_name)
          )
        `)
        .eq("district_id", districtId)

      if (includeProperties) {
        query = supabase
          .from("neighborhoods")
          .select(`
            *,
            districts(
              district_name,
              cities(city_name)
            ),
            properties(count)
          `)
          .eq("district_id", districtId)
      }

      const { data: neighborhoods, error } = await query

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: neighborhoods,
        type: "neighborhoods",
      })
    }

    if (cityId) {
      // 특정 시의 구 목록 조회
      const { data: districts, error } = await supabase
        .from("districts")
        .select(`
          *,
          cities(city_name),
          neighborhoods(count)
        `)
        .eq("city_id", cityId)

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: districts,
        type: "districts",
      })
    }

    // 전체 시/도 목록 조회
    const { data: cities, error } = await supabase
      .from("cities")
      .select(`
        *,
        districts(count)
      `)
      .order("city_name")

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: cities,
      type: "cities",
    })
  } catch (error: any) {
    console.error("데이터 조회 중 오류:", error)
    return NextResponse.json(
      { success: false, error: `데이터 조회 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 },
    )
  }
}
