"use client"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface AdminRegionSelectorProps {
  onRegionSelect?: (province: string, district: string, dong: string) => void
}

export function AdminRegionSelector({ onRegionSelect }: AdminRegionSelectorProps) {
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<{ display: string; original: string }[]>([])
  const [dongs, setDongs] = useState<{ display: string; original: string }[]>([])

  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedDong, setSelectedDong] = useState("")

  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    dongs: false,
  })

  const { toast } = useToast()

  // 시/도 목록 로드
  useEffect(() => {
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    setLoading((prev) => ({ ...prev, provinces: true }))
    try {
      const response = await fetch("/api/save-region?level=provinces")
      const result = await response.json()

      if (result.success) {
        setProvinces(result.data)
      } else {
        toast({
          title: "오류",
          description: "시/도 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "시/도 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, provinces: false }))
    }
  }

  // 시/군/구 목록 로드
  const loadDistricts = async (province: string) => {
    setLoading((prev) => ({ ...prev, districts: true }))
    try {
      const response = await fetch(`/api/save-region?level=districts&province=${encodeURIComponent(province)}`)
      const result = await response.json()

      if (result.success) {
        // 시/도명을 제거하고 시/군/구만 표시
        const districtData = result.data.map((district: string) => {
          // "부산광역시 남구" -> "남구"
          const display = district.replace(province + " ", "").trim()
          return {
            original: district,
            display: display,
          }
        })
        setDistricts(districtData)
        setDongs([])
        setSelectedDistrict("")
        setSelectedDong("")
      } else {
        toast({
          title: "오류",
          description: "시/군/구 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "시/군/구 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, districts: false }))
    }
  }

  // 읍/면/동 목록 로드
  const loadDongs = async (province: string, district: string) => {
    setLoading((prev) => ({ ...prev, dongs: true }))
    try {
      // district는 display 값이므로 original 값을 찾아야 함
      const districtData = districts.find((d) => d.display === district)
      if (!districtData) return

      const response = await fetch(
        `/api/save-region?level=dongs&province=${encodeURIComponent(province)}&district=${encodeURIComponent(districtData.original)}`,
      )
      const result = await response.json()

      if (result.success) {
        // 시/도명과 시/군/구명을 제거하고 읍/면/동만 표시
        const dongData = result.data.map((dong: string) => {
          // "부산광역시 남구 용당동" -> "용당동"
          let display = dong
          display = display.replace(province + " ", "")
          display = display.replace(districtData.original.replace(province + " ", "") + " ", "")

          // 혹시 남은 공백이나 중복 제거
          const parts = display.trim().split(" ")
          const cleanDisplay = parts[parts.length - 1]

          return {
            original: dong,
            display: cleanDisplay,
          }
        })
        setDongs(dongData)
        setSelectedDong("")
      } else {
        toast({
          title: "오류",
          description: "읍/면/동 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "읍/면/동 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, dongs: false }))
    }
  }

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province)
    setSelectedDistrict("")
    setSelectedDong("")
    loadDistricts(province)
  }

  const handleDistrictChange = (districtDisplay: string) => {
    setSelectedDistrict(districtDisplay)
    setSelectedDong("")
    loadDongs(selectedProvince, districtDisplay)
  }

  const handleDongChange = (dongDisplay: string) => {
    setSelectedDong(dongDisplay)
    if (onRegionSelect) {
      // 표시용 값들을 그대로 전달
      onRegionSelect(selectedProvince, selectedDistrict, dongDisplay)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>지역 선택 (행정안전부 기준)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 시/도 선택 */}
          <div className="space-y-2">
            <Label htmlFor="province">시/도</Label>
            <Select value={selectedProvince} onValueChange={handleProvinceChange} disabled={loading.provinces}>
              <SelectTrigger id="province">
                <SelectValue placeholder={loading.provinces ? "로딩 중..." : "시/도 선택"} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <div className="max-h-[200px] overflow-y-auto">
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </div>
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
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <div className="max-h-[200px] overflow-y-auto">
                  {districts.map((district) => (
                    <SelectItem key={district.display} value={district.display}>
                      {district.display}
                    </SelectItem>
                  ))}
                </div>
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
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <div className="max-h-[200px] overflow-y-auto">
                  {dongs.map((dong) => (
                    <SelectItem key={dong.display} value={dong.display}>
                      {dong.display}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 선택된 지역 표시 */}
        {selectedProvince && selectedDistrict && selectedDong && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>선택된 지역:</strong> {selectedProvince} {selectedDistrict} {selectedDong}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
