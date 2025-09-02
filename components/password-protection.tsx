"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface PasswordProtectionProps {
  id?: string
  correctPassword: string
  onPasswordVerified?: () => void
}

export function PasswordProtection({ id, correctPassword, onPasswordVerified }: PasswordProtectionProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError(null)

    // 비밀번호 검증 로직 개선
    // 양쪽 공백 제거 후 비교
    const trimmedPassword = password.trim()
    const trimmedCorrectPassword = correctPassword.trim()

    console.log("입력된 비밀번호:", trimmedPassword)
    console.log("저장된 비밀번호:", trimmedCorrectPassword)

    if (trimmedPassword === trimmedCorrectPassword) {
      // 비밀번호가 일치하는 경우
      if (onPasswordVerified) {
        onPasswordVerified()
      } else if (id) {
        // 세션 스토리지에 비밀번호 확인 상태 저장
        sessionStorage.setItem(`password_verified_${id}`, "true")
        router.refresh()
      }
    } else {
      setError("비밀번호가 일치하지 않습니다.")
    }

    setIsVerifying(false)
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <LockIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>비밀번호 보호</CardTitle>
          <CardDescription>이 분석 결과는 비밀번호로 보호되어 있습니다.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isVerifying}>
              {isVerifying ? "확인 중..." : "확인"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
