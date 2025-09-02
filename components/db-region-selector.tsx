"use client"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface DbRegionSelectorProps {
  onRegionSelect?: (province: string, district: string, dong: string) => void
}

export function DbRegionSelector({ onRegionSelect }: DbRegionSelectorProps) {
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

  // 시/도 목록 로드
  useEffect(() => {
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    setLoading((prev) => ({ ...prev, provinces: true }))
    try {
      const response = await fetch("/api/db-regions?level=provinces")
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
      const response = await fetch(`/api/db-regions?level=districts&province=${encodeURIComponent(province)}`)
      const result = await response.json()

      if (result.success) {
        setDistricts(result.data)
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
      const response = await fetch(
        `/api/db-regions?level=dongs&province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}`,
      )
      const result = await response.json()

      if (result.success) {
        setDongs(result.data)
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
    loadDistricts(province)
  }

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    loadDongs(selectedProvince, district)
  }

  const handleDongChange = (dong: string) => {
    setSelectedDong(dong)
    if (onRegionSelect) {
      onRegionSelect(selectedProvince, selectedDistrict, dong)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>지역 선택 (데이터베이스 기준)</CardTitle>
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
                    <SelectItem key={district} value={district}>
                      {district}
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
                    <SelectItem key={dong} value={dong}>
                      {dong}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
