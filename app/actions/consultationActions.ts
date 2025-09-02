"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/session"

// 상담일지 저장
export async function saveConsultationNote(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "인증이 필요합니다." }
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const noteId = formData.get("noteId") as string | null

    if (!title || !content) {
      return { success: false, error: "제목과 내용은 필수 입력 항목입니다." }
    }

    const supabase = createClient()
    const now = new Date().toISOString()

    const noteData = {
      title,
      content,
      user_id: user.id,
      user_email: user.email,
      updated_at: now,
    }

    let result

    if (noteId) {
      // 기존 상담일지 수정
      result = await supabase.from("consultation_notes").update(noteData).eq("id", noteId).select()
    } else {
      // 새 상담일지 저장
      noteData.created_at = now
      result = await supabase.from("consultation_notes").insert([noteData]).select()
    }

    if (result.error) {
      console.error("상담일지 저장 오류:", result.error)
      return { success: false, error: `상담일지 저장 중 오류가 발생했습니다: ${result.error.message}` }
    }

    revalidatePath("/consultation")
    return { success: true, data: result.data[0] }
  } catch (error: any) {
    console.error("상담일지 저장 처리 오류:", error)
    return { success: false, error: `처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}

// 상담일지 삭제
export async function deleteConsultationNote(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "인증이 필요합니다." }
    }

    const noteId = formData.get("noteId") as string
    if (!noteId) {
      return { success: false, error: "삭제할 상담일지 ID가 필요합니다." }
    }

    const supabase = createClient()

    // 관리자가 아닌 경우 자신의 상담일지만 삭제 가능
    let query = supabase.from("consultation_notes").delete()

    if (!user.isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { error } = await query.eq("id", noteId)

    if (error) {
      console.error("상담일지 삭제 오류:", error)
      return { success: false, error: `상담일지 삭제 중 오류가 발생했습니다: ${error.message}` }
    }

    revalidatePath("/consultation")
    return { success: true }
  } catch (error: any) {
    console.error("상담일지 삭제 처리 오류:", error)
    return { success: false, error: `처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
