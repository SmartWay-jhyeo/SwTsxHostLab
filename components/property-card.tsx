"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Building,
  MapPin,
  Calculator,
  ExternalLink,
  Edit,
  ChevronUp,
  ChevronDown,
  Info,
  Percent,
  Save,
} from "lucide-react"
import type { Room } from "@/lib/types"
import { generateNaverPropertyUrl } from "@/lib/naver-map-utils"
import { useToast } from "@/hooks/use-toast"
import { useProfitCalculation } from "@/hooks/use-profit-calculation"
import { useApiCall } from "@/hooks/use-api-call"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatNumber, formatCurrency, formatPercentage, convertReviewScore } from "@/lib/utils"
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/lib/constants"

interface PropertyCardProps {
  room: Room
  onClick?: () => void
  onRoomUpdate?: (updatedRoom: Room) => void
  isUpdating?: boolean
  showEditButton?: boolean
}

export function PropertyCard({
  room,
  onClick,
  onRoomUpdate,
  isUpdating = false,
  showEditButton = false,
}: PropertyCardProps) {
  const [showSimulation, setShowSimulation] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [localRoom, setLocalRoom] = useState<Room>(room)
  const [isEditingOccupancy, setIsEditingOccupancy] = useState(false)
  const [occupancyRate, setOccupancyRate] = useState(room.occupancy_rate?.toString() || "0")
  const [occupancy2Rate, setOccupancy2Rate] = useState(room.occupancy_2rate?.toString() || "0")
  const [occupancy3Rate, setOccupancy3Rate] = useState(room.occupancy_3rate?.toString() || "0")

  const { toast } = useToast()
  const { execute: executeOccupancyUpdate, isLoading: isUpdatingOccupancy } = useApiCall()
  const { execute: executeCostsSave, isLoading: isSavingCosts } = useApiCall()

  const { costs, scenarios, isCalculating, updateCosts, calculateAllScenarios } = useProfitCalculation(localRoom)

  // room prop이 변경되면 localRoom 업데이트
  useEffect(() => {
    setLocalRoom(room)
  }, [room])

  // 예약률 수정 다이얼로그가 열릴 때 현재 값으로 초기화
  useEffect(() => {
    if (isEditingOccupancy) {
      setOccupancyRate(localRoom.occupancy_rate?.toString() || "0")
      setOccupancy2Rate(localRoom.occupancy_2rate?.toString() || "0")
      setOccupancy3Rate(localRoom.occupancy_3rate?.toString() || "0")
    }
  }, [isEditingOccupancy, localRoom])

  // 시뮬레이션 패널이 열릴 때 자동으로 계산 실행
  useEffect(() => {
    if (showSimulation) {
      calculateAllScenarios()
    }
  }, [showSimulation, calculateAllScenarios])

  // 네이버 부동산 열기
  const handleOpenNaverProperty = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!localRoom.latitude || !localRoom.longitude) {
        toast({
          title: "위치 정보 없음",
          description: "선택한 숙소의 위치 정보가 없습니다.",
          variant: "destructive",
        })
        return
      }

      const url = generateNaverPropertyUrl(localRoom.latitude, localRoom.longitude, localRoom.building_type)
      window.open(url, "_blank")
    },
    [localRoom, toast],
  )

  // 33m2 사이트 열기
  const handleOpen33m2 = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const propertyId = localRoom.property_id || "69204"
      const url = `https://33m2.co.kr/room/detail/${propertyId}`
      window.open(url, "_blank")
    },
    [localRoom],
  )

  // 시뮬레이션 토글
  const handleSimulationClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setShowSimulation(!showSimulation)
    },
    [showSimulation],
  )

  // 비용 입력 변경
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      const numValue = Number.parseInt(value.replace(/[^0-9]/g, "")) || 0
      updateCosts({ [field]: numValue })
    },
    [updateCosts],
  )

  // 월 단위 비용 정보 저장
  const handleSaveCosts = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()

      await executeCostsSave(
        async () => {
          const response = await fetch("/api/update-rental-costs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              propertyId: localRoom.id,
              rentalCosts: {
                monthly_rent: costs.monthlyRent,
                monthly_maintenance: costs.maintenanceFee,
                cleaning_cost: costs.cleaningCost,
                initial_setup_cost: costs.setupCost,
                deposit: costs.deposit,
              },
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "서버 저장에 실패했습니다.")
          }

          const updatedRoom: Room = {
            ...localRoom,
            monthly_rent: costs.monthlyRent,
            monthly_maintenance: costs.maintenanceFee,
            cleaning_cost: costs.cleaningCost,
            initial_setup_cost: costs.setupCost,
            deposit: costs.deposit,
          }

          setLocalRoom(updatedRoom)

          if (onRoomUpdate) {
            onRoomUpdate(updatedRoom)
          }

          return updatedRoom
        },
        {
          successMessage: SUCCESS_MESSAGES.dataSaved,
          errorMessage: ERROR_MESSAGES.dataProcessingError,
        },
      )
    },
    [localRoom, costs, onRoomUpdate, executeCostsSave],
  )

  // 예약률 수정 다이얼로그 열기
  const handleEditOccupancy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingOccupancy(true)
  }, [])

  // 예약률 수정 제출 처리
  const handleSubmitOccupancy = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const rate1 = Number.parseFloat(occupancyRate)
      const rate2 = Number.parseFloat(occupancy2Rate)
      const rate3 = Number.parseFloat(occupancy3Rate)

      if (isNaN(rate1) || isNaN(rate2) || isNaN(rate3)) {
        toast({
          title: "입력 오류",
          description: "모든 예약률은 숫자로 입력해주세요.",
          variant: "destructive",
        })
        return
      }

      if (rate1 < 0 || rate1 > 100 || rate2 < 0 || rate2 > 100 || rate3 < 0 || rate3 > 100) {
        toast({
          title: "입력 오류",
          description: "예약률은 0에서 100 사이의 값이어야 합니다.",
          variant: "destructive",
        })
        return
      }

      await executeOccupancyUpdate(
        async () => {
          const response = await fetch("/api/update-occupancy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              propertyId: localRoom.id,
              occupancyRates: {
                occupancy_rate: rate1,
                occupancy_2rate: rate2,
                occupancy_3rate: rate3,
              },
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "서버 저장에 실패했습니다.")
          }

          const updatedRoom: Room = {
            ...localRoom,
            occupancy_rate: rate1,
            occupancy_2rate: rate2,
            occupancy_3rate: rate3,
          }

          setLocalRoom(updatedRoom)

          if (onRoomUpdate) {
            onRoomUpdate(updatedRoom)
          }

          setIsEditingOccupancy(false)
          return updatedRoom
        },
        {
          successMessage: "예약률이 성공적으로 업데이트되었습니다.",
          errorMessage: "예약률 업데이트 중 오류가 발생했습니다.",
        },
      )
    },
    [localRoom, occupancyRate, occupancy2Rate, occupancy3Rate, onRoomUpdate, executeOccupancyUpdate, toast],
  )

  // 리뷰 점수 계산
  const reviewScore = useMemo(() => {
    return convertReviewScore(localRoom.review_info?.review_score)
  }, [localRoom.review_info])

  return (
    <div className="flex-none w-[300px]">
      <Card className="h-full cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
        <div className="aspect-video relative bg-muted" onClick={onClick}>
          {localRoom.images && localRoom.images[0] ? (
            <img
              src={localRoom.images[0] || "/placeholder.svg"}
              alt={localRoom.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Building className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 bg-primary">
            예약률 {Math.round(localRoom.occupancy_rate || 0)}%
          </Badge>
        </div>

        <CardContent className="p-4" onClick={onClick}>
          <h3 className="font-semibold truncate">{localRoom.name}</h3>
          <p className="text-sm text-muted-foreground flex items-start leading-tight">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
            <span className="break-words">{localRoom.address}</span>
          </p>

          <div className="flex justify-between mt-2 text-sm">
            <span>{localRoom.size_pyeong}평</span>
            <span className="font-medium">{formatCurrency(localRoom.weekly_price)}/주</span>
          </div>

          {/* 예약률 정보 */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-sm">
              <Percent className="h-3 w-3 mr-1 text-primary" />
              <span className="font-medium text-primary">1개월: {formatPercentage(localRoom.occupancy_rate, 0)}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="ml-4">
                2개월: {formatPercentage(localRoom.occupancy_2rate, 0)} | 3개월:{" "}
                {formatPercentage(localRoom.occupancy_3rate, 0)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {localRoom.building_type && (
              <Badge variant="secondary" className="text-xs">
                {localRoom.building_type}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              방 {localRoom.room_count}개
            </Badge>
            {localRoom.review_info && reviewScore && (
              <Badge variant="outline" className="text-xs">
                ★ {reviewScore} ({localRoom.review_info.review_count})
              </Badge>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              variant={showSimulation ? "default" : "outline"}
              size="sm"
              className="flex items-center justify-center"
              onClick={handleSimulationClick}
            >
              <Calculator className="h-4 w-4 mr-1" />
              시뮬레이션
              {showSimulation ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
              onClick={handleEditOccupancy}
            >
              <Edit className="h-4 w-4 mr-1" />
              예약률 수정
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
              onClick={handleOpenNaverProperty}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              네이버 매물
            </Button>

            <Button variant="outline" size="sm" className="flex items-center justify-center" onClick={handleOpen33m2}>
              <ExternalLink className="h-4 w-4 mr-1" />
              33m²
            </Button>
          </div>
        </CardContent>

        {/* 호스트 시뮬레이션 섹션 */}
        {showSimulation && (
          <div className="border-t border-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">월 임대료</div>
                  <div className="relative">
                    <Input
                      value={formatNumber(costs.monthlyRent)}
                      onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                      className="pl-6"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">월 관리비</div>
                  <div className="relative">
                    <Input
                      value={formatNumber(costs.maintenanceFee)}
                      onChange={(e) => handleInputChange("maintenanceFee", e.target.value)}
                      className="pl-6"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm font-medium mb-1">청소비</div>
                  <div className="relative">
                    <Input
                      value={formatNumber(costs.cleaningCost)}
                      onChange={(e) => handleInputChange("cleaningCost", e.target.value)}
                      className="pl-6"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">초기 셋업 비용</div>
                  <div className="relative">
                    <Input
                      value={formatNumber(costs.setupCost)}
                      onChange={(e) => handleInputChange("setupCost", e.target.value)}
                      className="pl-6"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-1">보증금</div>
                <div className="relative">
                  <Input
                    value={formatNumber(costs.deposit)}
                    onChange={(e) => handleInputChange("deposit", e.target.value)}
                    className="pl-6"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                </div>
              </div>

              {/* 비용 정보 저장 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 flex items-center justify-center"
                onClick={handleSaveCosts}
                disabled={isSavingCosts}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSavingCosts ? "저장 중..." : "비용 정보 저장"}
              </Button>

              <div className="mt-4 bg-muted p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">숙소 요금 정보</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">주간 숙소비</div>
                    <div className="font-medium">{formatCurrency(localRoom.weekly_price)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">주간 관리비</div>
                    <div className="font-medium">{formatCurrency(localRoom.weekly_maintenance)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">청소비</div>
                    <div className="font-medium">{formatCurrency(localRoom.cleaning_fee)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">총 주간 비용</div>
                    <div className="font-medium">
                      {formatCurrency(
                        (localRoom.weekly_price || 0) +
                          (localRoom.weekly_maintenance || 0) +
                          (localRoom.cleaning_fee || 0),
                      )}
                    </div>
                  </div>
                </div>

                {/* 할인율 정보 */}
                <div className="mt-2 border-t border-gray-200 pt-2">
                  <h5 className="text-sm font-medium mb-1">할인율 정보</h5>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">2주 할인</div>
                      <div className="font-medium">
                        {localRoom.discount_2weeks ? formatPercentage(localRoom.discount_2weeks, 0) : "없음"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">3주 할인</div>
                      <div className="font-medium">
                        {localRoom.discount_3weeks ? formatPercentage(localRoom.discount_3weeks, 0) : "없음"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">4주 할인</div>
                      <div className="font-medium">
                        {localRoom.discount_4weeks ? formatPercentage(localRoom.discount_4weeks, 0) : "없음"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시나리오 테이블 */}
              {scenarios.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1 border text-center bg-muted" rowSpan={2}>
                          예약률
                        </th>
                        <th className="p-1 border text-center bg-muted" colSpan={2}>
                          순이익 (원)
                        </th>
                        <th className="p-1 border text-center bg-muted" colSpan={2}>
                          회수 기간 (개월)
                        </th>
                      </tr>
                      <tr>
                        <th className="p-1 border text-center bg-muted">최소</th>
                        <th className="p-1 border text-center bg-muted">최대</th>
                        <th className="p-1 border text-center bg-muted">최소</th>
                        <th className="p-1 border text-center bg-muted">최대</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 시나리오 데이터를 예약률별로 그룹화하여 표시 */}
                      {[25, 50, 75, 100].map((occupancyRate) => {
                        const rateScenarios = scenarios.filter((s) => s.occupancy_rate === occupancyRate)
                        if (rateScenarios.length === 0) return null

                        const sortedByIncome = [...rateScenarios].sort((a, b) => a.net_income - b.net_income)
                        const minScenario = sortedByIncome[0]
                        const maxScenario = sortedByIncome[sortedByIncome.length - 1]

                        const isCurrentRate = Math.abs(localRoom.occupancy_rate - occupancyRate) <= 12.5

                        return (
                          <tr
                            key={occupancyRate}
                            className={
                              isCurrentRate ? "bg-blue-50" : occupancyRate % 50 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="p-1 border text-center font-medium">
                              {occupancyRate}%
                              {isCurrentRate && <span className="text-blue-600 ml-1 text-[10px] font-bold">해당</span>}
                            </td>
                            <td className="p-1 border text-right">
                              {formatNumber(Math.round(minScenario.net_income))}
                            </td>
                            <td className="p-1 border text-right">
                              {formatNumber(Math.round(maxScenario.net_income))}
                            </td>
                            <td className="p-1 border text-right">
                              {minScenario.breakEvenMonths && minScenario.breakEvenMonths > 0
                                ? minScenario.breakEvenMonths.toFixed(1)
                                : "0.0"}
                            </td>
                            <td className="p-1 border text-right">
                              {maxScenario.breakEvenMonths && maxScenario.breakEvenMonths > 0
                                ? maxScenario.breakEvenMonths.toFixed(1)
                                : "0.0"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 계산 방식 설명 */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowExplanation(!showExplanation)
                  }}
                >
                  <Info className="h-4 w-4 mr-1" />
                  계산 방식 {showExplanation ? "숨기기" : "보기"}
                </Button>

                {showExplanation && (
                  <div className="mt-2 text-xs p-3 bg-gray-50 rounded-md border">
                    <h5 className="font-medium mb-1">계산 방식 설명</h5>
                    <ol className="list-decimal pl-4 space-y-2">
                      <li>
                        <strong>예약률 기준:</strong> 25%, 50%, 75%, 100% 예약률에 따른 최소/최대 수익을 계산합니다.
                      </li>
                      <li>
                        <strong>수입 계산:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>숙소 수입 = (주간 숙소비 + 주간 관리비) × 예약 주 수 × 할인율(장기 예약 시)</li>
                          <li>청소비 수입 = 청소비 × 예약 횟수</li>
                          <li>총 수입 = (숙소 수입 + 청소비 수입) × (1 - 수수료율 3.3%)</li>
                        </ul>
                      </li>
                      <li>
                        <strong>지출 계산:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>월 지출 = 월 임대료 + 월 관리비 + (청소 비용 × 예약 횟수)</li>
                        </ul>
                      </li>
                      <li>
                        <strong>순이익 계산:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>월 순이익 = 총 수입 - 월 지출</li>
                        </ul>
                      </li>
                      <li>
                        <strong>투자금 회수 기간:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>
                            회수 기간(월) = 초기 셋업 비용 ÷ 월 순이익
                            <br />
                            <span className="text-muted-foreground">* 보증금은 회수 가능하므로 계산에서 제외</span>
                          </li>
                        </ul>
                      </li>
                    </ol>
                    <p className="mt-2 text-muted-foreground">
                      * 현재 숙소의 예약률에 해당하는 행에 "해당" 표시가 나타납니다.
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation()
                  calculateAllScenarios()
                }}
                disabled={isCalculating}
              >
                {isCalculating ? "계산 중..." : "수익 계산하기"}
              </Button>
            </CardContent>
          </div>
        )}
      </Card>

      {/* 예약률 수정 다이얼로그 */}
      <Dialog open={isEditingOccupancy} onOpenChange={setIsEditingOccupancy}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>예약률 수정</DialogTitle>
            <DialogDescription>{localRoom.name}의 예약률 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitOccupancy}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="occupancy-rate" className="text-sm font-medium">
                  1개월 예약률 (%)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="occupancy-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={occupancyRate}
                    onChange={(e) => setOccupancyRate(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    ({new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("ko-KR")}까지)
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="occupancy-2rate" className="text-sm font-medium">
                  2개월 예약률 (%)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="occupancy-2rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={occupancy2Rate}
                    onChange={(e) => setOccupancy2Rate(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    ({new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString("ko-KR")}까지)
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="occupancy-3rate" className="text-sm font-medium">
                  3개월 예약률 (%)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="occupancy-3rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={occupancy3Rate}
                    onChange={(e) => setOccupancy3Rate(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    ({new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString("ko-KR")}까지)
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditingOccupancy(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isUpdatingOccupancy}>
                {isUpdatingOccupancy ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
