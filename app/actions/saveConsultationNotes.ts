"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveConsultationNotes(formData: FormData) {
  const content = formData.get("content") as string
  const analysisId = formData.get("analysisId") as string
  const roomIdsJson = formData.get("roomIds") as string
  // userId는 현재 데이터베이스에 해당 컬럼이 없으므로 사용하지 않음
  // const userId = formData.get("userId") as string

  // 필수 필드 검증
  if (!content) {
    return { success: false, error: "내용은 필수 입력 항목입니다." }
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 현재 시간
    const createdAt = new Date().toISOString()

    // 상담일지 저장
    const { data, error } = await supabase
      .from("consultation_notes")
      .insert({
        content,
        analysis_id: analysisId ? Number.parseInt(analysisId) : null,
        created_at: createdAt,
        updated_at: createdAt,
        // user_id 필드는 현재 데이터베이스에 존재하지 않으므로 제외
        // user_id: userId || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("저장 오류:", error)
      return { success: false, error: `데이터 저장 중 오류가 발생했습니다: ${error.message}` }
    }

    // 캐시 갱신
    revalidatePath("/saved-results")

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("저장 처리 오류:", error)
    return { success: false, error: `데이터 처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
