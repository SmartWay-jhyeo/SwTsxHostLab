import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: "필수 값이 누락되었습니다." }, { status: 400 })
    }

    // 개발 환경(로컬)에서는 Supabase 설정이 없을 수 있음
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("[Signup] 개발 모드 – 더미 응답 반환")
      return NextResponse.json({ message: "개발 모드 회원가입 성공" }, { status: 200 })
    }

    const supabase = createClient()

    /* 1) Supabase Auth 사용자 생성 */
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      console.error("[Signup] Supabase Auth Error:", authError?.message)
      return NextResponse.json({ error: authError?.message || "회원가입 실패" }, { status: 500 })
    }

    /* 2) users 테이블에 프로필 삽입 */
    const { error: insertError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      username,
      is_admin: false,
    })

    if (insertError) {
      console.error("[Signup] DB Insert Error:", insertError.message)
      return NextResponse.json({ error: "데이터베이스 저장 실패" }, { status: 500 })
    }

    return NextResponse.json({ message: "회원가입이 완료되었습니다." }, { status: 200 })
  } catch (err) {
    console.error("[Signup] Unknown Error:", err)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
