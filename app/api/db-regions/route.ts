import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/session"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level") // 'provinces', 'districts', 'dongs'
  const province = searchParams.get("province")
  const district = searchParams.get("district")

  try {
    const supabase = createClient()

    // 사용자 인증 확인
    let user = null
    try {
      user = await getCurrentUser()
    } catch (userError) {
      // 세션에서 직접 사용자 정보 추출
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        user = {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email || "",
          role: sessionData.session.user.user_metadata?.role || "user",
          isAdmin: sessionData.session.user.user_metadata?.role === "admin",
        }
      }
    }

    // 사용자 권한 확인
    let userPermissions: any[] = []
    if (user) {
      const { data: permissions, error: permError } = await supabase
        .from("user_region_permissions")
        .select("*")
        .eq("user_id", user.id)

      if (!permError) {
        userPermissions = permissions || []
      }
    }

    const isAdmin = user?.role === "admin"
    const hasPermissions = userPermissions.length > 0

    if (level === "provinces") {
      // 데이터베이스에 있는 시/도 목록 조회
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select("city_name")
        .order("city_name")

      if (citiesError) {
        return NextResponse.json({ success: false, error: "시/도 데이터 조회 실패" }, { status: 500 })
      }

      let cities = Array.from(new Set(citiesData.map((item) => item.city_name).filter(Boolean))).sort()

      // 권한 기반 필터링 (관리자가 아니고 권한이 설정된 경우)
      if (!isAdmin && hasPermissions) {
        const accessibleCities = new Set(userPermissions.map((p) => p.city_name))
        cities = cities.filter((city) => accessibleCities.has(city))
      }

      return NextResponse.json({ success: true, data: cities })
    }

    if (level === "districts" && province) {
      // 특정 시/도의 시/군/구 목록 조회
      const { data: districtsData, error: districtsError } = await supabase
        .from("districts")
        .select(`
          district_name,
          cities!inner(city_name)
        `)
        .eq("cities.city_name", province)
        .order("district_name")

      if (districtsError) {
        return NextResponse.json({ success: false, error: "시/군/구 데이터 조회 실패" }, { status: 500 })
      }

      let districts = Array.from(new Set(districtsData.map((item) => item.district_name).filter(Boolean))).sort()

      // 권한 기반 필터링 (관리자가 아니고 권한이 설정된 경우)
      if (!isAdmin && hasPermissions) {
        const accessibleDistricts = new Set(
          userPermissions.filter((p) => p.city_name === province).map((p) => p.district_name),
        )
        districts = districts.filter((district) => accessibleDistricts.has(district))
      }

      return NextResponse.json({ success: true, data: districts })
    }

    if (level === "dongs" && province && district) {
      // 특정 시/군/구의 읍/면/동 목록 조회
      const { data: neighborhoodsData, error: neighborhoodsError } = await supabase
        .from("neighborhoods")
        .select(`
          neighborhood_name,
          districts!inner(
            district_name,
            cities!inner(city_name)
          )
        `)
        .eq("districts.cities.city_name", province)
        .eq("districts.district_name", district)
        .order("neighborhood_name")

      if (neighborhoodsError) {
        return NextResponse.json({ success: false, error: "읍/면/동 데이터 조회 실패" }, { status: 500 })
      }

      let neighborhoods = Array.from(
        new Set(neighborhoodsData.map((item) => item.neighborhood_name).filter(Boolean)),
      ).sort()

      // 권한 기반 필터링 (관리자가 아니고 권한이 설정된 경우)
      if (!isAdmin && hasPermissions) {
        const accessibleNeighborhoods = new Set(
          userPermissions
            .filter((p) => p.city_name === province && p.district_name === district)
            .map((p) => p.neighborhood_name),
        )
        neighborhoods = neighborhoods.filter((neighborhood) => accessibleNeighborhoods.has(neighborhood))
      }

      return NextResponse.json({ success: true, data: neighborhoods })
    }

    return NextResponse.json({ success: false, error: "잘못된 요청 파라미터" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
