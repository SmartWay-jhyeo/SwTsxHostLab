import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAccessibleCities, getAccessibleDistricts, getAccessibleNeighborhoods } from "@/lib/user-permissions"
import { getCurrentUser } from "@/lib/session"

// 메모리 캐시 - 더 효율적인 구현
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10분

function getCachedData(key: string) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ [캐시 히트] ${key}`)
    return cached.data
  }
  return null
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
  console.log(`💾 [캐시 저장] ${key} - ${data.length}개 항목`)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level")
  const province = searchParams.get("province")
  const district = searchParams.get("district")

  console.log(`🔍 [지역 API] 요청: level=${level}, province=${province}, district=${district}`)

  try {
    const supabase = createClient()

    // 사용자 정보 및 권한 확인 - 최적화
    const user = await getCurrentUser()
    const isAdmin = user?.isAdmin || false
    const allowAllAccess = !user || isAdmin

    console.log(`👤 [지역 API] 사용자: ${user?.email || "guest"}, 관리자: ${isAdmin}, 전체접근: ${allowAllAccess}`)

    if (level === "provinces") {
      const cacheKey = `provinces_${user?.id || "guest"}`
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData })
      }

      // 최적화된 쿼리 - 필요한 컬럼만 선택
      const { data: citiesData, error } = await supabase.from("cities").select("city_name").order("city_name")

      if (error) {
        console.error("❌ 시/도 조회 오류:", error)
        return NextResponse.json({ success: false, error: "시/도 데이터 조회 실패" }, { status: 500 })
      }

      let cities = [...new Set(citiesData.map((item) => item.city_name).filter(Boolean))].sort()

      // 권한 필터링 - 관리자가 아닌 경우에만
      if (!allowAllAccess) {
        console.log("🔒 [권한 필터링] 시/도 권한 확인 중...")
        const accessibleCities = await getAccessibleCities()
        if (accessibleCities.length > 0) {
          cities = cities.filter((city) => accessibleCities.includes(city))
          console.log(`✅ [권한 필터링] ${cities.length}개 시/도 접근 가능`)
        }
      }

      setCachedData(cacheKey, cities)
      return NextResponse.json({ success: true, data: cities })
    }

    if (level === "districts" && province) {
      const cacheKey = `districts_${province}_${user?.id || "guest"}`
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData })
      }

      // 더 효율적인 쿼리 - JOIN 최적화
      const { data: districtsData, error } = await supabase
        .from("districts")
        .select(`
          district_name,
          cities!inner(city_name)
        `)
        .eq("cities.city_name", province)
        .order("district_name")

      if (error) {
        console.error("❌ 시/군/구 조회 오류:", error)
        return NextResponse.json({ success: false, error: "시/군/구 데이터 조회 실패" }, { status: 500 })
      }

      let districts = [...new Set(districtsData.map((item) => item.district_name).filter(Boolean))].sort()

      // 권한 필터링 - 관리자가 아닌 경우에만
      if (!allowAllAccess) {
        console.log("🔒 [권한 필터링] 시/군/구 권한 확인 중...")
        const accessibleDistricts = await getAccessibleDistricts(province)
        if (accessibleDistricts.length > 0) {
          districts = districts.filter((district) => accessibleDistricts.includes(district))
          console.log(`✅ [권한 필터링] ${districts.length}개 시/군/구 접근 가능`)
        }
      }

      setCachedData(cacheKey, districts)
      return NextResponse.json({ success: true, data: districts })
    }

    if (level === "dongs" && province && district) {
      const cacheKey = `dongs_${province}_${district}_${user?.id || "guest"}`
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData })
      }

      // 최적화된 쿼리
      const { data: neighborhoodsData, error } = await supabase
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

      if (error) {
        console.error("❌ 읍/면/동 조회 오류:", error)
        return NextResponse.json({ success: false, error: "읍/면/동 데이터 조회 실패" }, { status: 500 })
      }

      let neighborhoods = [...new Set(neighborhoodsData.map((item) => item.neighborhood_name).filter(Boolean))].sort()

      // 권한 필터링 - 관리자가 아닌 경우에만
      if (!allowAllAccess) {
        console.log("🔒 [권한 필터링] 읍/면/동 권한 확인 중...")
        const accessibleNeighborhoods = await getAccessibleNeighborhoods(province, district)
        if (accessibleNeighborhoods.length > 0) {
          neighborhoods = neighborhoods.filter((neighborhood) => accessibleNeighborhoods.includes(neighborhood))
          console.log(`✅ [권한 필터링] ${neighborhoods.length}개 읍/면/동 접근 가능`)
        }
      }

      setCachedData(cacheKey, neighborhoods)
      return NextResponse.json({ success: true, data: neighborhoods })
    }

    return NextResponse.json({ success: false, error: "잘못된 요청 파라미터" }, { status: 400 })
  } catch (error) {
    console.error("❌ [지역 API] 오류:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
