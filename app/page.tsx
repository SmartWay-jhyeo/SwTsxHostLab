"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  // 로그인하지 않은 경우 로딩 표시
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* 메인 제목 */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            🏠 숙박업소 분석 플랫폼
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Host<span className="text-blue-600">Lab</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            데이터 기반의 정확한 분석으로 숙박업소 투자와 운영을 지원하는 전문 플랫폼입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
