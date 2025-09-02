import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // 요청 경로 로깅
  console.log(`[Middleware] 요청 경로: ${request.nextUrl.pathname}`)

  // Supabase URL이 없거나 명시적으로 인증을 건너뛰는 경우에만 우회
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    console.log("[DEV MODE] Supabase URL이 없어서 미들웨어 인증 검사 우회")
    return NextResponse.next()
  }

  // 여기에 추가적인 인증 검사 로직을 구현할 수 있습니다
  // 예: 쿠키 확인, 토큰 검증 등

  return NextResponse.next()
}

// 미들웨어가 실행될 경로 지정
export const config = {
  matcher: ["/saved-results/:path*", "/search/:path*", "/analysis/:path*", "/compare/:path*", "/admin/:path*"],
}
