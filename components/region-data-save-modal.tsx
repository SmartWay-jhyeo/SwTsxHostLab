"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AdminRegionSelector } from "@/components/admin-region-selector"
import { useToast } from "@/hooks/use-toast"
import type { Room } from "@/lib/types"

interface RegionDataSaveModalProps {
  isOpen: boolean
  onClose: () => void
  rooms: Room[]
  onSaveSuccess?: () => void
}

interface RegionSelection {
  province: string
  district: string
  dong: string
}

export function RegionDataSaveModal({ isOpen, onClose, rooms, onSaveSuccess }: RegionDataSaveModalProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionSelection | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleRegionSelect = (province: string, district: string, dong: string) => {
    setSelectedRegion({ province, district, dong })
  }

  const handleSave = async () => {
    if (!selectedRegion || !selectedRegion.province || !selectedRegion.district || !selectedRegion.dong) {
      toast({
        title: "오류",
        description: "모든 지역을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const requestData = {
        city: selectedRegion.province,
        district: selectedRegion.district,
        neighborhood: selectedRegion.dong,
        data: rooms,
      }

      const response = await fetch("/api/save-hierarchical-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "저장 완료",
          description: `${selectedRegion.province} ${selectedRegion.district} ${selectedRegion.dong}에 ${result.total_properties}개 부동산 데이터가 저장되었습니다.`,
        })

        setSelectedRegion(null)
        onClose()
        onSaveSuccess?.()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "저장 실패",
        description: error.message || "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  const isButtonDisabled =
    !selectedRegion || !selectedRegion.province || !selectedRegion.district || !selectedRegion.dong || isSaving

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>지역 데이터 저장</DialogTitle>
          <DialogDescription>분석된 부동산 데이터를 저장합니다. (행정안전부 기준 지역 선택)</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AdminRegionSelector onRegionSelect={handleRegionSelect} />

          {selectedRegion && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                선택된 지역: {selectedRegion.province} {selectedRegion.district} {selectedRegion.dong}
              </p>
              <p className="text-xs text-green-600 mt-1">저장할 데이터: {rooms?.length || 0}개 부동산</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isButtonDisabled} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
