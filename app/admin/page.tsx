"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { ProtectedRoute } from "@/components/protected-route"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

interface UserData {
  id: string
  email: string
  username: string
  created_at: string
  is_admin: boolean
}

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
    }
  }, [isAdmin, router])

  // 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setUsers(data || [])
      } catch (err: any) {
        setError(err.message || "사용자 목록을 불러오는데 실패했습니다.")
        console.error("사용자 목록 불러오기 오류:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // 사용자 추가 함수
  const handleAddUser = async () => {
    setAddUserError(null)
    setIsAddingUser(true)

    try {
      if (!newUserEmail || !newUserName || !newUserPassword) {
        throw new Error("모든 필드를 입력해주세요.")
      }

      const supabase = createClient()

      // 1. Supabase Auth에 사용자 추가
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("사용자 생성에 실패했습니다.")
      }

      // 2. users 테이블에 사용자 정보 추가
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: newUserEmail,
        username: newUserName,
        is_admin: newUserIsAdmin,
      })

      if (dbError) {
        throw dbError
      }

      // 성공 시 폼 초기화 및 사용자 목록 갱신
      setNewUserEmail("")
      setNewUserName("")
      setNewUserPassword("")
      setNewUserIsAdmin(false)
      setIsDialogOpen(false)

      // 사용자 목록 다시 불러오기
      const { data: updatedUsers } = await supabase.from("users").select("*").order("created_at", { ascending: false })
      setUsers(updatedUsers || [])
    } catch (err: any) {
      setAddUserError(err.message || "사용자 추가 중 오류가 발생했습니다.")
      console.error("사용자 추가 오류:", err)
    } finally {
      setIsAddingUser(false)
    }
  }

  // 사용자 삭제 함수
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`정말로 ${userEmail} 사용자를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const supabase = createClient()

      // 1. users 테이블에서 사용자 삭제
      const { error: dbError } = await supabase.from("users").delete().eq("id", userId)

      if (dbError) {
        throw dbError
      }

      // 2. Supabase Auth에서 사용자 삭제
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) {
        throw authError
      }

      // 사용자 목록 갱신
      setUsers(users.filter((user) => user.id !== userId))
    } catch (err: any) {
      setError(err.message || "사용자 삭제 중 오류가 발생했습니다.")
      console.error("사용자 삭제 오류:", err)
    }
  }

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <div className="flex gap-4">
            <Link href="/admin/consultation-notes">
              <Button variant="outline">사용자별 상담일지 관리</Button>
            </Link>
            <Link href="/admin/assign-users">
              <Button variant="outline">분석결과 소유자 할당</Button>
            </Link>
            <Link href="/admin/user-permissions">
              <Button variant="outline">사용자 지역 권한 관리</Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>사용자 추가</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 사용자 추가</DialogTitle>
                  <DialogDescription>새로운 사용자 정보를 입력하세요.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {addUserError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{addUserError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      이메일
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      사용자명
                    </label>
                    <Input
                      id="username"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="사용자명"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      비밀번호
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="비밀번호"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="is-admin"
                      type="checkbox"
                      checked={newUserIsAdmin}
                      onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="is-admin" className="text-sm font-medium">
                      관리자 권한 부여
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddUser} disabled={isAddingUser}>
                    {isAddingUser ? "추가 중..." : "사용자 추가"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>시스템에 등록된 모든 사용자 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">사용자 목록을 불러오는 중...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자명</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">등록된 사용자가 없습니다.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{user.is_admin ? "관리자" : "일반 사용자"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
