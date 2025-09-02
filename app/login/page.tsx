"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isLoggedIn } = useAuth()
  const router = useRouter()

  // 이미 로그인되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/")
    }
  }, [isLoggedIn, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.")
      setIsLoading(false)
      return
    }

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push("/")
      } else {
        setError(result.error || "로그인에 실패했습니다.")
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 테스트 로그인 정보 표시 (개발 환경에서만)
  const showTestLoginInfo = process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>33m² 분석 플랫폼에 접근하려면 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            {showTestLoginInfo && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">테스트 계정 정보 (개발 환경에서만 사용 가능):</p>
                <ul className="text-sm space-y-1">
                  <li>
                    <strong>관리자:</strong> admin@example.com / password
                  </li>
                  <li>
                    <strong>일반 사용자:</strong> user@example.com / password
                  </li>
                </ul>
              </div>
            )}
          </form>
          <div className="text-center text-sm text-gray-600 mt-4">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              회원가입하기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
