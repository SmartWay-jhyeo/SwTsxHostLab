"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RegionSelector } from "@/components/region-selector"
import { FileUploader } from "@/components/file-uploader-fixed"
import { useToast } from "@/hooks/use-toast"
import type { Room } from "@/lib/types"

interface RegionSelection {
  province: string
  district: string
  dong: string
}

interface HierarchicalDataUploaderProps {
  onDataSaved: (neighborhoodId: number, propertyCount: number) => void
}

export function HierarchicalDataUploader({ onDataSaved }: HierarchicalDataUploaderProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionSelection | null>(null)

  const [sourceFile, setSourceFile] = useState("")
  const [uploadedData, setUploadedData] = useState<Room[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleDataLoaded = (data: Room[]) => {
    setUploadedData(data)
    toast({
      title: "파일 업로드 완료",
      description: `${data.length}개의 부동산 데이터가 로드되었습니다.`,
    })
  }

  const handleSaveData = async () => {
    if (!selectedRegion || !uploadedData || !sourceFile) {
      toast({
        title: "오류",
        description: "지역 선택, 파일명, 데이터가 모두 필요합니다.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("city", selectedRegion.province)
      formData.append("district", selectedRegion.district)
      formData.append("neighborhood", selectedRegion.dong)
      formData.append("sourceFile", sourceFile)
      formData.append("data", JSON.stringify(uploadedData))

      const response = await fetch("/api/save-hierarchical-data", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "저장 완료",
          description: `${selectedRegion.province} ${selectedRegion.district} ${selectedRegion.dong}에 ${result.total_properties}개 부동산 데이터가 저장되었습니다.`,
        })
        onDataSaved(result.neighborhood_id, result.total_properties)

        // 폼 초기화
        setSelectedRegion(null)
        setSourceFile("")
        setUploadedData(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("저장 오류:", error)
      toast({
        title: "저장 실패",
        description: error.message || "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isReadyToSave = selectedRegion && uploadedData && sourceFile.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle>계층적 데이터 저장</CardTitle>
        <CardDescription>JSON 파일을 업로드하고 지역을 선택하여 새로운 데이터베이스 구조로 저장하세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 지역 선택 */}
        <div>
          <Label className="text-base font-medium">지역 선택</Label>
          <RegionSelector onRegionSelect={setSelectedRegion} />
          {selectedRegion && (
            <p className="text-sm text-muted-foreground mt-2">
              선택된 지역: {selectedRegion.province} {selectedRegion.district} {selectedRegion.dong}
            </p>
          )}
        </div>

        {/* 파일명 입력 */}
        <div>
          <Label htmlFor="sourceFile">원본 파일명</Label>
          <Input
            id="sourceFile"
            value={sourceFile}
            onChange={(e) => setSourceFile(e.target.value)}
            placeholder="예: 20250508_231239-drFfgVZvjqRJGZZZoNHnj7TeL2oHLS.json"
          />
        </div>

        {/* 파일 업로드 */}
        <div>
          <Label className="text-base font-medium">데이터 파일</Label>
          <FileUploader
            onDataLoaded={handleDataLoaded}
            label="JSON 파일 선택"
            helpText={uploadedData ? `${uploadedData.length}개 부동산 로드됨` : "JSON 파일을 업로드하세요"}
            id="hierarchical-uploader"
          />
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button onClick={handleSaveData} disabled={!isReadyToSave || isSaving} size="lg">
            {isSaving ? "저장 중..." : "계층적 구조로 저장"}
          </Button>
        </div>

        {/* 상태 표시 */}
        {uploadedData && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">업로드된 데이터 정보</h4>
            <ul className="text-sm space-y-1">
              <li>• 총 부동산 수: {uploadedData.length}개</li>
              <li>• 리뷰가 있는 부동산: {uploadedData.filter((r) => r.review_info?.review_count > 0).length}개</li>
              <li>
                • 평균 주간 가격:{" "}
                {Math.round(
                  uploadedData.reduce((sum, r) => sum + r.weekly_price, 0) / uploadedData.length,
                ).toLocaleString()}
                원
              </li>
              {(() => {
                const buildingTypes = uploadedData.reduce(
                  (acc, room) => {
                    acc[room.building_type] = (acc[room.building_type] || 0) + 1
                    return acc
                  },
                  {} as Record<string, number>,
                )

                return (
                  <li>
                    • 건물 유형:{" "}
                    {Object.entries(buildingTypes)
                      .map(([type, count]) => `${type} ${count}개`)
                      .join(", ")}
                  </li>
                )
              })()}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
