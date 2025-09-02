"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { SearchResults } from "@/components/search-results"
import { ArrowLeft, FileSearch, AlertTriangle, Bug } from "lucide-react"
import { PasswordProtection } from "@/components/password-protection"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConsultationNotes } from "@/components/consultation-notes"
import { DeleteResultButton } from "@/components/delete-result-button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"

// 개발 모드 확인
const isDevelopment = process.env.NODE_ENV === "development"

interface SavedResultPageProps {
  params: {
    id: string
  }
}

// 개발 모드 테스트 데이터
const DEV_TEST_DATA = {
  id: 1,
  title: "개발 모드 테스트 데이터",
  location: "서울시 강남구",
  created_at: new Date().toISOString(),
  room_count: 10,
  client_name: "테스트 고객",
  description: "개발 모드에서 사용하는 테스트 데이터입니다.",
  data: Array(10)
    .fill(0)
    .map((_, i) => ({
      id: i + 1,
      name: `테스트 매물 ${i + 1}`,
      price: 100000000 + i * 10000000,
      address: `서울시 강남구 테스트동 ${i + 1}번지`,
      size: 20 + i,
      room_type: i % 2 === 0 ? "원룸" : "투룸",
      building_type: i % 3 === 0 ? "아파트" : i % 3 === 1 ? "오피스텔" : "빌라",
      floor: i + 1,
      reservation_rate: 70 + i * 2,
      monthly_revenue: 1000000 + i * 100000,
      images: [`/placeholder.svg?height=200&width=300&query=property ${i + 1}`],
    })),
}

// 오류 발생 시 표시할 폴백 UI
function ErrorFallback() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">페이지 로드 오류</h2>
        <p className="text-muted-foreground mb-6">저장된 결과를 불러오는 중 오류가 발생했습니다.</p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/saved-results">목록으로 돌아가기</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    </div>
  )
}

function SavedResultPageContent({ params }: SavedResultPageProps) {
  const { id } = params
  const router = useRouter()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [tableNotExist, setTableNotExist] = useState(false)
  const [activeTab, setActiveTab] = useState("analysis")
  const { user } = useAuth()
  const { toast } = useToast()
  const [debugMode, setDebugMode] = useState(false)

  // 디버그 모드 토글 함수
  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
    toast({
      title: debugMode ? "디버그 모드 비활성화" : "디버그 모드 활성화",
      description: debugMode ? "디버그 정보가 숨겨집니다." : "디버그 정보가 표시됩니다.",
    })
  }

  useEffect(() => {
    const fetchResult = async () => {
      // 개발 모드에서는 항상 테스트 데이터 사용
      if (isDevelopment) {
        setTimeout(() => {
          setResult(DEV_TEST_DATA)
          setIsPasswordVerified(true)
          setLoading(false)
        }, 500) // 로딩 시뮬레이션
        return
      }

      try {
        const supabase = createClient()

        // 저장된 분석 결과 가져오기
        const { data, error: queryError } = await supabase
          .from("analysis_results")
          .select("*")
          .eq("id", id)
          .maybeSingle()

        // 쿼리 오류 처리
        if (queryError) {
          // 테이블이 없는 경우
          if (queryError.message.includes("relation") && queryError.message.includes("does not exist")) {
            setTableNotExist(true)
            return
          }

          setError(`데이터를 불러올 수 없습니다: ${queryError.message}`)
          return
        }

        // 결과가 없는 경우
        if (!data) {
          setNotFound(true)
          return
        }

        // 데이터 유효성 검사
        if (!data.data) {
          setError("분석 결과 데이터가 없습니다.")
          return
        }

        try {
          // data 필드가 문자열인 경우 JSON으로 파싱
          if (typeof data.data === "string") {
            try {
              data.data = JSON.parse(data.data)
            } catch (parseError) {
              setError("데이터 형식이 올바르지 않습니다.")
              return
            }
          }

          // 배열인지 확인
          if (!Array.isArray(data.data)) {
            setError("데이터 형식이 올바르지 않습니다.")
            return
          }

          // 배열이 비어있는지 확인
          if (data.data.length === 0) {
            // 빈 배열은 허용하지만 경고 표시
            toast({
              title: "빈 분석 결과",
              description: "이 분석에는 매물 데이터가 없습니다.",
              variant: "warning",
            })
          }
        } catch (validationError) {
          setError("데이터 검증 중 오류가 발생했습니다.")
          return
        }

        setResult(data)

        // 비밀번호 확인 상태 체크
        if (data.password) {
          // 세션 스토리지에서 비밀번호 확인 상태 확인
          const isVerified = sessionStorage.getItem(`password_verified_${id}`) === "true"
          setIsPasswordVerified(isVerified)
        } else {
          // 비밀번호가 없는 경우 자동으로 확인됨
          setIsPasswordVerified(true)
        }
      } catch (err: any) {
        setError(err.message || "데이터를 불러올 수 없습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [id, toast])

  // 비밀번호 확인 완료 처리
  const handlePasswordVerified = () => {
    setIsPasswordVerified(true)
    // 세션 스토리지에 비밀번호 확인 상태 저장
    sessionStorage.setItem(`password_verified_${id}`, "true")
  }

  // 탭 변경 처리
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (tableNotExist) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">데이터베이스 테이블이 존재하지 않습니다</h2>
          <p className="text-muted-foreground mb-2">분석 결과를 저장하기 위한 테이블이 아직 생성되지 않았습니다.</p>
          <p className="text-muted-foreground mb-6">먼저 분석 결과를 저장하여 테이블을 생성해주세요.</p>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/saved-results">목록으로 돌아가기</Link>
            </Button>
            <Button asChild>
              <Link href="/search">분석 시작하기</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileSearch className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">분석 결과를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">요청하신 ID({id})에 해당하는 분석 결과가 존재하지 않습니다.</p>
          <Button asChild>
            <Link href="/saved-results">저장된 결과 목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-2">오류가 발생했습니다</h2>
          <p className="text-destructive mb-6">{error}</p>
          <div className="flex flex-col gap-4 items-center">
            <Button asChild className="mb-2">
              <Link href="/saved-results">목록으로 돌아가기</Link>
            </Button>
            <Button variant="outline" onClick={toggleDebugMode}>
              <Bug className="mr-2 h-4 w-4" />
              디버그 정보 {debugMode ? "숨기기" : "표시"}
            </Button>

            {debugMode && (
              <Card className="mt-4 w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>디버그 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify({ id, error, result }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <p className="text-destructive">데이터를 찾을 수 없습니다.</p>
          <Button asChild className="mt-4">
            <Link href="/saved-results">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/saved-results">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{result.title}</h1>
        {user?.is_admin && <DeleteResultButton resultId={Number.parseInt(id)} title={result.title} />}

        {/* 디버그 버튼 추가 */}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={toggleDebugMode}>
            <Bug className="mr-2 h-4 w-4" />
            디버그
          </Button>
        </div>
      </div>

      {debugMode && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>디버그 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(
                {
                  id,
                  resultId: result.id,
                  title: result.title,
                  dataType: typeof result.data,
                  isArray: Array.isArray(result.data),
                  dataLength: Array.isArray(result.data) ? result.data.length : "N/A",
                  firstItem:
                    Array.isArray(result.data) && result.data.length > 0
                      ? { ...result.data[0], name: result.data[0]?.name || "이름 없음" }
                      : "N/A",
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 비밀번호 보호 확인 */}
      {result.password && !isPasswordVerified ? (
        <PasswordProtection id={id} correctPassword={result.password} onPasswordVerified={handlePasswordVerified} />
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>분석 정보</CardTitle>
              <CardDescription>저장된 분석 결과에 대한 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {result.location && (
                  <div className="flex justify-between">
                    <span className="font-medium">위치:</span>
                    <span>{result.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">저장일:</span>
                  <span>{formatDate(result.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">매물 수:</span>
                  <span>{result.room_count}개</span>
                </div>
                {result.client_name && (
                  <div className="flex justify-between">
                    <span className="font-medium">고객명:</span>
                    <span>{result.client_name}</span>
                  </div>
                )}
                {result.description && (
                  <div className="mt-4">
                    <span className="font-medium">설명:</span>
                    <p className="mt-1 text-muted-foreground">{result.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 탭 추가 */}
          <Tabs defaultValue="analysis" value={activeTab} onValueChange={handleTabChange} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">분석 결과</TabsTrigger>
              <TabsTrigger value="notes">상담일지</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-6">
              {/* 저장된 분석 결과 표시 */}
              {Array.isArray(result.data) ? (
                <SearchResults rooms={result.data} />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">데이터 형식 오류</h3>
                      <p className="text-muted-foreground mb-4">분석 결과 데이터가 올바른 형식이 아닙니다.</p>
                      <Button variant="outline" onClick={toggleDebugMode}>
                        <Bug className="mr-2 h-4 w-4" />
                        디버그 정보 {debugMode ? "숨기기" : "표시"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              {/* 상담일지 컴포넌트 */}
              <ConsultationNotes
                rooms={Array.isArray(result.data) ? result.data : []}
                location={result.location}
                analysisId={result.id}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

export default function SavedResultPage(props: SavedResultPageProps) {
  // 개발 모드에서는 ProtectedRoute를 우회
  if (isDevelopment) {
    return (
      <ErrorBoundary fallback={<ErrorFallback />}>
        <SavedResultPageContent {...props} />
      </ErrorBoundary>
    )
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <SavedResultPageContent {...props} />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
