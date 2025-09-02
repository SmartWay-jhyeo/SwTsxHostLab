"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertTriangle,
  Loader2,
  CheckCircle,
  Database,
  ArrowRight,
  Settings,
  MapPin,
  CheckSquare,
  Square,
} from "lucide-react"
import { RegionDataPreview } from "./region-data-preview"
import { groupByRegion, classifyDataByExistence, validateParsedAddresses, type RegionGroup } from "@/lib/address-parser"
import { createClient } from "@/lib/supabase/client"
import type { Room } from "@/lib/types"

interface SimplifiedRegionSaveModalProps {
  isOpen: boolean
  onClose: () => void
  rooms: Room[]
  onSaveComplete?: (result: any) => void
}

type Step = "mode-select" | "city-select" | "manual-input" | "address-validation" | "preview" | "saving" | "complete"
type InputMode = "auto" | "manual"

interface ManualRegionData {
  city: string
  district: string
  neighborhood: string
  selectedRooms: Room[]
}

export function SimplifiedRegionSaveModal({ isOpen, onClose, rooms, onSaveComplete }: SimplifiedRegionSaveModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("mode-select")
  const [inputMode, setInputMode] = useState<InputMode>("auto")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [manualRegionData, setManualRegionData] = useState<ManualRegionData>({
    city: "",
    district: "",
    neighborhood: "",
    selectedRooms: [],
  })
  const [regionGroups, setRegionGroups] = useState<RegionGroup[]>([])
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [saveResult, setSaveResult] = useState<any>(null)

  const supabase = createClient()

  // 시/도 목록
  const cities = [
    "서울특별시",
    "부산광역시",
    "대구광역시",
    "인천광역시",
    "광주광역시",
    "대전광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "강원특별자치도",
    "충청북도",
    "충청남도",
    "전라북도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주특별자치도",
  ]

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("mode-select")
      setInputMode("auto")
      setSelectedCity("")
      setManualRegionData({
        city: "",
        district: "",
        neighborhood: "",
        selectedRooms: [],
      })
      setRegionGroups([])
      setValidationResult(null)
      setError("")
      setSaveResult(null)
    }
  }, [isOpen])

  // 입력 모드 선택
  const handleModeSelect = (mode: InputMode) => {
    setInputMode(mode)
    if (mode === "auto") {
      setCurrentStep("city-select")
    } else {
      setCurrentStep("manual-input")
    }
  }

  // 자동 모드: 시/도 선택 후 주소 검증
  const handleCitySelect = async (city: string) => {
    setSelectedCity(city)
    setIsLoading(true)
    setError("")

    try {
      // 1. 주소 파싱 및 검증
      const validation = validateParsedAddresses(rooms)
      setValidationResult(validation)

      // 선택된 시/도와 일치하는 데이터만 필터링 (더 유연한 매칭)
      const cityMatchedRooms = validation.valid.filter((room) => {
        const parsedCity = room.parsedAddress.city
        const originalAddress = room.address || ""

        // 직접 매칭
        if (parsedCity === city) return true

        // 원본 주소에서 시/도 포함 여부 확인
        if (originalAddress.includes(city)) return true

        // 축약형 매칭 (예: "서울" → "서울특별시")
        const cityShort = city.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")
        if (originalAddress.includes(cityShort)) return true

        return false
      })

      if (cityMatchedRooms.length === 0) {
        setError(`${city}에 해당하는 매물이 없습니다. 수동 입력 모드를 사용해보세요.`)
        setIsLoading(false)
        return
      }

      // 2. 지역별 그룹화
      const groups = groupByRegion(cityMatchedRooms, city)

      // 3. 기존 데이터와 비교
      const classifiedGroups = await classifyDataByExistence(groups, supabase)
      setRegionGroups(classifiedGroups)

      setCurrentStep("address-validation")
    } catch (err) {
      setError(`데이터 처리 중 오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 수동 모드: 지역 정보 입력 완료
  const handleManualInputComplete = async () => {
    if (!manualRegionData.city || !manualRegionData.district || !manualRegionData.neighborhood) {
      setError("모든 지역 정보를 입력해주세요.")
      return
    }

    if (manualRegionData.selectedRooms.length === 0) {
      setError("저장할 매물을 선택해주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // 수동 입력 데이터를 RegionGroup 형태로 변환
      const manualGroup: RegionGroup = {
        city: manualRegionData.city,
        district: manualRegionData.district,
        neighborhood: manualRegionData.neighborhood,
        properties: manualRegionData.selectedRooms,
        newCount: 0,
        updateCount: 0,
      }

      // 기존 데이터와 비교
      const classifiedGroups = await classifyDataByExistence([manualGroup], supabase)
      setRegionGroups(classifiedGroups)
      setSelectedCity(manualRegionData.city)

      setCurrentStep("preview")
    } catch (err) {
      setError(`데이터 처리 중 오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 미리보기로 이동
  const handleProceedToPreview = () => {
    setCurrentStep("preview")
  }

  // 데이터 저장 실행
  const handleSaveData = async () => {
    setCurrentStep("saving")
    setIsLoading(true)

    try {
      const response = await fetch("/api/bulk-save-regional-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedCity,
          regionGroups,
          replaceExisting: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "저장에 실패했습니다")
      }

      setSaveResult(result)
      setCurrentStep("complete")
    } catch (err) {
      setError(`저장 중 오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
      setCurrentStep("preview")
    } finally {
      setIsLoading(false)
    }
  }

  // 매물 선택/해제 (수동 모드용)
  const handleRoomToggle = (room: Room, checked: boolean) => {
    setManualRegionData((prev) => ({
      ...prev,
      selectedRooms: checked ? [...prev.selectedRooms, room] : prev.selectedRooms.filter((r) => r.id !== room.id),
    }))
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    const isAllSelected = manualRegionData.selectedRooms.length === rooms.length
    setManualRegionData((prev) => ({
      ...prev,
      selectedRooms: isAllSelected ? [] : [...rooms],
    }))
  }

  // 모달 닫기
  const handleClose = () => {
    if (currentStep !== "saving") {
      // 저장이 완료된 상태에서 닫을 때만 onSaveComplete 콜백 호출
      if (currentStep === "complete" && onSaveComplete && saveResult) {
        onSaveComplete(saveResult)
      }
      onClose()
    }
  }

  // 전체 선택 상태 확인
  const isAllSelected = manualRegionData.selectedRooms.length === rooms.length
  const isPartiallySelected =
    manualRegionData.selectedRooms.length > 0 && manualRegionData.selectedRooms.length < rooms.length

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            지역 데이터 저장
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 진행 단계 표시 */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Badge variant={currentStep === "mode-select" ? "default" : "secondary"}>1. 모드 선택</Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant={currentStep === "city-select" || currentStep === "manual-input" ? "default" : "secondary"}>
              2. 지역 설정
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge
              variant={currentStep === "address-validation" || currentStep === "preview" ? "default" : "secondary"}
            >
              3. 확인
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant={currentStep === "saving" || currentStep === "complete" ? "default" : "secondary"}>
              4. 저장
            </Badge>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes("해당하는 매물이 없습니다") && (
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-2 text-destructive underline"
                    onClick={() => {
                      setError("")
                      setInputMode("manual")
                      setCurrentStep("manual-input")
                    }}
                  >
                    수동 입력 모드로 전환
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 1단계: 입력 모드 선택 */}
          {currentStep === "mode-select" && (
            <Card>
              <CardHeader>
                <CardTitle>입력 방식 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  업로드된 {rooms.length}개 매물을 어떤 방식으로 지역별로 분류하시겠습니까?
                </div>

                <RadioGroup value={inputMode} onValueChange={(value: InputMode) => setInputMode(value)}>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="auto" id="auto" className="mt-1" />
                      <div className="space-y-2">
                        <Label htmlFor="auto" className="flex items-center gap-2 font-medium">
                          <Settings className="w-4 h-4" />
                          자동 매칭 (권장)
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          매물 주소를 자동으로 분석하여 지역별로 분류합니다.
                          <br />
                          빠르고 정확하지만, 주소 형식이 표준과 다를 경우 매칭이 실패할 수 있습니다.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="manual" id="manual" className="mt-1" />
                      <div className="space-y-2">
                        <Label htmlFor="manual" className="flex items-center gap-2 font-medium">
                          <MapPin className="w-4 h-4" />
                          수동 입력
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          지역 정보를 직접 입력하고 매물을 선택하여 분류합니다.
                          <br />
                          자동 매칭이 실패하거나 특별한 분류가 필요한 경우 사용하세요.
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex justify-end">
                  <Button onClick={() => handleModeSelect(inputMode)}>
                    다음 단계로
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2단계: 자동 모드 - 시/도 선택 */}
          {currentStep === "city-select" && (
            <Card>
              <CardHeader>
                <CardTitle>저장할 지역 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  업로드된 {rooms.length}개 매물의 주소를 분석하여 자동으로 지역별로 분류합니다.
                </div>

                <Select value={selectedCity} onValueChange={handleCitySelect} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="시/도를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    주소 데이터를 분석하고 있습니다...
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("mode-select")}>
                    이전
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2단계: 수동 모드 - 지역 정보 입력 */}
          {currentStep === "manual-input" && (
            <Card>
              <CardHeader>
                <CardTitle>지역 정보 입력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-city">시/도</Label>
                    <Select
                      value={manualRegionData.city}
                      onValueChange={(value) => setManualRegionData((prev) => ({ ...prev, city: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="시/도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-district">구/군</Label>
                    <Input
                      id="manual-district"
                      value={manualRegionData.district}
                      onChange={(e) => setManualRegionData((prev) => ({ ...prev, district: e.target.value }))}
                      placeholder="예: 중구, 강남구"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-neighborhood">동/읍/면</Label>
                    <Input
                      id="manual-neighborhood"
                      value={manualRegionData.neighborhood}
                      onChange={(e) => setManualRegionData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="예: 회현동, 역삼동"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">저장할 매물 선택</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {isAllSelected ? "전체 해제" : "전체 선택"}
                      </Button>
                      <Badge variant="secondary">
                        {manualRegionData.selectedRooms.length} / {rooms.length} 선택됨
                      </Badge>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {rooms.map((room, index) => (
                      <div key={room.id || index} className="flex items-center space-x-3 p-3 border-b last:border-b-0">
                        <input
                          type="checkbox"
                          checked={manualRegionData.selectedRooms.some((r) => r.id === room.id)}
                          onChange={(e) => handleRoomToggle(room, e.target.checked)}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{room.title || `매물 ${index + 1}`}</div>
                          <div className="text-xs text-muted-foreground truncate">{room.address}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {room.price ? `${room.price.toLocaleString()}원` : "가격 미정"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("mode-select")}>
                    이전
                  </Button>
                  <Button onClick={handleManualInputComplete} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        다음 단계로
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3단계: 주소 검증 결과 (자동 모드) */}
          {currentStep === "address-validation" && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle>주소 분석 결과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{validationResult.summary.total}</div>
                    <div className="text-sm text-blue-600">총 매물</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {regionGroups.reduce((sum, group) => sum + group.properties.length, 0)}
                    </div>
                    <div className="text-sm text-green-600">{selectedCity} 매물</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{regionGroups.length}</div>
                    <div className="text-sm text-purple-600">개 지역</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="font-medium">발견된 지역:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {regionGroups.map((group, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {group.district} {group.neighborhood}
                        </span>
                        <Badge variant="secondary">{group.properties.length}개</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("city-select")}>
                    이전
                  </Button>
                  <Button onClick={handleProceedToPreview}>
                    미리보기로 계속
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3단계: 미리보기 */}
          {currentStep === "preview" && (
            <RegionDataPreview
              regionGroups={regionGroups}
              selectedCity={selectedCity}
              onConfirm={handleSaveData}
              onCancel={() => setCurrentStep(inputMode === "auto" ? "address-validation" : "manual-input")}
              isLoading={isLoading}
            />
          )}

          {/* 4단계: 저장 중 */}
          {currentStep === "saving" && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                  <div className="text-lg font-medium">데이터를 저장하고 있습니다...</div>
                  <div className="text-sm text-muted-foreground">
                    잠시만 기다려주세요. 이 과정은 몇 분이 소요될 수 있습니다.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5단계: 완료 */}
          {currentStep === "complete" && saveResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  저장 완료
                </CardTitle>
                <p className="text-sm text-muted-foreground">{saveResult.message}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">
                      {saveResult.total_processed || 0} / {saveResult.total_received || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">개 매물 처리됨</div>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Number(saveResult.processing_time_seconds || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">초 소요</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">처리 상세 내역</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">신규 저장:</span>
                      <span className="font-mono">{saveResult.new_properties || 0}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">정보 업데이트:</span>
                      <span className="font-mono">{saveResult.updated_properties || 0}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">위치 이전:</span>
                      <span className="font-mono">{saveResult.moved_properties || 0}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">처리 실패:</span>
                      <span className="font-mono text-destructive">{saveResult.failed_properties || 0}개</span>
                    </div>
                  </div>
                </div>

                {saveResult.processing_results && saveResult.processing_results.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">지역별 처리 결과</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                      {saveResult.processing_results.map((res, index) => (
                        <div key={index} className="text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{res.region}</span>
                            {res.success ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                성공
                              </Badge>
                            ) : (
                              <Badge variant="destructive">실패</Badge>
                            )}
                          </div>
                          {res.success ? (
                            <div className="text-muted-foreground pl-2">
                              신규 {res.newCount}, 업데이트 {res.updateCount}, 이전 {res.moveCount}
                            </div>
                          ) : (
                            <div className="text-destructive pl-2 truncate">오류: {res.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={handleClose}>확인</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
