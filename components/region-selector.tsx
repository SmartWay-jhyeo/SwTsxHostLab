"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface RegionSelectorProps {
  onRegionSelect?: (province: string, district: string, dong: string) => void
}

// 클라이언트 사이드 캐시
const clientCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10분

function getCachedData(key: string) {
  const cached = clientCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedData(key: string, data: any) {
  clientCache.set(key, { data, timestamp: Date.now() })
}

export function RegionSelector({ onRegionSelect }: RegionSelectorProps) {
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [dongs, setDongs] = useState<string[]>([])

  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedDong, setSelectedDong] = useState("")

  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    dongs: false,
  })

  const { toast } = useToast()

  // 에러 처리 최적화
  const handleError = useCallback(
    (message: string, error?: any) => {
      console.error(message, error)
      toast({
        title: "오류",
        description: message,
        variant: "destructive",
      })
    },
    [toast],
  )

  // API 호출 최적화
  const fetchData = useCallback(async (url: string, cacheKey: string) => {
    // 캐시 확인
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log(`✅ 캐시에서 데이터 반환: ${cacheKey}`)
      return { success: true, data: cachedData }
    }

    try {
      console.log(`🔄 API 호출: ${url}`)
      const startTime = Date.now()

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      const endTime = Date.now()

      console.log(`⏱️ API 응답 시간: ${endTime - startTime}ms`)

      if (result.success) {
        setCachedData(cacheKey, result.data)
      }

      return result
    } catch (error) {
      console.error("API 호출 오류:", error)
      return { success: false, error: "네트워크 오류가 발생했습니다." }
    }
  }, [])

  // 시/도 목록 로드
  const loadProvinces = useCallback(async () => {
    setLoading((prev) => ({ ...prev, provinces: true }))

    const result = await fetchData("/api/regions?level=provinces", "provinces")

    if (result.success) {
      setProvinces(result.data)
      console.log(`✅ 시/도 ${result.data.length}개 로드 완료`)
    } else {
      handleError("시/도 목록을 불러오는데 실패했습니다.")
    }

    setLoading((prev) => ({ ...prev, provinces: false }))
  }, [fetchData, handleError])

  // 시/군/구 목록 로드
  const loadDistricts = useCallback(
    async (province: string) => {
      setLoading((prev) => ({ ...prev, districts: true }))

      const cacheKey = `districts_${province}`
      const result = await fetchData(`/api/regions?level=districts&province=${encodeURIComponent(province)}`, cacheKey)

      if (result.success) {
        // 간단한 처리 - 복잡한 변환 제거
        setDistricts(result.data)
        setDongs([])
        setSelectedDistrict("")
        setSelectedDong("")
        console.log(`✅ ${province} 시/군/구 ${result.data.length}개 로드 완료`)
      } else {
        handleError("시/군/구 목록을 불러오는데 실패했습니다.")
      }

      setLoading((prev) => ({ ...prev, districts: false }))
    },
    [fetchData, handleError],
  )

  // 읍/면/동 목록 로드
  const loadDongs = useCallback(
    async (province: string, district: string) => {
      setLoading((prev) => ({ ...prev, dongs: true }))

      const cacheKey = `dongs_${province}_${district}`
      const result = await fetchData(
        `/api/regions?level=dongs&province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}`,
        cacheKey,
      )

      if (result.success) {
        setDongs(result.data)
        setSelectedDong("")
        console.log(`✅ ${province} ${district} 읍/면/동 ${result.data.length}개 로드 완료`)
      } else {
        handleError("읍/면/동 목록을 불러오는데 실패했습니다.")
      }

      setLoading((prev) => ({ ...prev, dongs: false }))
    },
    [fetchData, handleError],
  )

  // 초기 로드
  useEffect(() => {
    loadProvinces()
  }, [loadProvinces])

  // 이벤트 핸들러들
  const handleProvinceChange = useCallback(
    (province: string) => {
      console.log(`🏙️ 시/도 선택: ${province}`)
      setSelectedProvince(province)
      loadDistricts(province)
    },
    [loadDistricts],
  )

  const handleDistrictChange = useCallback(
    (district: string) => {
      console.log(`🏘️ 시/군/구 선택: ${district}`)
      setSelectedDistrict(district)
      loadDongs(selectedProvince, district)
    },
    [selectedProvince, loadDongs],
  )

  const handleDongChange = useCallback(
    (dong: string) => {
      console.log(`🏠 읍/면/동 선택: ${dong}`)
      setSelectedDong(dong)
      if (onRegionSelect) {
        onRegionSelect(selectedProvince, selectedDistrict, dong)
      }
    },
    [onRegionSelect, selectedProvince, selectedDistrict],
  )

  // 메모이제이션된 옵션들
  const provinceOptions = useMemo(
    () =>
      provinces.map((province) => (
        <SelectItem key={province} value={province}>
          {province}
        </SelectItem>
      )),
    [provinces],
  )

  const districtOptions = useMemo(
    () =>
      districts.map((district) => (
        <SelectItem key={district} value={district}>
          {district}
        </SelectItem>
      )),
    [districts],
  )

  const dongOptions = useMemo(
    () =>
      dongs.map((dong) => (
        <SelectItem key={dong} value={dong}>
          {dong}
        </SelectItem>
      )),
    [dongs],
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>지역 선택</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 시/도 선택 */}
          <div className="space-y-2">
            <Label htmlFor="province">시/도</Label>
            <Select value={selectedProvince} onValueChange={handleProvinceChange} disabled={loading.provinces}>
              <SelectTrigger id="province">
                <SelectValue placeholder={loading.provinces ? "로딩 중..." : "시/도 선택"} />
                {loading.provinces && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <div className="max-h-[200px] overflow-y-auto">{provinceOptions}</div>
              </SelectContent>
            </Select>
          </div>

          {/* 시/군/구 선택 */}
          <div className="space-y-2">
            <Label htmlFor="district">시/군/구</Label>
            <Select
              value={selectedDistrict}
              onValueChange={handleDistrictChange}
              disabled={!selectedProvince || loading.districts}
            >
              <SelectTrigger id="district">
                <SelectValue
                  placeholder={
                    !selectedProvince ? "시/도를 먼저 선택하세요" : loading.districts ? "로딩 중..." : "시/군/구 선택"
                  }
                />
                {loading.districts && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <div className="max-h-[200px] overflow-y-auto">{districtOptions}</div>
              </SelectContent>
            </Select>
          </div>

          {/* 읍/면/동 선택 */}
          <div className="space-y-2">
            <Label htmlFor="dong">읍/면/동</Label>
            <Select value={selectedDong} onValueChange={handleDongChange} disabled={!selectedDistrict || loading.dongs}>
              <SelectTrigger id="dong">
                <SelectValue
                  placeholder={
                    !selectedDistrict ? "시/군/구를 먼저 선택하세요" : loading.dongs ? "로딩 중..." : "읍/면/동 선택"
                  }
                />
                {loading.dongs && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <div className="max-h-[200px] overflow-y-auto">{dongOptions}</div>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
