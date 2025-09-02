"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import Link from "next/link"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<string>("")

  useEffect(() => {
    // 전역 오류 핸들러 등록
    const handleError = (event: ErrorEvent) => {
      console.error("전역 오류 발생:", event.error)
      setHasError(true)
      setError(event.error)
      setErrorInfo(event.message)

      // 오류 보고 로직을 여기에 추가할 수 있습니다
    }

    // 전역 오류 이벤트 리스너 등록
    window.addEventListener("error", handleError)

    // 정리 함수
    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [])

  // 오류가 발생하지 않았으면 자식 컴포넌트 렌더링
  if (!hasError) {
    return <>{children}</>
  }

  // 사용자 정의 폴백이 제공된 경우 사용
  if (fallback) {
    return <>{fallback}</>
  }

  // 기본 오류 UI
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>오류가 발생했습니다</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            페이지를 로드하는 중 문제가 발생했습니다. 다시 시도하거나 홈으로 이동해주세요.
          </p>
          {error && process.env.NODE_ENV !== "production" && (
            <div className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-32">
              <p className="font-semibold">{error.toString()}</p>
              {errorInfo && <p className="mt-1">{errorInfo}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
