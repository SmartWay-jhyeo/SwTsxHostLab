import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/session"

export interface UserRegionPermission {
  user_id: string
  city_name: string | null
  district_name: string | null
  neighborhood_name: string | null
}

// 권한 캐시 - 메모리 캐시로 성능 향상
const permissionsCache = new Map<string, { data: UserRegionPermission[]; timestamp: number }>()
const PERMISSIONS_CACHE_DURATION = 5 * 60 * 1000 // 5분

function getCachedPermissions(userId: string): UserRegionPermission[] | null {
  const cached = permissionsCache.get(userId)
  if (cached && Date.now() - cached.timestamp < PERMISSIONS_CACHE_DURATION) {
    console.log(`✅ [권한 캐시 히트] 사용자 ${userId}`)
    return cached.data
  }
  return null
}

function setCachedPermissions(userId: string, data: UserRegionPermission[]) {
  permissionsCache.set(userId, { data, timestamp: Date.now() })
  console.log(`💾 [권한 캐시 저장] 사용자 ${userId} - ${data.length}개 권한`)
}

// 현재 사용자의 지역 권한 조회 - 캐시 적용
export async function getUserRegionPermissions(): Promise<UserRegionPermission[]> {
  try {
    const user = await getCurrentUser()
    console.log("🔍 [권한 조회] 현재 로그인한 사용자:", user?.email)

    if (!user) {
      console.log("❌ [권한 조회] 로그인한 사용자가 없습니다")
      return []
    }

    // 관리자는 모든 권한 (빈 배열 반환으로 모든 지역 접근 가능)
    if (user.isAdmin) {
      console.log("✅ [권한 조회] 관리자 - 모든 지역 접근 가능")
      return []
    }

    // 캐시 확인
    const cachedPermissions = getCachedPermissions(user.id)
    if (cachedPermissions) {
      return cachedPermissions
    }

    const supabase = createClient()

    console.log("🔍 [권한 조회] 사용자 ID로 권한 조회 중:", user.id)

    // 최적화된 쿼리 - 필요한 컬럼만 선택
    const { data, error } = await supabase
      .from("user_region_permissions")
      .select("user_id, city_name, district_name, neighborhood_name")
      .eq("user_id", user.id)

    if (error) {
      console.error("❌ [권한 조회] 사용자 권한 조회 오류:", error)
      return []
    }

    console.log("✅ [권한 조회] 조회된 권한 데이터:", data?.length || 0, "개")

    const permissions = data || []
    setCachedPermissions(user.id, permissions)

    return permissions
  } catch (error) {
    console.error("❌ [권한 조회] 권한 확인 중 오류:", error)
    return []
  }
}

// 사용자가 접근 가능한 모든 시/도 목록 반환 - 최적화
export async function getAccessibleCities(): Promise<string[]> {
  const permissions = await getUserRegionPermissions()

  if (permissions.length === 0) {
    // 권한이 없으면 모든 시/도 접근 가능 (관리자 또는 권한 미설정)
    return []
  }

  // 중복 제거하여 접근 가능한 시/도 목록 반환
  const cities = Array.from(new Set(permissions.map((p) => p.city_name).filter(Boolean)))
  console.log("🔍 [접근 가능 시/도]", cities.length, "개:", cities)
  return cities
}

// 사용자가 특정 시/도에서 접근 가능한 모든 시/군/구 목록 반환 - 최적화
export async function getAccessibleDistricts(cityName: string): Promise<string[]> {
  const permissions = await getUserRegionPermissions()

  if (permissions.length === 0) {
    // 권한이 없으면 모든 시/군/구 접근 가능
    return []
  }

  const cityPermissions = permissions.filter((p) => p.city_name === cityName)

  // 시/도 전체 권한이 있으면 모든 시/군/구 접근 가능
  if (cityPermissions.some((p) => p.district_name === null)) {
    return []
  }

  // 접근 가능한 시/군/구 목록 반환
  const districts = Array.from(new Set(cityPermissions.map((p) => p.district_name).filter(Boolean)))
  console.log(`🔍 [${cityName} 접근 가능 시/군/구]`, districts.length, "개:", districts)
  return districts
}

// 사용자가 특정 시/군/구에서 접근 가능한 모든 읍/면/동 목록 반환 - 최적화
export async function getAccessibleNeighborhoods(cityName: string, districtName: string): Promise<string[]> {
  const permissions = await getUserRegionPermissions()

  if (permissions.length === 0) {
    // 권한이 없으면 모든 읍/면/동 접근 가능
    return []
  }

  const districtPermissions = permissions.filter(
    (p) => p.city_name === cityName && (p.district_name === districtName || p.district_name === null),
  )

  // 시/도 전체 권한이나 시/군/구 전체 권한이 있으면 모든 읍/면/동 접근 가능
  if (districtPermissions.some((p) => p.district_name === null || p.neighborhood_name === null)) {
    return []
  }

  // 접근 가능한 읍/면/동 목록 반환
  const neighborhoods = Array.from(new Set(districtPermissions.map((p) => p.neighborhood_name).filter(Boolean)))
  console.log(`🔍 [${cityName} ${districtName} 접근 가능 읍/면/동]`, neighborhoods.length, "개:", neighborhoods)
  return neighborhoods
}

// 빠른 권한 체크 함수들 - 불필요한 로그 제거
export async function canAccessCity(cityName: string): Promise<boolean> {
  const permissions = await getUserRegionPermissions()

  if (permissions.length === 0) {
    return true // 관리자 또는 권한 미설정
  }

  return permissions.some((p) => p.city_name === cityName)
}

export async function canAccessDistrict(cityName: string, districtName: string): Promise<boolean> {
  const permissions = await getUserRegionPermissions()

  if (permissions.length === 0) {
    return true
  }

  return permissions.some((p) => {
    if (p.city_name !== cityName) return false
    if (p.district_name === null) return true // 시/도 전체 권한
    return p.district_name === districtName
  })
}

export async function canAccessNeighborhood(
  cityName: string,
  districtName: string,
  neighborhoodName: string,
): Promise<boolean> {
  const permissions = await getUserRegionPermissions()

  if (permissions.length === 0) {
    return true
  }

  return permissions.some((p) => {
    if (p.city_name !== cityName) return false
    if (p.district_name === null) return true // 시/도 전체 권한
    if (p.district_name !== districtName) return false
    if (p.neighborhood_name === null) return true // 시/군/구 전체 권한
    return p.neighborhood_name === neighborhoodName
  })
}
