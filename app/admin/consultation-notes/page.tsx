"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ProtectedRoute } from "@/components/protected-route"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConsultationNoteItem } from "@/components/consultation-note-item"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface User {
  id: string
  email: string
  username: string
  created_at: string
  is_admin: boolean
}

interface ConsultationNote {
  id: string
  title: string
  content: string
  user_id: string
  user_email: string
  created_at: string
  updated_at: string
}

export default function AdminConsultationNotesPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([])
  const [selectedNote, setSelectedNote] = useState<ConsultationNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("username", { ascending: true })
          .order("email", { ascending: true }) // username이 없는 경우 이메일로 정렬

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

  // 선택한 사용자의 상담일지 불러오기
  useEffect(() => {
    if (!selectedUser) return

    const fetchConsultationNotes = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
          .from("consultation_notes")
          .select("*")
          .eq("user_id", selectedUser.id)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setConsultationNotes(data || [])
      } catch (err: any) {
        setError(err.message || "상담일지를 불러오는데 실패했습니다.")
        console.error("상담일지 불러오기 오류:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchConsultationNotes()
  }, [selectedUser])

  // 상담일지 저장 함수
  const handleSaveNote = async () => {
    if (!selectedUser) {
      toast({
        title: "사용자를 선택해주세요",
        variant: "destructive",
      })
      return
    }

    if (!noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: "제목과 내용을 모두 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()
      const now = new Date().toISOString()

      const noteData = {
        title: noteTitle,
        content: noteContent,
        user_id: selectedUser.id,
        user_email: selectedUser.email,
        created_at: now,
        updated_at: now,
      }

      const { data, error } = await supabase.from("consultation_notes").insert([noteData]).select()

      if (error) {
        throw error
      }

      toast({
        title: "상담일지 저장 성공",
        description: "상담일지가 성공적으로 저장되었습니다.",
      })

      // 저장 후 폼 초기화 및 목록 갱신
      setNoteTitle("")
      setNoteContent("")
      setIsDialogOpen(false)

      // 상담일지 목록 갱신
      const { data: updatedNotes, error: fetchError } = await supabase
        .from("consultation_notes")
        .select("*")
        .eq("user_id", selectedUser.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("상담일지 목록 갱신 오류:", fetchError)
      } else {
        setConsultationNotes(updatedNotes || [])
      }
    } catch (err: any) {
      toast({
        title: "상담일지 저장 실패",
        description: err.message || "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      console.error("상담일지 저장 오류:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // 상담일지 삭제 함수
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("정말로 이 상담일지를 삭제하시겠습니까?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("consultation_notes").delete().eq("id", noteId)

      if (error) {
        throw error
      }

      toast({
        title: "상담일지 삭제 성공",
        description: "상담일지가 성공적으로 삭제되었습니다.",
      })

      // 상담일지 목록 갱신
      setConsultationNotes(consultationNotes.filter((note) => note.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } catch (err: any) {
      toast({
        title: "상담일지 삭제 실패",
        description: err.message || "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      console.error("상담일지 삭제 오류:", err)
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
          <h1 className="text-3xl font-bold">사용자별 상담일지 관리</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 사용자 목록 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>상담일지를 관리할 사용자를 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !selectedUser ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">사용자 목록을 불러오는 중...</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedUser?.id === user.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="font-medium text-base">{user.username || "이름 없음"}</div>
                        <div className="text-xs opacity-70 truncate">{user.email}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* 상담일지 목록 및 상세 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {selectedUser ? `${selectedUser.username || "이름 없음"} 님의 상담일지` : "상담일지"}
                  </CardTitle>
                  <CardDescription>
                    {selectedUser ? `${selectedUser.email}` : "왼쪽에서 사용자를 선택���면 상담일지가 표시됩니다."}
                  </CardDescription>
                </div>
                {selectedUser && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>상담일지 작성</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>새 상담일지 작성</DialogTitle>
                        <DialogDescription>
                          {selectedUser.username || "이름 없음"} 님의 새 상담일지를 작성합니다.
                          <span className="block text-xs mt-1 text-muted-foreground">{selectedUser.email}</span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">제목</Label>
                          <Input
                            id="title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="상담일지 제목"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="content">내용</Label>
                          <Textarea
                            id="content"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="상담 내용을 입력하세요..."
                            rows={10}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          취소
                        </Button>
                        <Button onClick={handleSaveNote} disabled={isSaving}>
                          {isSaving ? "저장 중..." : "저장하기"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">왼쪽에서 사용자를 선택하세요.</p>
                </div>
              ) : loading ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">상담일지를 불러오는 중...</p>
                </div>
              ) : consultationNotes.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">저장된 상담일지가 없습니다.</p>
                  <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                    첫 상담일지 작성하기
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 상담일지 목록 */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm mb-2">상담일지 목록</h3>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {consultationNotes.map((note) => (
                          <ConsultationNoteItem
                            key={note.id}
                            note={note}
                            isSelected={selectedNote?.id === note.id}
                            isAdmin={true}
                            onClick={() => setSelectedNote(note)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* 상담일지 상세 */}
                  <div>
                    <h3 className="font-medium text-sm mb-2">상담일지 상세</h3>
                    {selectedNote ? (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{selectedNote.title || "제목 없음"}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNote(selectedNote.id)}
                              className="text-destructive hover:text-destructive/90 -mt-1 -mr-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{formatDate(selectedNote.created_at)}</p>
                          <Separator className="my-2" />
                          <div className="mt-2 whitespace-pre-wrap">{selectedNote.content}</div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-16 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">왼쪽에서 상담일지를 선택하세요.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
