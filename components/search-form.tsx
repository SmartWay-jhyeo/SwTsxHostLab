"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { districtData } from "@/lib/district-data"

export function SearchForm() {
  const router = useRouter()
  const [searchType, setSearchType] = useState("combo")
  const [city, setCity] = useState("서울특별시")
  const [district, setDistrict] = useState("")
  const [dong, setDong] = useState("")
  const [keyword, setKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 선택된 시/도에 따른 구/군 목록
  const districts = city ? Object.keys(districtData[city] || {}).sort() : []

  // 선택된 구/군에 따른 동/읍/면 목록
  const getDongs = (selectedDistrict: string) => {
    if (!city || !selectedDistrict) return []
    return (districtData[city]?.[selectedDistrict] || []).sort()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let location = ""

      if (searchType === "combo") {
        location = `${city} ${district} ${dong}`.trim()
      } else {
        location = keyword.trim()
      }

      if (!location) {
        alert("검색할 지역을 입력해주세요.")
        setIsLoading(false)
        return
      }

      // 검색 결과 페이지로 이동
      router.push(`/search/results?location=${encodeURIComponent(location)}`)
    } catch (error) {
      console.error("검색 중 오류 발생:", error)
      alert("검색 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>검색 방식</Label>
        <RadioGroup defaultValue="combo" value={searchType} onValueChange={setSearchType} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="combo" id="combo" />
            <Label htmlFor="combo">지역 선택</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="keyword" id="keyword" />
            <Label htmlFor="keyword">키워드 입력</Label>
          </div>
        </RadioGroup>
      </div>

      {searchType === "combo" ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="city">시/도</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger id="city">
                <SelectValue placeholder="시/도 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(districtData).map((cityName) => (
                  <SelectItem key={cityName} value={cityName}>
                    {cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="district">구/군</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger id="district">
                <SelectValue placeholder="구/군 선택" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dong">동/읍/면</Label>
            <Select value={dong} onValueChange={setDong}>
              <SelectTrigger id="dong">
                <SelectValue placeholder="동/읍/면 선택" />
              </SelectTrigger>
              <SelectContent>
                {getDongs(district).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="keyword">검색 키워드</Label>
          <Input
            id="keyword"
            placeholder="지역명 입력 (예: 서울특별시 강남구 역삼동)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "검색 중..." : "검색"}
      </Button>
    </form>
  )
}
