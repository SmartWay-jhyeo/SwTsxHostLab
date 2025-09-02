"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { SearchResults } from "@/components/search-results"
import { ArrowLeft } from "lucide-react"
import { PasswordProtection } from "@/components/password-protection"
import { createClient } from "@/lib/supabase/client"

interface SavedResultPageProps {
  params: {
    id: string
  }
}

export default function SavedResultPage({ params }: SavedResultPageProps) {
  const { id } = params
  const router = useRouter()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const supabase = createClient()

        // 저장된 분석 결과 가져오기
        const response = await supabase.from("analysis_results").select("*").eq("id", id).single()

        if (response.error) {
          throw response.error
        }

        setResult(response.data)
      } catch (err) {
        console.error("데이터 로드 오류:", err)

        // 프리뷰 모드에서는 샘플 데이터 제공
        if ((process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_SUPABASE_URL) && id === "1") {
          setResult({
            id: 1,
            title: "샘플 분석 결과",
            description: "프리뷰 모드에서 표시되는 샘플 데이터입니다.",
            location: "서울특별시 강남구",
            created_at: new Date().toISOString(),
            room_count: 25,
            password: "1234", // 샘플 비밀번호
            data: Array(25)
              .fill(0)
              .map((_, i) => ({
                id: i + 1,
                name: `샘플 숙소 ${i + 1}`,
                address: `서울특별시 강남구 테스트동 ${i + 1}번지`,
                building_type: ["오피스텔", "아파트", "빌라", "단독주택", "원룸"][i % 5],
                room_count: (i % 3) + 1,
                weekly_price: 300000 + i * 10000,
                weekly_maintenance: 30000 + i * 1000,
                cleaning_fee: 50000,
                discount_2weeks: 5,
                discount_3weeks: 8,
                discount_4weeks: 10,
                discount_5weeks: 12,
                discount_6weeks: 15,
                discount_7weeks: 18,
                discount_8weeks: 20,
                discount_9weeks: 22,
                discount_10weeks: 25,
                discount_11weeks: 28,
                discount_12weeks: 30,
                occupancy_rate: 50 + (i % 50),
                occupancy_2rate: 40 + (i % 40),
                occupancy_3rate: 30 + (i % 30),
                bathroom_count: 1,
                kitchen_count: 1,
                living_room_count: i % 2,
                has_elevator: i % 2 === 0,
                parking_info: i % 2 === 0 ? "주차 가능" : "주차 불가",
                size_pyeong: 10 + (i % 10),
                images: [],
                is_super_host: i % 3 === 0,
                review_info: null,
                latitude: 37.5 + (Math.random() - 0.5) * 0.1,
                longitude: 127 + (Math.random() - 0.5) * 0.1,
              })),
          })
        } else {
          setError("데이터를 불러올 수 없습니다.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [id])

  // 비밀번호 확인 완료 처리
  const handlePasswordVerified = () => {
    setIsPasswordVerified(true)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !result) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-destructive">{error || "데이터를 찾을 수 없습니다."}</p>
            <Button asChild className="mt-4">
              <Link href="/saved-results">목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/saved-results">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{result.title}</h1>
        </div>

        {/* 비밀번호 보호 확인 */}
        {result.password && !isPasswordVerified ? (
          <PasswordProtection password={result.password} onPasswordVerified={handlePasswordVerified} />
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
                  {result.description && (
                    <div className="mt-4">
                      <span className="font-medium">설명:</span>
                      <p className="mt-1 text-muted-foreground">{result.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 저장된 분석 결과 표시 */}
            <SearchResults rooms={result.data} />
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
