"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import type { Room, NaverPropertyData } from "@/lib/types"

interface NaverDataValidatorProps {
  room: Room
  onUpdate?: (updatedRoom: Room) => void
}

export function NaverDataValidator({ room, onUpdate }: NaverDataValidatorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [averageDeposit, setAverageDeposit] = useState(room.naver_property_data?.average_deposit?.toString() || "")
  const [averageMonthlyRent, setAverageMonthlyRent] = useState(
    room.naver_property_data?.average_monthly_rent?.toString() || "",
  )
  const [averageMaintenanceFee, setAverageMaintenanceFee] = useState(
    room.naver_property_data?.average_maintenance_fee?.toString() || "",
  )

  const hasNaverData = !!room.naver_property_data
  const naverPropertyId = room.naver_property_data?.property_id || ""

  const handleSave = () => {
    if (!room.naver_property_data || !onUpdate) return

    // 입력값을 숫자로 변환
    const deposit = averageDeposit ? Number.parseInt(averageDeposit.replace(/,/g, ""), 10) : 0
    const monthlyRent = averageMonthlyRent ? Number.parseInt(averageMonthlyRent.replace(/,/g, ""), 10) : 0
    const maintenanceFee = averageMaintenanceFee ? Number.parseInt(averageMaintenanceFee.replace(/,/g, ""), 10) : 0

    // 네이버 부동산 데이터 업데이트
    const updatedNaverData: NaverPropertyData = {
      ...room.naver_property_data,
      average_deposit: deposit,
      average_monthly_rent: monthlyRent,
      average_maintenance_fee: maintenanceFee,
      is_manually_edited: true,
      last_edited_at: new Date().toISOString(),
    }

    // 방 데이터 업데이트
    const updatedRoom: Room = {
      ...room,
      naver_property_data: updatedNaverData,
    }

    // 부모 컴포넌트에 업데이트 알림
    onUpdate(updatedRoom)
    setIsEditing(false)
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "정보 없음"
    return num.toLocaleString() + "원"
  }

  const openNaverProperty = () => {
    if (!naverPropertyId) return

    // 네이버 부동산 URL 형식에 맞게 변환
    const url = `https://new.land.naver.com/complexes/${naverPropertyId}`
    window.open(url, "_blank")
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          네이버 부동산 데이터
          {hasNaverData ? (
            <Badge variant="success">데이터 있음</Badge>
          ) : (
            <Badge variant="destructive">데이터 없음</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasNaverData
            ? "네이버 부동산에서 수집한 시세 정보입니다. 필요시 수정할 수 있습니다."
            : "이 숙소에 대한 네이버 부동산 데이터가 없습니다."}
        </CardDescription>
      </CardHeader>

      {hasNaverData ? (
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="average-deposit">보증금 (평균)</Label>
                <Input
                  id="average-deposit"
                  value={averageDeposit}
                  onChange={(e) => setAverageDeposit(e.target.value)}
                  placeholder="예: 10000000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="average-monthly-rent">월세 (평균)</Label>
                <Input
                  id="average-monthly-rent"
                  value={averageMonthlyRent}
                  onChange={(e) => setAverageMonthlyRent(e.target.value)}
                  placeholder="예: 500000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="average-maintenance-fee">관리비 (평균)</Label>
                <Input
                  id="average-maintenance-fee"
                  value={averageMaintenanceFee}
                  onChange={(e) => setAverageMaintenanceFee(e.target.value)}
                  placeholder="예: 50000"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-sm text-muted-foreground">보증금 (평균)</p>
                  <p className="text-lg font-bold">{formatNumber(room.naver_property_data?.average_deposit)}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-sm text-muted-foreground">월세 (평균)</p>
                  <p className="text-lg font-bold">{formatNumber(room.naver_property_data?.average_monthly_rent)}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                  <p className="text-sm text-muted-foreground">관리비 (평균)</p>
                  <p className="text-lg font-bold">{formatNumber(room.naver_property_data?.average_maintenance_fee)}</p>
                </div>
              </div>

              {room.naver_property_data?.is_manually_edited && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>수동 수정됨</AlertTitle>
                  <AlertDescription>
                    이 데이터는 {new Date(room.naver_property_data.last_edited_at || "").toLocaleDateString()}에
                    수동으로 수정되었습니다.
                  </AlertDescription>
                </Alert>
              )}

              {naverPropertyId && (
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={openNaverProperty}
                >
                  <ExternalLink className="h-4 w-4" />
                  네이버 부동산에서 보기
                </Button>
              )}
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>네이버 부동산 데이터 없음</AlertTitle>
            <AlertDescription>
              이 숙소에 대한 네이버 부동산 데이터가 없습니다. 수동으로 데이터를 추가하거나 네이버 부동산에서 데이터를
              수집해야 합니다.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {hasNaverData && onUpdate && (
        <CardFooter className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button onClick={handleSave}>저장</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              데이터 수정
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
