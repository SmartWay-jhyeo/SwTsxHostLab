"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: "오류", description: "비밀번호가 일치하지 않습니다.", variant: "destructive" })
      return
    }
    setLoading(true)
    const res = await signup(email, password, username)
    setLoading(false)

    if (res.success) {
      toast({
        title: "회원가입 완료",
        description: res.message ?? "이메일 인증 후 로그인해주세요.",
      })
      setTimeout(() => router.push("/login"), 3000)
    } else {
      toast({ title: "회원가입 실패", description: res.error, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">HostLab</h1>
          <h2 className="text-2xl font-light text-gray-900 mb-2">회원가입</h2>
          <p className="text-gray-600">단기임대 개별분석 플랫폼</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">사용자 이름</Label>
                <Input
                  id="username"
                  placeholder="이름 또는 별칭"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6자 이상"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">비밀번호 확인</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "가입 중..." : "가입하기"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-black font-medium hover:underline">
                로그인
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
