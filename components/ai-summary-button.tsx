"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AISummaryButtonProps {
  rooms: any[]
  location?: string
  onSummaryGenerated: (summary: string) => void
  customPrompt?: string
}

export function AISummaryButton({ rooms, location, onSummaryGenerated, customPrompt }: AISummaryButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateSummary = async () => {
    if (isGenerating) return

    setIsGenerating(true)

    try {
      console.log("AI 요약 생성 시작:", {
        roomsCount: rooms?.length,
        location,
        hasCustomPrompt: !!customPrompt,
      })

      const response = await fetch("/api/analyze-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rooms, location, customPrompt }),
      })

      console.log("API 응답 상태:", response.status, response.statusText)

      const data = await response.json()
      console.log("API 응답 데이터:", {
        success: data.success,
        hasSummary: !!data.summary,
        summaryLength: data.summary?.length || 0,
        error: data.error,
      })

      if (!response.ok) {
        if (data.isQuotaError) {
          toast({
            title: "API 할당량 초과",
            description: "OpenAI API 할당량이 초과되었습니다. 결제 정보를 확인해주세요.",
            variant: "destructive",
          })
        }
        throw new Error(data.error || "요약 생성에 실패했습니다")
      }

      if (!data.summary) {
        console.error("응답에 summary가 없음:", data)
        throw new Error("AI 응답에서 요약 내용을 찾을 수 없습니다")
      }

      console.log("요약 생성 성공, 콜백 호출")
      onSummaryGenerated(data.summary)

      toast({
        title: "AI 분석 요약 생성 완료",
        description: "ChatGPT가 분석 데이터를 기반으로 요약을 생성했습니다.",
      })
    } catch (error: any) {
      console.error("AI 요약 생성 오류:", error)
      toast({
        title: "요약 생성 실패",
        description: error.message || "요약을 생성하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generateSummary} disabled={isGenerating || !rooms || rooms.length === 0} className="gap-2">
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          AI 분석 생성 중...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          AI 분석 요약 생성
        </>
      )}
    </Button>
  )
}
