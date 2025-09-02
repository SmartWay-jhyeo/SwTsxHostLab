"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Edit2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Room } from "@/lib/types"

interface EditReservationRateProps {
  room: Room
  onUpdate: (updatedRoom: Room) => void
}

export function EditReservationRate({ room, onUpdate }: EditReservationRateProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [occupancyRate, setOccupancyRate] = useState((room.occupancy_rate || 0).toString())
  const [occupancy2Rate, setOccupancy2Rate] = useState((room.occupancy_2rate || 0).toString())
  const [occupancy3Rate, setOccupancy3Rate] = useState((room.occupancy_3rate || 0).toString())
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // 입력값 검증
      const rate1 = Number.parseFloat(occupancyRate)
      const rate2 = Number.parseFloat(occupancy2Rate)
      const rate3 = Number.parseFloat(occupancy3Rate)

      if (isNaN(rate1) || isNaN(rate2) || isNaN(rate3)) {
        throw new Error("예약률은 숫자로 입력해주세요.")
      }

      if (rate1 < 0 || rate1 > 100 || rate2 < 0 || rate2 > 100 || rate3 < 0 || rate3 > 100) {
        throw new Error("예약률은 0에서 100 사이의 값이어야 합니다.")
      }

      // API 호출하여 데이터베이스에 저장
      const response = await fetch("/api/update-occupancy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: room.id,
          occupancyRates: {
            occupancy_rate: rate1,
            occupancy_2rate: rate2,
            occupancy_3rate: rate3,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "예약률 업데이트에 실패했습니다.")
      }

      // 업데이트된 객실 정보 생성
      const updatedRoom: Room = {
        ...room,
        occupancy_rate: rate1,
        occupancy_2rate: rate2,
        occupancy_3rate: rate3,
      }

      // 부모 컴포넌트에 업데이트 알림
      onUpdate(updatedRoom)

      // 성공 메시지 표시
      toast({
        title: "예약률 업데이트 성공",
        description: "예약률이 성공적으로 업데이트되었습니다.",
      })

      // 다이얼로그 닫기
      setOpen(false)
    } catch (error: any) {
      setError(error.message || "예약률 업데이트 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-1">
        <Edit2 className="h-3 w-3" />
        <span>예약률 수정</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>예약률 수정</DialogTitle>
            <DialogDescription>{room.name}의 예약률 정보를 ��정합니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="occupancy-rate">1개월 예약률 (%)</Label>
                <Input
                  id="occupancy-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupancy-2rate">2개월 예약률 (%)</Label>
                <Input
                  id="occupancy-2rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={occupancy2Rate}
                  onChange={(e) => setOccupancy2Rate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupancy-3rate">3개월 예약률 (%)</Label>
                <Input
                  id="occupancy-3rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={occupancy3Rate}
                  onChange={(e) => setOccupancy3Rate(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
