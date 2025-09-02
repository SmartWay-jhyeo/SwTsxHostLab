import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("클라이언트 측 Supabase 환경 변수가 설정되지 않았습니다.")
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.")
  }

  // 개발 환경 체크
  const isDevelopment = process.env.NODE_ENV === "development"

  // 싱글톤 패턴으로 클라이언트 생성
  if (!supabaseClient) {
    if (isDevelopment) {
      console.log("Using Supabase authentication")
    }

    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          if (typeof document !== "undefined") {
            const value = document.cookie
              .split("; ")
              .find((row) => row.startsWith(`${name}=`))
              ?.split("=")[1]

            // 개발 환경에서만 로그 출력
            if (isDevelopment && name.includes("sb-") && value) {
              console.log(`[Supabase Client] 쿠키 조회: ${name} = 존재함`)
            }
            return value
          }
          return undefined
        },
        set(name, value, options) {
          if (typeof document !== "undefined") {
            if (isDevelopment) {
              console.log(`[Supabase Client] 쿠키 설정: ${name}`)
            }

            let cookieString = `${name}=${value}`

            if (options?.expires) {
              cookieString += `; expires=${options.expires.toUTCString()}`
            }
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            }
            if (options?.secure) {
              cookieString += `; secure`
            }
            if (options?.httpOnly) {
              cookieString += `; httponly`
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }

            document.cookie = cookieString
          }
        },
        remove(name, options) {
          if (typeof document !== "undefined") {
            if (isDevelopment) {
              console.log(`[Supabase Client] 쿠키 삭제: ${name}`)
            }
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || "/"}`
          }
        },
      },
    })

    if (isDevelopment) {
      console.log("Supabase 클라이언트가 성공적으로 생성되었습니다.")
    }
  }

  return supabaseClient
}
