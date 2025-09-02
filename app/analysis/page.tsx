"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader-fixed"
import { SearchResults } from "@/components/search-results"
import { RegionDataSaveModal } from "@/components/region-data-save-modal"
import { ProtectedRoute } from "@/components/protected-route"
import type { Room } from "@/lib/types"
import Link from "next/link"
import { ArrowRight, ShieldAlert } from "lucide-react"

export default function AnalysisPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<Room[] | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)

  // 관리자 권한 체크
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // 로컬 스토리지에서 사용자 정보 확인 (lib/auth.ts의 방식과 일치)
        if (typeof window !== "undefined") {
          const userJson = localStorage.getItem("auth_user")
          if (userJson) {
            try {
              const user = JSON.parse(userJson)
              setIsAdmin(user.is_admin === true)
            } catch (error) {
              console.error("사용자 정보 파싱 오류:", error)
              setIsAdmin(false)
            }
          } else {
            setIsAdmin(false)
          }
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("관리자 권한 확인 오류:", error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  const handleDataLoaded = (data: Room[]) => {
    console.log("데이터 로드됨:", data.length)
    setRooms(data)
    setIsAnalyzing(false)
  }

  const startAnalysis = () => {
    if (rooms && rooms.length > 0) {
      console.log("분석 시작:", rooms.length)
      setIsAnalyzing(true)
      setResults(rooms) // 분석 결과를 results 상태에 저장
    } else {
      console.warn("분석할 데이터가 없습니다.")
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">데이터 분석</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">권한을 확인하는 중입니다...</p>
          </div>
        ) : !isAdmin ? (
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">관리자 권한이 필요합니다</h2>
              <p className="text-muted-foreground text-center mb-6">데이터 분석 기능은 관리자만 사용할 수 있습니다.</p>
              <Button asChild>
                <Link href="/">홈으로 돌아가기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>데이터 파일 업로드</CardTitle>
                <CardDescription>
                  33m² 사이트에서 수집한 JSON 형식의 데이터 파일을 업로드하여 분석하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <FileUploader
                      onDataLoaded={handleDataLoaded}
                      label="데이터 파일 선택"
                      helpText={rooms ? `${rooms.length}개 매물 로드됨` : "JSON 파일을 업로드하세요"}
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={startAnalysis}
                      disabled={!rooms || rooms.length === 0}
                      className="w-full md:w-auto"
                      size="lg"
                    >
                      {isAnalyzing ? "분석 중..." : "데이터 분석 시작"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAnalyzing && rooms && rooms.length > 0 && (
              <div className="mt-8">
                <SearchResults rooms={rooms} onSaveClick={() => setShowSaveModal(true)} />
              </div>
            )}

            {!isAnalyzing && (!rooms || rooms.length === 0) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">데이터 파일을 업로드하고 분�� 버튼을 클릭하세요.</p>
              </div>
            )}

            {/* 분석 결과 표시 후 호스트 시뮬레이션 버튼 추가 */}
            {results && (
              <div className="mt-8 text-center">
                <Button asChild size="lg">
                  <Link href="/host-simulation">
                    호스트 시뮬레이션 시작하기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  분석한 데이터를 기반으로 호스트가 되었을 때의 수익을 시뮬레이션해보세요.
                </p>
              </div>
            )}
          </>
        )}

        {/* 지역데이터 저장 모달 */}
        {rooms && <RegionDataSaveModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} rooms={rooms} />}
      </div>
    </ProtectedRoute>
  )
}
