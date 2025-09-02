import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/session"
import { canAccessCity, canAccessDistrict, canAccessNeighborhood } from "@/lib/user-permissions"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { location, period } = await request.json()

    if (!location) {
      return NextResponse.json({ error: "검색할 위치를 입력해주세요." }, { status: 400 })
    }

    const supabase = createClient()
    const user = await getCurrentUser()
    const isAdmin = user?.role === "admin"

    console.log(`🔍 [검색 API] 검색 시작: ${location}, 사용자: ${user?.email}, 관리자: ${isAdmin}`)

    // 권한 체크 (관리자가 아닌 경우)
    if (!isAdmin && user) {
      // 검색 위치에서 지역 정보 추출 (간단한 방식)
      const locationParts = location.split(" ")
      let hasPermission = false

      // 시/도 단위 검색인지 확인
      if (locationParts.length >= 1) {
        const cityName = locationParts[0]
        if (await canAccessCity(cityName)) {
          hasPermission = true
        }
      }

      // 시/군/구 단위 검색인지 확인
      if (!hasPermission && locationParts.length >= 2) {
        const cityName = locationParts[0]
        const districtName = locationParts[1]
        if (await canAccessDistrict(cityName, districtName)) {
          hasPermission = true
        }
      }

      // 읍/면/동 단위 검색인지 확인
      if (!hasPermission && locationParts.length >= 3) {
        const cityName = locationParts[0]
        const districtName = locationParts[1]
        const neighborhoodName = locationParts[2]
        if (await canAccessNeighborhood(cityName, districtName, neighborhoodName)) {
          hasPermission = true
        }
      }

      // 주소 기반 검색도 허용 (더 유연한 검색을 위해)
      if (!hasPermission) {
        // 주소에 포함된 지역명으로 권한 체크
        const { data: regionCheck } = await supabase
          .from("neighborhoods")
          .select(`
            neighborhood_name,
            districts!inner(
              district_name,
              cities!inner(city_name)
            )
          `)
          .ilike("neighborhood_name", `%${location}%`)
          .limit(1)

        if (regionCheck && regionCheck.length > 0) {
          const region = regionCheck[0]
          const cityName = region.districts.cities.city_name
          const districtName = region.districts.district_name
          const neighborhoodName = region.neighborhood_name

          if (await canAccessNeighborhood(cityName, districtName, neighborhoodName)) {
            hasPermission = true
          }
        }
      }

      if (!hasPermission) {
        console.log(`❌ [검색 API] 권한 없음: ${location}`)
        return NextResponse.json(
          {
            error: "해당 지역에 대한 접근 권한이 없습니다.",
            success: false,
          },
          { status: 403 },
        )
      }
    }

    // 병렬로 여러 쿼리 실행하여 성능 향상
    const [propertiesResult, neighborhoodResult, reviewsResult] = await Promise.all([
      // 메인 속성 데이터 조회 (필요한 필드만 선택)
      supabase
        .from("properties")
        .select(`
          id,
          name,
          address,
          latitude,
          longitude,
          building_type,
          size_pyeong,
          weekly_price,
          weekly_maintenance,
          cleaning_fee,
          occupancy_rate,
          occupancy_2rate,
          occupancy_3rate,
          room_count,
          property_details!property_details_property_id_fkey(
            bedrooms,
            bathrooms,
            kitchen_count,
            living_room_count,
            has_elevator,
            parking_info,
            is_super_host,
            amenities
          ),
          property_pricing!property_pricing_property_id_fkey(
            weekly_price,
            weekly_maintenance,
            cleaning_fee,
            discount_2weeks,
            discount_3weeks,
            discount_4weeks,
            discount_5weeks,
            discount_6weeks,
            discount_7weeks,
            discount_8weeks,
            discount_9weeks,
            discount_10weeks,
            discount_11weeks,
            discount_12weeks,
            monthly_rent,
            monthly_maintenance,
            initial_setup_cost,
            deposit
          ),
          property_occupancy!property_occupancy_property_id_fkey(
            occupancy_rate,
            occupancy_2rate,
            occupancy_3rate
          )
        `)
        .ilike("address", `%${location}%`)
        .eq("is_active", true)
        .limit(1000), // 결과 수 제한으로 성능 향상

      // 지역 정보 조회
      supabase
        .from("neighborhoods")
        .select("neighborhood_name, created_at")
        .ilike("neighborhood_name", `%${location}%`)
        .limit(10),

      // 리뷰 요약 정보 조회 (별도 쿼리로 분리)
      supabase
        .from("property_review_summary")
        .select(`
          property_id,
          average_rating,
          review_count,
          latest_review_date
        `)
        .limit(1000),
    ])

    const { data: properties, error: propertiesError } = propertiesResult
    const { data: neighborhoods } = neighborhoodResult
    const { data: reviewSummaries } = reviewsResult

    if (propertiesError) {
      console.error("❌ [검색 API] 속성 조회 오류:", propertiesError)
      return NextResponse.json({ error: "검색 중 오류가 발생했습니다." }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      console.log("⚠️ [검색 API] 검색 결과 없음")
      return NextResponse.json({
        success: true,
        rooms: [],
        message: "검색 결과가 없습니다.",
      })
    }

    // 리뷰 요약 데이터를 맵으로 변환 (빠른 조회를 위해)
    const reviewMap = new Map()
    if (reviewSummaries) {
      reviewSummaries.forEach((review) => {
        reviewMap.set(review.property_id, review)
      })
    }

    // 데이터 변환 최적화
    const rooms = properties.map((property) => {
      const details = property.property_details?.[0]
      const pricing = property.property_pricing?.[0]
      const occupancy = property.property_occupancy?.[0]
      const reviewSummary = reviewMap.get(property.id)

      return {
        id: property.id,
        property_id: property.property_id?.toString() || null,
        name: property.name || "",
        address: property.address || "",
        latitude: property.latitude ? Number(property.latitude) : null,
        longitude: property.longitude ? Number(property.longitude) : null,
        building_type: details?.building_type || property.building_type || "",
        size_pyeong: details?.size_pyeong || property.size_pyeong || 0,
        room_count: details?.bedrooms || property.room_count || 1,
        weekly_price: pricing?.weekly_price || property.weekly_price || 0,
        weekly_maintenance: pricing?.weekly_maintenance || property.weekly_maintenance || 0,
        cleaning_fee: pricing?.cleaning_fee || property.cleaning_fee || 0,

        // 할인 정보
        discount_2weeks: pricing?.discount_2weeks || 0,
        discount_3weeks: pricing?.discount_3weeks || 0,
        discount_4weeks: pricing?.discount_4weeks || 0,
        discount_5weeks: pricing?.discount_5weeks || 0,
        discount_6weeks: pricing?.discount_6weeks || 0,
        discount_7weeks: pricing?.discount_7weeks || 0,
        discount_8weeks: pricing?.discount_8weeks || 0,
        discount_9weeks: pricing?.discount_9weeks || 0,
        discount_10weeks: pricing?.discount_10weeks || 0,
        discount_11weeks: pricing?.discount_11weeks || 0,
        discount_12weeks: pricing?.discount_12weeks || 0,

        // 예약률 정보
        occupancy_rate: occupancy?.occupancy_rate || property.occupancy_rate || 0,
        occupancy_2rate: occupancy?.occupancy_2rate || property.occupancy_2rate || 0,
        occupancy_3rate: occupancy?.occupancy_3rate || property.occupancy_3rate || 0,

        // 기타 정보
        bathroom_count: details?.bathrooms || 0,
        kitchen_count: details?.kitchen_count || 0,
        living_room_count: details?.living_room_count || 0,
        has_elevator: details?.has_elevator || false,
        parking_info: details?.parking_info || "",
        is_super_host: details?.is_super_host || false,
        amenities: details?.amenities || [],

        // 리뷰 정보
        review_info: reviewSummary
          ? {
              review_score: (reviewSummary.average_rating || 0) * 20,
              review_count: reviewSummary.review_count || 0,
              latest_review_date: reviewSummary.latest_review_date || "",
              review_details: [], // 상세 리뷰는 필요시 별도 로드
            }
          : null,

        // 월 단위 비용 정보
        monthly_rent: pricing?.monthly_rent || undefined,
        monthly_maintenance: pricing?.monthly_maintenance || undefined,
        initial_setup_cost: pricing?.initial_setup_cost || undefined,
        deposit: pricing?.deposit || undefined,

        images: [], // 이미지는 필요시 별도 로드
        naver_property_data: null,
      }
    })

    const endTime = Date.now()
    const searchTime = endTime - startTime

    console.log(`✅ [검색 API] 검색 완료: ${rooms.length}개 결과, ${searchTime}ms 소요`)

    return NextResponse.json({
      success: true,
      rooms,
      searchTime,
      resultCount: rooms.length,
      neighborhoods: neighborhoods || [],
    })
  } catch (error) {
    const endTime = Date.now()
    const searchTime = endTime - startTime

    console.error("❌ [검색 API] 오류:", error)
    return NextResponse.json(
      {
        error: "검색 중 오류가 발생했습니다.",
        searchTime,
      },
      { status: 500 },
    )
  }
}
