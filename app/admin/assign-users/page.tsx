import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { assignUserToResults } from "@/app/actions/assignUserToResults"
import { isAdmin } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AssignUsersPage() {
  // 관리자 권한 확인
  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    redirect("/")
  }

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // 소유자가 없는 분석 결과 가져오기
  const { data: unassignedResults, error: resultsError } = await supabase
    .from("analysis_results")
    .select("id, title, description, location, created_at, client_name")
    .is("user_id", null)
    .order("created_at", { ascending: false })

  // 사용자 목록 가져오기
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">소유자 할당</h1>
          <Button asChild>
            <Link href="/saved-results">돌아가기</Link>
          </Button>
        </div>

        {(resultsError || usersError) && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {unassignedResults && unassignedResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">소유자가 지정되지 않은 분석 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <h2 className="text-xl font-semibold">
              소유자가 지정되지 않은 분석 결과 ({unassignedResults?.length || 0}개)
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {unassignedResults?.map((result) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{result.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {result.location && `위치: ${result.location}`}
                      {result.location && <br />}
                      저장일: {formatDate(result.created_at)}
                      <br />
                      고객: {result.client_name || "미분류"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form action={assignUserToResults}>
                      <input type="hidden" name="resultId" value={result.id} />
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`user-${result.id}`} className="block text-sm font-medium mb-1">
                            소유자 선택
                          </label>
                          <select
                            id={`user-${result.id}`}
                            name="userId"
                            className="w-full p-2 border rounded-md"
                            required
                          >
                            <option value="">소유자 선택...</option>
                            {users?.users?.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.email} {user.user_metadata?.name ? `(${user.user_metadata.name})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="submit" className="w-full">
                          소유자 할당
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">일괄 할당</h2>
          <Card>
            <CardContent className="pt-6">
              <form action={assignUserToResults}>
                <input type="hidden" name="batchAssign" value="true" />
                <div className="space-y-4">
                  <div>
                    <label htmlFor="batch-user" className="block text-sm font-medium mb-1">
                      모든 소유자 없는 결과를 다음 사용자에게 할당
                    </label>
                    <select id="batch-user" name="userId" className="w-full p-2 border rounded-md" required>
                      <option value="">소유자 선택...</option>
                      {users?.users?.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} {user.user_metadata?.name ? `(${user.user_metadata.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    일괄 할당
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
