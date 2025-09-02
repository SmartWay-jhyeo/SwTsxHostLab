"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AISummaryButton } from "@/components/ai-summary-button"
import { Copy, Check, Save, X, Download, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"

interface AIAnalysisSummaryProps {
  rooms: any[]
  location?: string
}

interface HostSituation {
  ageGroup?: "20대" | "30대" | "40대" | "50대" | "60대이상"
  gender?: "남성" | "여성"
  budget?: "500만원 이하" | "500-1000만원" | "1000-2000만원" | "2000만원 이상"
}

export function AIAnalysisSummary({ rooms, location }: AIAnalysisSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isEditingSituation, setIsEditingSituation] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) // 상황분석 생성 로딩 상태
  const [hostSituation, setHostSituation] = useState<HostSituation>({})
  const { toast } = useToast()

  const handleSummaryGenerated = (text: string) => {
    console.log("요약 생성됨:", { textLength: text?.length || 0 })
    setSummary(text)
  }

  const copyToClipboard = async () => {
    if (!summary) return

    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      toast({
        title: "복사 완료",
        description: "분석 요약이 클립보드에 복사되었습니다.",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드에 복사하지 못했습니다.",
        variant: "destructive",
      })
    }
  }

  const toggleSituationEditor = () => {
    setIsEditingSituation(!isEditingSituation)
  }

  const generateWithSituation = async () => {
    try {
      setIsGenerating(true) // 로딩 시작
      console.log("상황분석으로 요약 생성 시작", hostSituation)

      const response = await fetch("/api/analyze-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rooms, location, hostSituation }),
      })

      console.log("API 응답 상태:", response.status, response.statusText)

      // 응답이 JSON이 아닐 수 있으므로 먼저 텍스트로 읽어보기
      const responseText = await response.text()
      console.log("API 응답 텍스트:", responseText.substring(0, 200))

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError)
        console.error("응답 텍스트:", responseText)
        throw new Error("서버에서 잘못된 응답을 받았습니다. 다시 시도해주세요.")
      }

      if (!response.ok) {
        throw new Error(data.error || "요약 생성에 실패했습니다")
      }

      if (!data.summary) {
        console.error("응답에 summary가 없음:", data)
        throw new Error("AI 응답에서 요약 내용을 찾을 수 없습니다")
      }

      console.log("요약 생성 성공, 콜백 호출")
      setSummary(data.summary)
      setIsEditingSituation(false)

      toast({
        title: "상황분석 AI 분석 생성 완료",
        description: "호스트 상황에 맞춤화된 분석 요약이 생성되었습니다.",
      })
    } catch (error: any) {
      console.error("상황분석 AI 요약 생성 오류:", error)
      toast({
        title: "요약 생성 실패",
        description: error.message || "요약을 생성하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false) // 로딩 종료
    }
  }

  const downloadAsTxt = () => {
    if (!summary) return

    const element = document.createElement("a")
    const file = new Blob([summary], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${location || "지역"}_단기임대_분석_${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getSituationDescription = () => {
    const parts = []
    if (hostSituation.ageGroup) parts.push(hostSituation.ageGroup)
    if (hostSituation.gender) parts.push(hostSituation.gender)
    if (hostSituation.budget) parts.push(`예산 ${hostSituation.budget}`)

    if (parts.length === 0) return "기본 분석 (호스트, 1000만원 이하)"
    return `${parts.join(" ")} 호스트 맞춤 분석`
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>AI 분석 요약</span>
          {!summary && !isEditingSituation && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleSituationEditor} disabled={isGenerating}>
                <User className="h-4 w-4 mr-2" />
                상황분석추가
              </Button>
              <AISummaryButton rooms={rooms} location={location} onSummaryGenerated={handleSummaryGenerated} />
            </div>
          )}
        </CardTitle>
        <CardDescription>
          ChatGPT가 분석한 데이터를 기반으로 {location || "해당 지역"}의 단기임대 시장에 대한 종합적인 인사이트를
          제공합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditingSituation ? (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">호스트 상황분석 추가</h4>
              <p className="text-sm text-muted-foreground mb-4">
                선택하지 않으면 기본으로 분석이 됩니다 (일반 호스트, 1000만원 이하 예산). 선택한 조건들을 조합하여
                맞춤형 분석을 제공합니다. 선택한 정보들은 저장되지않고 분석을 위한용도로써 사용됩니.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">연령대</label>
                  <Select
                    value={hostSituation.ageGroup || "none"}
                    onValueChange={(value) =>
                      setHostSituation((prev) => ({
                        ...prev,
                        ageGroup: value === "none" ? undefined : (value as HostSituation["ageGroup"]),
                      }))
                    }
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택안함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택안함</SelectItem>
                      <SelectItem value="20대">20대</SelectItem>
                      <SelectItem value="30대">30대</SelectItem>
                      <SelectItem value="40대">40대</SelectItem>
                      <SelectItem value="50대">50대</SelectItem>
                      <SelectItem value="60대이상">60대이상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">성별</label>
                  <Select
                    value={hostSituation.gender || "none"}
                    onValueChange={(value) =>
                      setHostSituation((prev) => ({
                        ...prev,
                        gender: value === "none" ? undefined : (value as HostSituation["gender"]),
                      }))
                    }
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택안함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택안함</SelectItem>
                      <SelectItem value="남성">남성</SelectItem>
                      <SelectItem value="여성">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">예산 (보증금 포함)</label>
                  <Select
                    value={hostSituation.budget || "none"}
                    onValueChange={(value) =>
                      setHostSituation((prev) => ({
                        ...prev,
                        budget: value === "none" ? undefined : (value as HostSituation["budget"]),
                      }))
                    }
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택안함 (1000만원)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택안함 (1000만원)</SelectItem>
                      <SelectItem value="500만원 이하">500만원 이하</SelectItem>
                      <SelectItem value="500-1000만원">500-1000만원</SelectItem>
                      <SelectItem value="1000-2000만원">1000-2000만원</SelectItem>
                      <SelectItem value="2000만원 이상">2000만원 이상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>분석 유형:</strong> {getSituationDescription()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  ⚠️ 모든 예산에는 보증금이 포함되어 있습니다
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={toggleSituationEditor} disabled={isGenerating}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button size="sm" onClick={generateWithSituation} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    분석 생성 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    상황분석으로 생성
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:leading-relaxed prose-li:leading-relaxed prose-ul:space-y-1 prose-ol:space-y-1 prose-headings:mb-3 prose-headings:mt-6 prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4 overflow-auto">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 mt-6 text-primary border-b pb-2">{children}</h1>
                  ),
                  h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 text-primary">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-primary">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 text-primary">{children}</h4>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 space-y-1 pl-6">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 space-y-1 pl-6">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                      <code className="text-sm font-mono">{children}</code>
                    </pre>
                  ),
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "복사됨" : "복사하기"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsTxt}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSituationEditor} disabled={isGenerating}>
                <User className="h-4 w-4 mr-2" />
                상황분석추가
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSummary(null)}>
                새로 생성
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>AI 분석 요약을 생성하려면 상단의 버튼을 클릭하세요.</p>
            <p className="text-sm mt-2">분석 데이터를 기반으로 ChatGPT가 종합적인 인사이트를 제공합니다.</p>
            <p className="text-xs mt-1">상황분석추가 버튼을 클릭하여 호스트 상황에 맞춤화된 분석을 받을 수 있습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
