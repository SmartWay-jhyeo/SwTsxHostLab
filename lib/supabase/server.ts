import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

// createServerClient를 re-export
export { createServerClient } from "@supabase/ssr"

export function createClient() {
  const cookieStore = cookies()

  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("서버 측 Supabase 환경 변수가 설정되지 않았습니다.")

    // 개발 환경에서는 경고만 표시하고 더미 클라이언트 반환
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경: 더미 서버 Supabase 클라이언트를 사용합니다.")

      // 더미 클라이언트 반환 - 기본 메서드 구현
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: (table: string) => ({
          select: (columns?: string) => ({
            eq: (column: string, value: any) => ({
              single: async () => ({ data: null, error: null }),
              limit: (limit: number) => ({
                order: (column: string, options: any) => ({
                  then: async (callback: Function) => callback({ data: [], error: null }),
                }),
                orderBy: (column: string, options: any) => ({
                  then: async (callback: Function) => callback({ data: [], error: null }),
                }),
              }),
            }),
            limit: (limit: number) => ({
              order: (column: string, options: any) => ({
                then: async (callback: Function) => callback({ data: [], error: null }),
              }),
              orderBy: (column: string, options: any) => ({
                then: async (callback: Function) => callback({ data: [], error: null }),
              }),
            }),
            order: (column: string, options: any) => ({
              then: async (callback: Function) => callback({ data: [], error: null }),
            }),
            orderBy: (column: string, options: any) => ({
              eq: (column: string, value: any) => ({
                then: async (callback: Function) => callback({ data: null, error: null }),
              }),
              then: async (callback: Function) => callback({ data: [], error: null }),
            }),
            then: async (callback: Function) => callback({ data: [], error: null }),
          }),
          insert: (data: any) => ({
            select: (columns?: string) => ({
              then: async (callback: Function) => callback({ data: null, error: null }),
            }),
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => ({
              then: async (callback: Function) => callback({ data: null, error: null }),
            }),
          }),
          delete: () => ({
            eq: (column: string, value: any) => ({
              then: async (callback: Function) => callback({ data: null, error: null }),
            }),
          }),
        }),
      } as any
    }

    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.")
  }

  // 개발 환경에서만 디버깅 로그 출력
  const isDevelopment = process.env.NODE_ENV === "development"

  if (isDevelopment) {
    console.log("[Supabase Server] 서버 클라이언트 생성 중...")

    // 모든 쿠키 확인
    const allCookies = cookieStore.getAll()
    console.log("[Supabase Server] 전체 쿠키 개수:", allCookies.length)

    // Supabase 관련 쿠키만 표시
    const supabaseCookies = allCookies.filter((c) => c.name.includes("sb-"))
    if (supabaseCookies.length > 0) {
      console.log(
        "[Supabase Server] Supabase 쿠키:",
        supabaseCookies.map((c) => c.name),
      )
    }
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get(name) {
        const cookie = cookieStore.get(name)
        const value = cookie?.value

        // 개발 환경에서만 상세 로그 출력
        if (isDevelopment && name.includes("sb-")) {
          if (value) {
            console.log(`[Supabase Server] 쿠키 조회: ${name} = 존재함 (${value.length}자)`)
          } else {
            // 너무 많은 로그를 방지하기 위해 auth-token 관련만 간단히 표시
            if (name.includes("auth-token") && !name.includes(".")) {
              console.log(`[Supabase Server] 인증 토큰 없음`)
            }
          }
        }

        return value
      },
      set(name, value, options) {
        if (isDevelopment) {
          console.log(`[Supabase Server] 쿠키 설정: ${name}`)
        }
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          if (isDevelopment) {
            console.error(`[Supabase Server] 쿠키 설정 오류:`, error)
          }
        }
      },
      remove(name, options) {
        if (isDevelopment) {
          console.log(`[Supabase Server] 쿠키 삭제: ${name}`)
        }
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          if (isDevelopment) {
            console.error(`[Supabase Server] 쿠키 삭제 오류:`, error)
          }
        }
      },
    },
  })

  return supabase
}
