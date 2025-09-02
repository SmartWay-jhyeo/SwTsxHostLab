"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { saveConsultationNotes } from "@/app/actions/saveConsultationNotes"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle } from "lucide-react"

interface ConsultationNotesProps {
  rooms: any[]
  location?: string
  analysisId?: string | number
}

export function ConsultationNotes({ rooms, location, analysisId }: ConsultationNotesProps) {
  const [notes, setNotes] = useState("")
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { isLoggedIn, user } = useAuth()

  // 저장된 상담일지 불러오기
  useEffect(() => {
    const fetchSavedNotes = async () => {
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      try {
        // 개발 환경이거나 Supabase URL이 없는 경우 샘플 데이터 사용
        if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
          setSavedNotes([
            {
              id: 1,
              content: "이 고객은 강남구 지역의 오피스텔에 관심이 많았습니다. 특히 예약률이 높은 매물을 선호했습니다.",
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              content: "마포구 지역 투자 상담. 수익률 분석 결과 공유 필요.",
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
          ])
          setIsLoading(false)
          return
        }

        const supabase = createClient()

        try {
          // 테이블 존재 여부 확인
          const { error: tableCheckError } = await supabase
            .from("consultation_notes")
            .select("id")
            .limit(1)
            .maybeSingle()

          if (tableCheckError && tableCheckError.message.includes("does not exist")) {
            setError("상담일지 테이블이 아직 생성되지 않았습니다.")
            setIsLoading(false)
            return
          }

          // 분석 ID가 있으면 해당 분석에 대한 상담일지만 가져오기
          let query = supabase.from("consultation_notes").select("*").order("created_at", { ascending: false })

          // user_id 필터링은 현재 데이터베이스에 해당 컬럼이 없으므로 적용하지 않음
          // 추후 데이터베이스 스키마 업데이트 후 활성화할 수 있음

          if (analysisId) {
            query = query.eq("analysis_id", analysisId)
          }

          const { data, error } = await query

          if (error) {
            setError(`상담일지를 불러올 수 없습니다: ${error.message}`)
            setSavedNotes([])
          } else {
            setSavedNotes(data || [])
            setError(null)
          }
        } catch (error: any) {
          setError(`상담일지를 불러올 수 없습니다: ${error.message}`)
          setSavedNotes([])
        }
      } catch (error: any) {
        setError(`상담일지를 불러올 수 없습니다: ${error.message}`)
        setSavedNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedNotes()
  }, [isLoggedIn, analysisId])

  // 상담일지 저장 함수
  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      toast({
        title: "내용을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("content", notes)

      if (title) {
        formData.append("title", title)
      }

      if (location) {
        formData.append("location", location)
      }

      if (analysisId) {
        formData.append("analysisId", analysisId.toString())
      }

      // user_id는 현재 데이터베이스에 해당 컬럼이 없으므로 전송하지 않음
      // 추후 데이터베이스 스키마 업데이트 후 활성화할 수 있음
      // if (user?.id) {
      //   formData.append("userId", user.id)
      // }

      // 선택된 매물 ID 목록 추가
      formData.append("roomIds", JSON.stringify(rooms.map((room) => room.id)))

      const result = await saveConsultationNotes(formData)

      if (result.success) {
        toast({
          title: "상담일지 저장 성공",
          description: "상담일지가 성공적으로 저장되었습니다.",
        })

        // 저장 후 폼 초기화
        setTitle("")
        setNotes("")

        // 저장된 상담일지 목록 갱신
        try {
          const supabase = createClient()
          let query = supabase.from("consultation_notes").select("*").order("created_at", { ascending: false })

          if (analysisId) {
            query = query.eq("analysis_id", analysisId)
          }

          const { data, error } = await query

          if (error) {
            toast({
              title: "목록 갱신 실패",
              description: "상담일지 목록을 갱신하지 못했습니다.",
              variant: "destructive",
            })
          } else {
            setSavedNotes(data || [])
          }
        } catch (error) {}
      } else {
        toast({
          title: "상담일지 저장 실패",
          description: result.error || "저장 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "상담일지 저장 실패",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 상담일지 선택 함수
  const handleSelectNote = (note: any) => {
    setSelectedNote(note)
    setNotes(note.content)
  }

  // 새 상담일지 작성 함수
  const handleNewNote = () => {
    setSelectedNote(null)
    setTitle("")
    setNotes("")
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-medium mb-2">상담일지 로드 오류</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => setError(null)}>
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">상담일지를 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>상담일지 작성</CardTitle>
            <CardDescription>고객 상담 내용을 기록하고 저장합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-content" className="text-black">
                  상담 내용
                </Label>
                <Textarea
                  id="note-content"
                  placeholder="상담 내용을 입력하세요..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleNewNote}>
                  새로 작성
                </Button>
                <Button onClick={handleSaveNotes} disabled={isSaving}>
                  {isSaving ? "저장 중..." : "저장하기"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>저장된 상담일지</CardTitle>
            <CardDescription>이전에 작성한 상담일지 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {savedNotes.length > 0 ? (
              <div className="space-y-2">
                {savedNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelectNote(note)}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">저장된 상담일지가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
