"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 개발 모드 확인
  const isDevelopment = process.env.NODE_ENV === "development"

  useEffect(() => {
    // 로컬 스토리지에서 직접 인증 상태 확인
    const checkAuth = () => {
      try {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token")
          const user = localStorage.getItem("auth_user")

          if (token && user) {
            setIsLoggedIn(true)
          } else {
            setIsLoggedIn(false)
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("인증 확인 중 오류:", error)
        setIsLoggedIn(false)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    if (isDevelopment) {
      console.log("[DEV MODE] 개발 모드에서 ProtectedRoute 인증 검사 우회")
    } else {
      checkAuth()
    }
  }, [router, isDevelopment])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!isLoggedIn && !isDevelopment) {
    return null
  }

  return <>{children}</>
}
