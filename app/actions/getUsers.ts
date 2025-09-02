"use server"

import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/session"

export async function getUsers() {
  try {
    // 관리자 권한 확인
    const isAdminUser = await isAdmin()
    if (!isAdminUser) {
      return { success: false, error: "관리자 권한이 필요합니다." }
    }

    const supabase = createClient()

    // 프로필 테이블에서 사용자 정보 가져오기
    const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("id, email")

    if (profilesError) {
      console.error("프로필 목록 불러오기 오류:", profilesError)

      // 프로필 테이블이 없거나 오류가 발생한 경우, 상담일지 테이블에서 고유 사용자 추출
      const { data: notesData, error: notesError } = await supabase
        .from("consultation_notes")
        .select("user_id, user_email")
        .order("created_at", { ascending: false })

      if (notesError) {
        return { success: false, error: `사용자 목록을 불러올 수 없습니다: ${notesError.message}` }
      }

      // 고유한 사용자 ID와 이메일 추출
      const uniqueUsers = Array.from(
        new Map(notesData.map((item) => [item.user_id, { id: item.user_id, email: item.user_email }])).values(),
      )

      return { success: true, data: uniqueUsers }
    }

    // 프로필 데이터 사용
    const users = profilesData.map((profile) => ({
      id: profile.id,
      email: profile.email,
    }))

    return { success: true, data: users }
  } catch (error: any) {
    console.error("사용자 목록 불러오기 오류:", error)
    return { success: false, error: `처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
