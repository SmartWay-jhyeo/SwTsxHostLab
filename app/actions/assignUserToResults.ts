"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/session"

export async function assignUserToResults(formData: FormData) {
  // 관리자 권한 확인
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return { success: false, error: "관리자 권한이 필요합니다." }
  }

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const userId = formData.get("userId") as string
  const resultId = formData.get("resultId") as string
  const batchAssign = formData.get("batchAssign") as string

  if (!userId) {
    return { success: false, error: "사용자를 선택해주세요." }
  }

  try {
    if (batchAssign === "true") {
      // 모든 소유자 없는 결과를 일괄 할당
      const { error } = await supabase.from("analysis_results").update({ user_id: userId }).is("user_id", null)

      if (error) {
        console.error("일괄 할당 오류:", error)
        return { success: false, error: `일괄 할당 중 오류가 발생했습니다: ${error.message}` }
      }
    } else if (resultId) {
      // 단일 결과 할당
      const { error } = await supabase.from("analysis_results").update({ user_id: userId }).eq("id", resultId)

      if (error) {
        console.error("소유자 할당 오류:", error)
        return { success: false, error: `소유자 할당 중 오류가 발생했습니다: ${error.message}` }
      }
    } else {
      return { success: false, error: "결과 ID가 필요합니다." }
    }

    // 캐시 갱신
    revalidatePath("/saved-results")
    revalidatePath("/admin/assign-users")

    // 성공 시 리다이렉트
    redirect("/admin/assign-users")
  } catch (error: any) {
    console.error("소유자 할당 처리 오류:", error)
    return { success: false, error: `처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
