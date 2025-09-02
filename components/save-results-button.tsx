"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import type { Room } from "@/lib/types"
import { Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SaveResultsButtonProps {
  rooms?: Room[] | any[]
  data?: any // 기존 데이터 형식 지원
  location?: string
  existingId?: string
  existingTitle?: string
  existingDescription?: string
  existingLocation?: string
}

export function SaveResultsButton({
  rooms,
  data, // 기존 데이터 형식 지원
  location: propLocation,
  existingId,
  existingTitle,
  existingDescription,
  existingLocation,
}: SaveResultsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState(existingTitle || "")
  const [description, setDescription] = useState(existingDescription || "")
  const [location, setLocation] = useState(existingLocation || propLocation || "")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // 데이터 로깅 및 유효성 검사
  useEffect(() => {
    console.log("SaveResultsButton 데이터:", {
      roomsExists: !!rooms,
      dataExists: !!data,
      roomsIsArray: Array.isArray(rooms),
      dataIsArray: Array.isArray(data),
      roomsLength: rooms?.length,
      dataLength: data?.length,
    })
  }, [rooms, data])

  const handleSave = async () => {
    if (!title) {
      setError("제목을 입력해주세요.")
      return
    }

    if (!location) {
      setError("지역을 입력해주세요.")
      return
    }

    // 데이터 유효성 검사
    const saveData = rooms || data || []
    if (!Array.isArray(saveData) || saveData.length === 0) {
      setError("저장할 데이터가 없습니다.")
      toast({
        title: "저장 실패",
        description: "저장할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description || "")
      formData.append("location", location)

      // 데이터 JSON 문자열로 변환
      const dataString = JSON.stringify(saveData)
      console.log("저장할 데이터 문자열 길이:", dataString.length)
      formData.append("data", dataString)

      if (existingId) {
        formData.append("existingId", existingId)
      }

      const response = await fetch("/api/save-analysis", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "저장 중 오류가 발생했습니다.")
      }

      toast({
        title: "저장 성공",
        description: "지역 데이터가 성공적으로 저장되었습니다.",
      })

      // 성공 시 지역 데이터 확인 페이지로 이동
      router.push("/region-data")
    } catch (err: any) {
      console.error("저장 오류:", err)
      setError(err.message || "저장 중 오류가 발생했습니다.")
      toast({
        title: "저장 실패",
        description: err.message || "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        {existingId ? "업데이트" : "지역 데이터 저장"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{existingId ? "데이터 업데이트" : "지역 데이터 저장"}</DialogTitle>
            <DialogDescription>
              {existingId ? "기존 데이터를 업데이트합니다." : "현재 분석 결과를 지역 데이터로 저장합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                제목
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="예: 강남구 원룸 데이터"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                지역
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                placeholder="예: 서울특별시 강남구"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                설명
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="데이터에 대한 설명을 입력하세요"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : existingId ? (
                "업데이트"
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
