import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Users, ShieldAlert, Info } from "lucide-react"
import { DeleteResultButton } from "@/components/delete-result-button"
import { cookies } from "next/headers"

// 개발 모드 확인
const isDevelopment = process.env.NODE_ENV === "development"

// 개발 모드용 샘플 데이터
const DEV_SAMPLE_DATA = [
  {
    id: 1,
    title: "샘플 분석 결과",
    description: "개발 모드에서 표시되는 샘플 데이터입니다.",
    location: "서울특별시 강남구",
    created_at: new Date().toISOString(),
    room_count: 25,
    client_name: "홍길동",
    user_id: "1", // 관리자 ID
  },
  {
    id: 2,
    title: "또 다른 샘플 결과",
    description: "두 번째 샘플 데이터입니다.",
    location: "서울특별시 마포구",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 하루 전
    room_count: 18,
    client_name: "김철수",
    user_id: "2", // 일반 사용자 ID
  },
  {
    id: 3,
    title: "세 번째 샘플 결과",
    description: "세 번째 샘플 데이터입니다.",
    location: "서울특별시 서초구",
    created_at: new Date(Date.now() - 172800000).toISOString(), // 이틀 전
    room_count: 12,
    client_name: "홍길동",
    user_id: "2", // 일반 사용자 ID
  },
]

export default async function SavedResultsPage() {
  // 개발 모드에서는 항상 샘플 데이터 사용
  if (isDevelopment) {
    console.log("[DEV MODE] 개발 모드에서 샘플 데이터 사용")

    const results = DEV_SAMPLE_DATA
    const clients = Array.from(new Set(results.map((result) => result.client_name || "미분류").filter(Boolean))).sort()

    // 고객별로 결과 그룹화
    const resultsByClient = clients.reduce(
      (acc, client) => {
        acc[client] = results.filter(
          (result) => (client === "미분류" && !result.client_name) || result.client_name === client,
        )
        return acc
      },
      {} as Record<string, typeof results>,
    )

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">저장된 분석 결과</h1>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/">홈으로</Link>
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-6">
          <p className="font-semibold">개발 모드 안내</p>
          <p className="text-sm">개발 환경에서는 샘플 데이터가 표시됩니다. 인증 검사가 우회되었습니다.</p>
        </div>

        <Tabs defaultValue={clients[0]} className="w-full">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64 shrink-0">
              <div className="sticky top-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  고객 목록 (개발 모드)
                </h2>
                <TabsList className="flex flex-col h-auto w-full bg-muted/50 p-1">
                  {clients.map((client) => (
                    <TabsTrigger
                      key={client}
                      value={client}
                      className="justify-start w-full py-2 px-3 mb-1 data-[state=active]:bg-background"
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{client}</span>
                      <span className="ml-auto bg-muted rounded-full px-2 py-0.5 text-xs">
                        {resultsByClient[client].length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>

            <div className="flex-1">
              {clients.map((client) => (
                <TabsContent key={client} value={client} className="mt-0">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <User className="h-6 w-6" />
                      {client} 고객의 분석 결과 (개발 모드)
                    </h2>
                    <p className="text-muted-foreground">
                      총 {resultsByClient[client].length}개의 분석 결과가 있습니다.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {resultsByClient[client].map((result) => (
                      <Card key={result.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{result.title}</CardTitle>
                            <DeleteResultButton resultId={result.id} title={result.title} />
                          </div>
                          <CardDescription>
                            {result.location && `위치: ${result.location}`}
                            {result.location && <br />}
                            저장일: {formatDate(result.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {result.description || "설명 없음"}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center pt-0">
                          <span className="text-sm">매물 수: {result.room_count}개</span>
                          <Button asChild size="sm">
                            <Link href={`/saved-results/${result.id}`}>상세 보기</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </div>
    )
  }

  // 프로덕션 모드에서는 기존 로직 실행
  let results = []
  let error = null
  let clients: string[] = []
  let userIsAdmin = false
  let currentUserId = null
  let authError = false
  let hasUnassignedData = false

  try {
    // 쿠키 스토어 가져오기
    const cookieStore = cookies()

    // Supabase 클라이언트 생성
    const supabase = createClient()

    console.log(
      "쿠키 확인:",
      cookieStore.getAll().map((c) => c.name),
    )

    // 현재 사용자 정보 가져오기
    try {
      // 세션 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("세션 가져오기 오류:", sessionError)
        authError = true
      } else if (!session) {
        console.log("로그인된 세션 없음")
        authError = true
      } else {
        console.log("세션 정보:", {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at,
        })

        currentUserId = session.user.id

        // 사용자 역할 확인 (관리자 여부)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          if (profileError.code !== "PGRST116") {
            // PGRST116: 결과가 없음
            console.error("프로필 정보 가져오기 오류:", profileError)
          }
          // 프로필 정보가 없으면 일반 사용자로 간주
          userIsAdmin = false
        } else {
          userIsAdmin = profile?.role === "admin"
        }

        console.log("사용자 정보:", { id: session.user.id, isAdmin: userIsAdmin })
      }
    } catch (authErr) {
      console.error("인증 오류:", authErr)
      authError = true
    }

    if (!authError) {
      // 인증된 사용자인 경우 실제 데이터 가져오기
      try {
        // 쿼리 구성
        let query = supabase
          .from("analysis_results")
          .select("id, title, description, location, created_at, room_count, client_name, user_id")

        // 정렬 적용 (orderBy 또는 order 메서드 사용)
        if (typeof query.orderBy === "function") {
          query = query.orderBy("created_at", { ascending: false })
        } else if (typeof query.order === "function") {
          query = query.order("created_at", { ascending: false })
        }

        // 관리자가 아닌 경우 자신의 결과만 필터링
        // 이 부분을 제거:
        // if (!userIsAdmin && currentUserId) {
        //   console.log("일반 사용자용 쿼리 적용: user_id =", currentUserId)
        //   query = query.eq("user_id", currentUserId)
        // } else {
        //   console.log("관리자용 쿼리 적용: 모든 결과 표시")
        // }

        // 대신 모든 결과를 표시하도록 변경:
        console.log("모든 분석 결과 표시")

        const response = await query

        if (response.error) {
          console.error("데이터 가져오기 오류:", response.error)
          error = response.error
        } else {
          results = response.data || []

          // user_id가 null인 데이터가 있는지 확인
          if (userIsAdmin && results.some((result) => result.user_id === null)) {
            hasUnassignedData = true
          }

          // 고객 목록 추출
          if (results.length > 0) {
            clients = Array.from(
              new Set(results.map((result) => result.client_name || "미분류").filter(Boolean)),
            ).sort()
          }
        }
      } catch (queryErr) {
        console.error("쿼리 실행 오류:", queryErr)
        error = { message: queryErr.message || "데이터 쿼리 중 오류가 발생했습니다." }
      }
    }
  } catch (err) {
    console.error("Supabase 연결 오류:", err)
    error = { message: "Supabase 연결에 실패했습니다." }
  }

  // 고객이 없으면 "미분류" 추가
  if (clients.length === 0) {
    clients = ["미분류"]
  }

  // 고객별로 결과 그룹화
  const resultsByClient = clients.reduce(
    (acc, client) => {
      acc[client] = results.filter(
        (result) => (client === "미분류" && !result.client_name) || result.client_name === client,
      )
      return acc
    },
    {} as Record<string, typeof results>,
  )

  // 인증 오류가 있는 경우 로그인 안내 UI 표시
  if (authError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">저장된 분석 결과</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/">홈으로</Link>
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-6 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">인증 세션이 없습니다</p>
            <p className="text-sm">로그인 후 이용해주세요.</p>
          </div>
        </div>
      </div>
    )
  }

  // 인증된 사용자인 경우 정상 UI 표시
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">저장된 분석 결과</h1>
        <div className="flex gap-2">
          {userIsAdmin && hasUnassignedData && (
            <Button asChild variant="outline">
              <Link href="/admin/assign-users">소유자 할당</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </div>
      )}

      {userIsAdmin && hasUnassignedData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-6 flex items-center gap-2">
          <Info className="h-5 w-5" />
          <div>
            <p className="font-semibold">소유자가 지정되지 않은 데이터가 있습니다</p>
            <p className="text-sm">
              일부 데이터에 사용자 ID가 없습니다. 이 데이터는 관리자만 볼 수 있습니다.{" "}
              <Link href="/admin/assign-users" className="underline">
                소유자 할당하기
              </Link>
            </p>
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">저장된 분석 결과가 없습니다.</p>
          <Button asChild>
            <Link href="/analysis">분석 시작하기</Link>
          </Button>
        </div>
      )}

      {/* 이 부분을 제거: */}
      {/* {!userIsAdmin && results && results.length > 0 && (
        <div className="bg-muted p-4 rounded-md mb-6 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p>현재 사용자의 분석 결과만 표시됩니다.</p>
        </div>
      )} */}

      {/* 대신 모든 결과를 공유한다는 메시지 추가: */}
      {results && results.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-6 flex items-center gap-2">
          <Info className="h-5 w-5" />
          <div>
            <p className="font-semibold">모든 분석 결과 공유</p>
            <p className="text-sm">
              모든 분석 결과는 사용자들 간에 공유됩니다. 관리자만 새로운 분석을 추가할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <Tabs defaultValue={clients[0]} className="w-full">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64 shrink-0">
              <div className="sticky top-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  고객 목록
                </h2>
                <TabsList className="flex flex-col h-auto w-full bg-muted/50 p-1">
                  {clients.map((client) => (
                    <TabsTrigger
                      key={client}
                      value={client}
                      className="justify-start w-full py-2 px-3 mb-1 data-[state=active]:bg-background"
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{client}</span>
                      <span className="ml-auto bg-muted rounded-full px-2 py-0.5 text-xs">
                        {resultsByClient[client].length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>

            <div className="flex-1">
              {clients.map((client) => (
                <TabsContent key={client} value={client} className="mt-0">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <User className="h-6 w-6" />
                      {client} 고객의 분석 결과
                    </h2>
                    <p className="text-muted-foreground">
                      총 {resultsByClient[client].length}개의 분석 결과가 있습니다.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {resultsByClient[client].map((result) => (
                      <Card key={result.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{result.title}</CardTitle>
                            <DeleteResultButton resultId={result.id} title={result.title} />
                          </div>
                          <CardDescription>
                            {result.location && `위치: ${result.location}`}
                            {result.location && <br />}
                            저장일: {formatDate(result.created_at)}
                            {userIsAdmin && result.user_id === null && (
                              <>
                                <br />
                                <span className="text-amber-600">소유자 없음</span>
                              </>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {result.description || "설명 없음"}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center pt-0">
                          <span className="text-sm">매물 수: {result.room_count}개</span>
                          <Button asChild size="sm">
                            <Link href={`/saved-results/${result.id}`}>상세 보기</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      )}
    </div>
  )
}
