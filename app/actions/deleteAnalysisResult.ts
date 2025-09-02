"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteAnalysisResult(id: number) {
  try {
    const supabase = createClient()

    // 분석 결과 삭제
    const { error } = await supabase.from("analysis_results").delete().eq("id", id)

    if (error) {
      console.error("삭제 오류:", error)
      return { success: false, error: `삭제 중 오류가 발생했습니다: ${error.message}` }
    }

    // 캐시 갱신
    revalidatePath("/saved-results")

    return { success: true }
  } catch (error: any) {
    console.error("삭제 처리 오류:", error)
    return { success: false, error: `삭제 처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
