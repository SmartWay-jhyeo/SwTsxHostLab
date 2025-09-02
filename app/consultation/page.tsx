"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"

interface User {
  id: string
  email: string
  username: string
  created_at: string
}

interface ConsultationNote {
  id: number
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function ConsultationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([])
  const [selectedNote, setSelectedNote] = useState<ConsultationNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
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
      } catch (err) {
        console.error("사용자 목록 불러오기 오류:", err)
        toast({
          title: "사용자 목록 불러오기 실패",
          description: "사용자 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  // 사용자 선택 핸들러 - 선택된 상담일지 초기화 추가
  const handleUserSelect = (user: User) => {
    // 이미 선택된 사용자를 다시 클릭한 경우 아무 작업도 하지 않음
    if (selectedUser?.id === user.id) return

    // 새로운 사용자를 선택할 때 선택된 상담일지 초기화
    setSelectedNote(null)
    setSelectedUser(user)
  }

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
      } catch (err) {
        console.error("상담일지 불러오기 오류:", err)
        toast({
          title: "상담일지 불러오기 실패",
          description: "상담일지를 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConsultationNotes()
  }, [selectedUser, toast])

  // 상담일지 저장 함수
  const handleSaveNote = async () => {
    if (!selectedUser) {
      toast({
        title: "사용자를 선택해주세요",
        variant: "destructive",
      })
      return
    }

    if (!noteContent.trim()) {
      toast({
        title: "내용을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()
      const now = new Date().toISOString()

      // 제목과 내용을 합쳐서 content 필드에 저장
      const fullContent = noteTitle.trim() ? `${noteTitle.trim()}\n\n${noteContent.trim()}` : noteContent.trim()

      const noteData = {
        content: fullContent,
        user_id: selectedUser.id,
        updated_at: now,
      }

      const { error } = await supabase.from("consultation_notes").insert([noteData])

      if (error) {
        throw error
      }

      toast({
        title: "상담일지 저장 성공",
        description: "상담일지가 성공적으로 저장되었습니다.",
      })

      // 저장 후 폼 초기화
      setNoteTitle("")
      setNoteContent("")

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
      console.error("상담일지 저장 오류:", err)
      toast({
        title: "상담일지 저장 실패",
        description: err.message || "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 상담일지 삭제 함수
  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("정말로 이 상담일지를 삭제하시겠습니까?")) {
      return
    }

    setIsDeleting(true)

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

      // 선택된 노트가 삭제된 경우 선택 해제
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }

      // 상담일지 목록 갱신
      const { data: updatedNotes, error: fetchError } = await supabase
        .from("consultation_notes")
        .select("*")
        .eq("user_id", selectedUser!.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("상담일지 목록 갱신 오류:", fetchError)
      } else {
        setConsultationNotes(updatedNotes || [])
      }
    } catch (err) {
      console.error("상담일지 삭제 오류:", err)
      toast({
        title: "상담일지 삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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

  // 사용자 목록 새로고침
  const refreshUserList = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("username", { ascending: true })
        .order("email", { ascending: true })

      if (error) {
        throw error
      }

      setUsers(data || [])
      toast({
        title: "사용자 목록 새로고침 완료",
      })
    } catch (err) {
      console.error("사용자 목록 새로고침 오류:", err)
      toast({
        title: "사용자 목록 새로고침 실패",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 상담일지 제목 추출 함수
  const extractTitle = (content: string): string => {
    const lines = content.split("\n").filter((line) => line.trim() !== "")
    return lines.length > 0 ? lines[0] : "제목 없음"
  }

  // 상담일지 내용 추출 함수
  const extractContent = (content: string): string => {
    const lines = content.split("\n").filter((line) => line.trim() !== "")
    return lines.length > 1 ? lines.slice(1).join("\n") : content
  }

  // 상담일지 아이템 컴포넌트
  const ConsultationNoteItem = ({
    note,
    isSelected,
    onClick,
  }: {
    note: ConsultationNote
    isSelected: boolean
    onClick: () => void
  }) => {
    const title = extractTitle(note.content)

    return (
      <div
        className={`p-3 rounded-md cursor-pointer transition-colors ${
          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
        }`}
        onClick={onClick}
      >
        <div className="flex justify-between items-start">
          <div className="font-medium truncate">{title}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteNote(note.id)
            }}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-1">{formatDate(note.created_at)}</div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">상담일지 관리</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 사용자 목록 */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">사용자 목록</CardTitle>
              <Button variant="ghost" size="icon" onClick={refreshUserList} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              {loading && !selectedUser ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">사용자 목록을 불러오는 중...</p>
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
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="font-medium text-base">{user.username || "이름 없음"}</div>
                        <div className="text-xs opacity-70 truncate">{user.email}</div>
                        <div className="text-xs opacity-50 truncate mt-1">ID: {user.id}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* 상담일지 목록 및 작성 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedUser ? `${selectedUser.username || "이름 없음"} 님의 상담일지` : "상담일지"}
              </CardTitle>
              {selectedUser && (
                <div className="text-sm text-muted-foreground">
                  {selectedUser.email} <span className="opacity-50">({selectedUser.id})</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">왼쪽에서 사용자를 선택하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 상담일지 목록 */}
                  <div>
                    <h3 className="font-medium text-sm mb-3">상담일지 목록</h3>
                    {loading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-muted-foreground mt-2">상담일지를 불러오는 중...</p>
                      </div>
                    ) : consultationNotes.length === 0 ? (
                      <div className="text-center py-8 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">저장된 상담일지가 없습니다.</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                          {consultationNotes.map((note) => (
                            <ConsultationNoteItem
                              key={note.id}
                              note={note}
                              isSelected={selectedNote?.id === note.id}
                              onClick={() => setSelectedNote(note)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {/* 선택한 상담일지 상세 */}
                    {selectedNote && (
                      <div className="mt-6">
                        <h3 className="font-medium text-sm mb-3">상담일지 상세</h3>
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{extractTitle(selectedNote.content)}</h4>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                              {formatDate(selectedNote.created_at)}
                            </p>
                            <Separator className="my-2" />
                            <div className="mt-2 whitespace-pre-wrap">{extractContent(selectedNote.content)}</div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* 상담일지 작성 폼 */}
                  <div>
                    <h3 className="font-medium text-sm mb-3">새 상담일지 작성</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">제목</Label>
                        <Input
                          id="title"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="상담일지 제목"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="content">내용</Label>
                        <Textarea
                          id="content"
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="상담 내용을 입력하세요..."
                          rows={10}
                        />
                      </div>
                      <Button onClick={handleSaveNote} disabled={isSaving} className="w-full">
                        {isSaving ? "저장 중..." : "상담일지 저장"}
                      </Button>
                    </div>
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
