import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/session"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "인증되지 않은 사용자" }, { status: 401 })
    }

    const supabase = createClient()

    const { data, error } = await supabase.from("user_region_permissions").select("*").eq("user_id", user.id)

    if (error) {
      console.error("사용자 권한 조회 오류:", error)
      return NextResponse.json({ success: false, error: "권한 조회 실패" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("권한 API 오류:", error)
    return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 })
  }
}
