import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// 사용자 정보 캐시
const userCache = new Map<string, { user: any; timestamp: number }>()
const USER_CACHE_DURATION = 2 * 60 * 1000 // 2분

function getCachedUser(sessionId: string) {
  const cached = userCache.get(sessionId)
  if (cached && Date.now() - cached.timestamp < USER_CACHE_DURATION) {
    console.log(`✅ [사용자 캐시 히트] ${sessionId.substring(0, 8)}...`)
    return cached.user
  }
  return null
}

function setCachedUser(sessionId: string, user: any) {
  userCache.set(sessionId, { user, timestamp: Date.now() })
  console.log(`💾 [사용자 캐시 저장] ${user?.email || "unknown"}`)
}

export async function getCurrentUser() {
  try {
    // Supabase URL이 없는 경우에만 개발 모드 사용 (실제 DB 연결이 없을 때만)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("[DEV MODE] Supabase URL이 없어서 개발 모드 사용")

      // 쿠키에서 사용자 정보 확인 (클라이언트에서 설정한 정보)
      const cookieStore = cookies()
      const userCookie = cookieStore.get("dev_user")

      if (userCookie) {
        try {
          const user = JSON.parse(userCookie.value)
          console.log("[DEV MODE] 쿠키에서 사용자 정보 확인:", user)
          return {
            id: user.id,
            email: user.email,
            role: user.is_admin ? "admin" : "user",
            isAdmin: user.is_admin,
          }
        } catch (e) {
          console.error("[DEV MODE] 쿠키 파싱 오류:", e)
        }
      }

      // 쿠키가 없으면 기본 관리자 사용자 반환 (개발 편의를 위해)
      console.log("[DEV MODE] 기본 관리자 사용자 반환")
      return {
        id: "1",
        email: "admin@example.com",
        role: "admin",
        isAdmin: true,
      }
    }

    // Supabase URL이 있으면 실제 Supabase 인증 사용
    const supabase = createClient()

    // 세션 정보 먼저 확인
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      // 세션이 없는 경우, 개발 환경에서는 임시로 관리자 권한 부여
      if (process.env.NODE_ENV === "development") {
        console.log("[PROD MODE] 개발 환경에서 임시 관리자 권한 부여")
        return {
          id: "temp-admin",
          email: "temp-admin@hostlab.com",
          role: "admin",
          isAdmin: true,
        }
      }
      return null
    }

    // 캐시 확인
    const sessionId = sessionData.session.access_token.substring(0, 20)
    const cachedUser = getCachedUser(sessionId)
    if (cachedUser) {
      return cachedUser
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("사용자 정보 조회 오류:", error)

      // 세션은 있지만 getUser에 실패한 경우, 세션에서 사용자 정보 추출
      if (sessionData.session) {
        const sessionUser = sessionData.session.user
        console.log("[PROD MODE] 세션에서 사용자 정보 복구")

        const isAdmin = sessionUser.user_metadata?.role === "admin" || false

        const userInfo = {
          id: sessionUser.id,
          email: sessionUser.email || "",
          role: isAdmin ? "admin" : "user",
          isAdmin: isAdmin,
        }

        setCachedUser(sessionId, userInfo)
        return userInfo
      }

      return null
    }

    if (!user) {
      return null
    }

    // 관리자 권한 확인 - 메타데이터에서 먼저 확인
    let isAdmin = user.user_metadata?.role === "admin" || false

    // 메타데이터에 없으면 데이터베이스에서 확인 (캐시된 사용자가 아닌 경우에만)
    if (!isAdmin) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        if (!userError && userData?.is_admin) {
          isAdmin = true
        }
      } catch (dbError) {
        console.log("데이터베이스 권한 조회 건너뜀:", dbError)
      }
    }

    console.log("[PROD MODE] 사용자 권한 확인:", { email: user.email, isAdmin })

    // 실제 사용자 정보 반환
    const userInfo = {
      id: user.id,
      email: user.email || "",
      role: isAdmin ? "admin" : "user",
      isAdmin: isAdmin,
    }

    setCachedUser(sessionId, userInfo)
    return userInfo
  } catch (error) {
    console.error("getCurrentUser 오류:", error)

    // 오류 발생 시 개발 환경에서는 임시 관리자 권한 부여
    if (process.env.NODE_ENV === "development") {
      console.log("[ERROR FALLBACK] 개발 환경에서 임시 관리자 권한 부여")
      return {
        id: "error-fallback-admin",
        email: "error-fallback@hostlab.com",
        role: "admin",
        isAdmin: true,
      }
    }

    return null
  }
}

// 세션 정보 가져오기 (getSession)
export async function getSession() {
  // Supabase URL이 없는 경우에만 개발 모드 사용
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("[DEV MODE] Supabase URL이 없어서 더미 세션 반환")

    const cookieStore = cookies()
    const userCookie = cookieStore.get("dev_user")

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        return {
          user: {
            id: user.id,
            email: user.email,
            isAdmin: user.is_admin,
          },
          accessToken: "dev-access-token",
        }
      } catch (e) {
        console.error("[DEV MODE] 쿠키 파싱 오류:", e)
      }
    }

    return {
      user: {
        id: "1",
        email: "admin@example.com",
        isAdmin: true,
      },
      accessToken: "dev-access-token",
    }
  }

  // Supabase URL이 있으면 실제 세션 사용
  try {
    const supabase = createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error fetching session:", error.message)
      return null
    }

    if (!session) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        isAdmin: session.user.user_metadata?.is_admin || false,
      },
      accessToken: session.access_token,
    }
  } catch (error) {
    console.error("Unexpected error in getSession:", error)
    return null
  }
}

// 사용자가 관리자인지 확인하는 헬퍼 함수
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return !!user?.isAdmin
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
