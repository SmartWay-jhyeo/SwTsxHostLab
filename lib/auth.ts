"use client"

import { createClient } from "@/lib/supabase/client"

// 사용자 타입 정의
export interface User {
  id: string
  email: string
  username: string
  is_admin: boolean
}

// 로컬 스토리지 키
const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

// 회원가입 함수
export async function signupUser(
  email: string,
  password: string,
  username: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error }

    return { success: true, message: data.message || "회원가입이 완료되었습니다. 이메일을 확인해주세요." }
  } catch (e) {
    console.error("signupUser error:", e)
    return { success: false, error: "회원가입 중 오류가 발생했습니다." }
  }
}

// 사용자 로그인 함수
export async function loginUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Supabase URL이 없는 경우에만 테스트용 로그인 허용
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("Using test login - no Supabase URL configured")

      // 테스트 계정 확인 (admin@example.com / password)
      if (email === "admin@example.com" && password === "password") {
        const user: User = {
          id: "1",
          email: "admin@example.com",
          username: "admin",
          is_admin: true,
        }

        localStorage.setItem(TOKEN_KEY, "test-token")
        localStorage.setItem(USER_KEY, JSON.stringify(user))

        // 개발모드에서 서버에서도 인식할 수 있도록 쿠키 설정
        document.cookie = `dev_user=${JSON.stringify(user)}; path=/; max-age=86400`

        return { success: true }
      }

      // 테스트 계정 확인 (user@example.com / password)
      if (email === "user@example.com" && password === "password") {
        const user: User = {
          id: "2",
          email: "user@example.com",
          username: "user",
          is_admin: false,
        }

        localStorage.setItem(TOKEN_KEY, "test-token")
        localStorage.setItem(USER_KEY, JSON.stringify(user))

        // 개발모드에서 서버에서도 인식할 수 있도록 쿠키 설정
        document.cookie = `dev_user=${JSON.stringify(user)}; path=/; max-age=86400`

        return { success: true }
      }

      return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }
    }

    // Supabase URL이 있으면 실제 Supabase 인증 사용
    console.log("Using Supabase authentication")
    const supabase = createClient()

    // Supabase Auth를 사용하여 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase login error:", error)
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "로그인에 실패했습니다." }
    }

    try {
      // 사용자 정보 가져오기 - single() 대신 limit(1)을 사용하여 오류 방지
      const { data: userDataArray, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1)

      if (userError) {
        console.error("User data fetch error:", userError)
        return { success: false, error: "사용자 정보를 가져오는데 실패했습니다." }
      }

      if (!userDataArray || userDataArray.length === 0) {
        console.error("No user found with this email")
        return { success: false, error: "등록된 사용자를 찾을 수 없습니다." }
      }

      const userData = userDataArray[0]

      // 로컬 스토리지에 사용자 정보 저장
      const user: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        is_admin: userData.is_admin,
      }

      localStorage.setItem(TOKEN_KEY, data.session?.access_token || "")
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (err) {
      console.error("사용자 정보 가져오기 오류:", err)
      // 기본 사용자 정보 설정
      const user: User = {
        id: data.user.id,
        email: data.user.email || email,
        username: email.split("@")[0],
        is_admin: false,
      }

      localStorage.setItem(TOKEN_KEY, data.session?.access_token || "")
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }

    return { success: true }
  } catch (error) {
    console.error("로그인 오류:", error)
    return { success: false, error: "로그인 중 오류가 발생했습니다." }
  }
}

// 사용자 로그아웃 함수
export async function logoutUser(): Promise<void> {
  try {
    // Supabase 클라이언트가 있는 경우에만 signOut 호출
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.error("로그아웃 오류:", error)
  } finally {
    // 로컬 스토리지에서 사용자 정보 제거
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)

      // 개발모드에서 쿠키도 삭제
      document.cookie = "dev_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

      // 이벤트를 발생시켜 다른 탭에서도 로그아웃 상태를 감지하도록 합니다
      window.dispatchEvent(new Event("storage"))
    }
  }
}

// 현재 사용자 정보 가져오기
export function getCurrentUser(): User | null {
  try {
    if (typeof window === "undefined") return null

    const userJson = localStorage.getItem(USER_KEY)
    if (!userJson) return null

    return JSON.parse(userJson) as User
  } catch (error) {
    console.error("사용자 정보 파싱 오류:", error)
    return null
  }
}

// 인증 상태 확인
export function isAuthenticated(): boolean {
  try {
    if (typeof window === "undefined") return false

    const token = localStorage.getItem(TOKEN_KEY)
    const user = getCurrentUser()

    return !!(token && user)
  } catch (error) {
    console.error("인증 상태 확인 오류:", error)
    return false
  }
}

// 관리자 권한 확인
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user ? user.is_admin : false
}
