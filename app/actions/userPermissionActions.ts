"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export interface UserPermission {
  id?: number
  user_id: string
  city_name: string | null
  district_name: string | null
  neighborhood_name: string | null
  user_email?: string
  user_username?: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
  created_at: string
  is_admin: boolean
  user_metadata?: any
}

// 모든 사용자와 권한 정보 가져오기
export async function getAllUserPermissions() {
  try {
    // 관리자 권한 확인
    const currentUser = await getCurrentUser()
    if (!currentUser?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." }
    }

    const supabase = createClient()

    // users 테이블에서 사용자 목록 가져오기 (username과 is_admin 포함)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, username, created_at, is_admin")
      .order("created_at")

    if (usersError) {
      console.error("사용자 목록 조회 오류:", usersError)
      return { success: false, error: "사용자 목록을 가져오는데 실패했습니다." }
    }

    // user_region_permissions 테이블에서 권한 목록 가져오기
    const { data: permissions, error: permissionsError } = await supabase
      .from("user_region_permissions")
      .select("id, user_id, city_name, district_name, neighborhood_name, created_at")
      .order("user_id, city_name, district_name, neighborhood_name")

    if (permissionsError) {
      console.error("권한 목록 조회 오류:", permissionsError)
      return { success: false, error: "권한 목록을 가져오는데 실패했습니다." }
    }

    // 권한에 사용자 정보 매핑
    const permissionsWithUserInfo =
      permissions?.map((permission) => {
        const user = users?.find((u) => u.id === permission.user_id)
        return {
          ...permission,
          user_email: user?.email || "알 수 없음",
          user_username: user?.username || "알 수 없음",
        }
      }) || []

    return {
      success: true,
      data: {
        users: users || [],
        permissions: permissionsWithUserInfo,
      },
    }
  } catch (error) {
    console.error("getAllUserPermissions 오류:", error)
    return { success: false, error: "데이터를 가져오는데 실패했습니다." }
  }
}

// 지역 데이터 가져오기 (실제 데이터베이스에서)
export async function getRegionData() {
  try {
    // 관리자 권한 확인
    const currentUser = await getCurrentUser()
    if (!currentUser?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." }
    }

    const supabase = createClient()

    // 시/도 목록 가져오기
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("city_id, city_name")
      .order("city_name")

    if (citiesError) {
      console.error("시/도 목록 조회 오류:", citiesError)
      return { success: false, error: "시/도 목록을 가져오는데 실패했습니다." }
    }

    // 시/군/구 목록 가져오기
    const { data: districts, error: districtsError } = await supabase
      .from("districts")
      .select("district_id, city_id, district_name")
      .order("district_name")

    if (districtsError) {
      console.error("시/군/구 목록 조회 오류:", districtsError)
      return { success: false, error: "시/군/구 목록을 가져오는데 실패했습니다." }
    }

    // 읍/면/동 목록 가져오기
    const { data: neighborhoods, error: neighborhoodsError } = await supabase
      .from("neighborhoods")
      .select("neighborhood_id, district_id, neighborhood_name")
      .order("neighborhood_name")

    if (neighborhoodsError) {
      console.error("읍/면/동 목록 조회 오류:", neighborhoodsError)
      return { success: false, error: "읍/면/동 목록을 가져오는데 실패했습니다." }
    }

    // 데이터 구조화
    const regionStructure: { [cityName: string]: { [districtName: string]: string[] } } = {}

    // 시/도별로 구조화
    cities?.forEach((city) => {
      regionStructure[city.city_name] = {}

      // 해당 시/도의 시/군/구 찾기
      const cityDistricts = districts?.filter((district) => district.city_id === city.city_id) || []

      cityDistricts.forEach((district) => {
        regionStructure[city.city_name][district.district_name] = []

        // 해당 시/군/구의 읍/면/동 찾기
        const districtNeighborhoods =
          neighborhoods?.filter((neighborhood) => neighborhood.district_id === district.district_id) || []

        districtNeighborhoods.forEach((neighborhood) => {
          regionStructure[city.city_name][district.district_name].push(neighborhood.neighborhood_name)
        })
      })
    })

    return { success: true, data: regionStructure }
  } catch (error) {
    console.error("getRegionData 오류:", error)
    return { success: false, error: "지역 데이터를 가져오는데 실패했습니다." }
  }
}

// 권한 추가
export async function addUserPermission(permission: Omit<UserPermission, "id">) {
  try {
    // 관리자 권한 확인
    const currentUser = await getCurrentUser()
    if (!currentUser?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." }
    }

    const supabase = createClient()

    // 중복 권한 확인
    let query = supabase.from("user_region_permissions").select("id").eq("user_id", permission.user_id)

    if (permission.city_name) {
      query = query.eq("city_name", permission.city_name)
    } else {
      query = query.is("city_name", null)
    }

    if (permission.district_name) {
      query = query.eq("district_name", permission.district_name)
    } else {
      query = query.is("district_name", null)
    }

    if (permission.neighborhood_name) {
      query = query.eq("neighborhood_name", permission.neighborhood_name)
    } else {
      query = query.is("neighborhood_name", null)
    }

    const { data: existing, error: checkError } = await query

    if (checkError) {
      console.error("중복 권한 확인 오류:", checkError)
      return { success: false, error: "권한 확인 중 오류가 발생했습니다." }
    }

    if (existing && existing.length > 0) {
      return { success: false, error: "이미 동일한 권한이 존재합니다." }
    }

    // 권한 추가
    const { error } = await supabase.from("user_region_permissions").insert([
      {
        user_id: permission.user_id,
        city_name: permission.city_name,
        district_name: permission.district_name,
        neighborhood_name: permission.neighborhood_name,
      },
    ])

    if (error) {
      console.error("권한 추가 오류:", error)
      return { success: false, error: "권한 추가에 실패했습니다." }
    }

    revalidatePath("/admin/user-permissions")
    return { success: true }
  } catch (error) {
    console.error("addUserPermission 오류:", error)
    return { success: false, error: "권한 추가 중 오류가 발생했습니다." }
  }
}

// 권한 삭제
export async function deleteUserPermission(permissionId: number) {
  try {
    // 관리자 권한 확인
    const currentUser = await getCurrentUser()
    if (!currentUser?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." }
    }

    const supabase = createClient()

    const { error } = await supabase.from("user_region_permissions").delete().eq("id", permissionId)

    if (error) {
      console.error("권한 삭제 오류:", error)
      return { success: false, error: "권한 삭제에 실패했습니다." }
    }

    revalidatePath("/admin/user-permissions")
    return { success: true }
  } catch (error) {
    console.error("deleteUserPermission 오류:", error)
    return { success: false, error: "권한 삭제 중 오류가 발생했습니다." }
  }
}

// 사용자의 모든 권한 삭제
export async function deleteAllUserPermissions(userId: string) {
  try {
    // 관리자 권한 확인
    const currentUser = await getCurrentUser()
    if (!currentUser?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." }
    }

    const supabase = createClient()

    const { error } = await supabase.from("user_region_permissions").delete().eq("user_id", userId)

    if (error) {
      console.error("사용자 권한 삭제 오류:", error)
      return { success: false, error: "사용자 권한 삭제에 실패했습니다." }
    }

    revalidatePath("/admin/user-permissions")
    return { success: true }
  } catch (error) {
    console.error("deleteAllUserPermissions 오류:", error)
    return { success: false, error: "사용자 권한 삭제 중 오류가 발생했습니다." }
  }
}
