"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MarketAnalysis } from "@/components/market-analysis"
import { OccupancyAnalysis } from "@/components/occupancy-analysis"
import { PriceAnalysis } from "@/components/price-analysis"
import { TopProperties } from "@/components/top-properties"
import { ConsultationNotes } from "@/components/consultation-notes"
import { AIAnalysisSummary } from "@/components/ai-analysis-summary"
import { PropertyCard } from "@/components/property-card"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorBoundary } from "@/components/common/error-boundary"
import { AlertTriangle, Database, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { Room } from "@/lib/types"
import { SimplifiedRegionSaveModal } from "@/components/simplified-region-save-modal"

interface SearchResultsProps {
  rooms: Room[]
  showSaveButton?: boolean
  showConsultationNotes?: boolean
  showEditButton?: boolean
  location?: string
  onSaveClick?: () => void
  onRoomUpdate?: (updatedRoom: Room) => void
  onDataRefresh?: () => Promise<void>
}

export function SearchResults({
  rooms = [],
  showSaveButton = true,
  showConsultationNotes = false,
  showEditButton = false,
  location,
  onSaveClick,
  onRoomUpdate,
  onDataRefresh,
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState("market")
  const [updatedRooms, setUpdatedRooms] = useState<Room[]>(rooms)
  const [isUpdating, setIsUpdating] = useState(false)
  const { isAdmin } = useAuth()
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    setUpdatedRooms(rooms)
  }, [rooms])

  // 예약률 업데이트 및 데이터베이스 저장
  const handleRoomUpdate = async (updatedRoom: Room) => {
    setIsUpdating(true)
    try {
      // 데이터베이스에 예약률 저장
      const response = await fetch("/api/update-occupancy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: updatedRoom.id,
          occupancyRate: updatedRoom.occupancy_rate,
          occupancy2Rate: updatedRoom.occupancy_2rate,
          occupancy3Rate: updatedRoom.occupancy_3rate,
        }),
      })

      if (!response.ok) {
        throw new Error("예약률 업데이트 실패")
      }

      // 로컬 상태 업데이트
      setUpdatedRooms((prevRooms) => prevRooms.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)))

      // 부모 컴포넌트에 알림
      if (onRoomUpdate) {
        onRoomUpdate(updatedRoom)
      }

      // 전체 데이터 새로고침 (지도 포함)
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      alert("예약률 업데이트에 실패했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  // 데이터 유효성 검사
  const isValidData = Array.isArray(updatedRooms) && updatedRooms.length > 0

  // 데이터 오류 확인
  const hasDataErrors = () => {
    if (!isValidData) return true

    const requiredFields = ["id", "name", "weekly_price"]
    const missingFields = updatedRooms.some((room) => {
      return requiredFields.some((field) => {
        const value = room[field as keyof Room]
        return value === undefined || value === null
      })
    })

    return missingFields
  }

  const handleSaveClick = () => {
    setShowSaveModal(true)
  }

  const handleSaveComplete = (result: any) => {
    setShowSaveModal(false)
    // 성공 메시지 표시 등 추가 처리
    console.log("저장 완료:", result)
  }

  if (!Array.isArray(updatedRooms)) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12 text-amber-500" />}
        title="데이터 형식 오류"
        description="분석 결과 데이터가 배열 형식이 아닙니다."
      />
    )
  }

  if (updatedRooms.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12 text-muted-foreground" />}
        title="데이터가 없습니다"
        description="분석할 매물 데이터가 없습니다."
      />
    )
  }

  if (hasDataErrors()) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12 text-amber-500" />}
        title="데이터 형식 오류"
        description="일부 매물 데이터에 필수 필드가 누락되었습니다."
      />
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold">분석 결과</h2>
          {onSaveClick && (
            <Button onClick={handleSaveClick} variant="outline" size="lg">
              <Database className="mr-2 h-4 w-4" />
              지역데이터 저장
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8">
            <TabsTrigger value="market">시장 분석</TabsTrigger>
            <TabsTrigger value="price">가격 분석</TabsTrigger>
            <TabsTrigger value="occupancy">예약률 분석</TabsTrigger>
            <TabsTrigger value="top">추천 매물</TabsTrigger>
            <TabsTrigger value="ai">AI 요약</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4">
            <ErrorBoundary>
              <MarketAnalysis rooms={updatedRooms} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="price" className="space-y-4">
            <ErrorBoundary>
              <PriceAnalysis rooms={updatedRooms} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="occupancy" className="space-y-4">
            <ErrorBoundary>
              <OccupancyAnalysis rooms={updatedRooms} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="top" className="space-y-4">
            <ErrorBoundary>
              <TopProperties rooms={updatedRooms} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <ErrorBoundary>
              <AIAnalysisSummary rooms={updatedRooms} location={location} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">전체 매물 목록</h3>
          <ErrorBoundary>
            <div className="grid gap-4">
              {updatedRooms.map((room) => (
                <PropertyCard
                  key={room.id}
                  room={room}
                  onRoomUpdate={showEditButton ? handleRoomUpdate : undefined}
                  isUpdating={isUpdating}
                  showEditButton={showEditButton}
                />
              ))}
            </div>
          </ErrorBoundary>
        </div>

        {showConsultationNotes && isAdmin && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">상담 일지</h2>
            <ErrorBoundary>
              <ConsultationNotes rooms={updatedRooms} location={location} />
            </ErrorBoundary>
          </div>
        )}
        <SimplifiedRegionSaveModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          rooms={updatedRooms}
          onSaveComplete={handleSaveComplete}
        />
      </div>
    </ErrorBoundary>
  )
}
