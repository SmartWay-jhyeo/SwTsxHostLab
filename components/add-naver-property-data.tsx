"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Room } from "@/lib/types"

interface AddNaverPropertyDataProps {
  room: Room
  onUpdate?: (updatedRoom: Room) => void
}

export function AddNaverPropertyData({ room, onUpdate }: AddNaverPropertyDataProps) {
  const [propertyId, setPropertyId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleFetchData = async () => {
    if (!propertyId) {
      setError("네이버 부동산 ID를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // 네이버 부동산 데이터 가져오기
      const response = await fetch(`/api/naver-property?propertyId=${propertyId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "네이버 부동산 데이터를 가져오는데 실패했습니다.")
      }

      const { data: propertyData } = await response.json()

      if (!propertyData) {
        throw new Error("네이버 부동산 데이터를 가져오는데 실패했습니다.")
      }

      // 방 데이터 업데이트
      if (onUpdate) {
        const updatedRoom = {
          ...room,
          naver_property_data: propertyData,
        }
        onUpdate(updatedRoom)

        // 서버에 업데이트 요청
        const updateResponse = await fetch("/api/naver-property", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId: room.id,
            propertyData,
          }),
        })

        if (!updateResponse.ok) {
          const updateErrorData = await updateResponse.json()
          console.error("서버 업데이트 실패:", updateErrorData.error)
          // 사용자에게는 성공 메시지를 보여주고 백그라운드에서만 오류 로깅
        }
      }

      toast({
        title: "네이버 부동산 데이터 추가 성공",
        description: "네이버 부동산 데이터가 성공적으로 추가되었습니다.",
      })
    } catch (error: any) {
      console.error("네이버 부동산 데이터 가져오기 오류:", error)
      setError(error.message || "네이버 부동산 데이터를 가져오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const extractPropertyIdFromUrl = () => {
    try {
      const input = propertyId.trim()

      // 이미 숫자만 입력된 경우
      if (/^\d+$/.test(input)) {
        return
      }

      // URL에서 ID 추출 시도
      const match = input.match(/complexes\/(\d+)/)
      if (match && match[1]) {
        setPropertyId(match[1])
      } else {
        setError("URL에서 네이버 부동산 ID를 추출할 수 없습니다.")
      }
    } catch (error) {
      console.error("URL 파싱 오류:", error)
      setError("URL 파싱 중 오류가 발생했습니다.")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">네이버 부동산 데이터 추가</CardTitle>
        <CardDescription>네이버 부동산 ID 또는 URL을 입력하여 부동산 시세 정보를 가져옵니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="property-id">네이버 부동산 ID 또는 URL</Label>
            <div className="flex gap-2">
              <Input
                id="property-id"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                placeholder="예: 127099 또는 https://new.land.naver.com/complexes/127099"
                disabled={isLoading}
              />
              <Button variant="outline" onClick={extractPropertyIdFromUrl} disabled={isLoading}>
                URL 변환
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              네이버 부동산 URL에서 complexes/ 뒤에 오는 숫자를 입력하거나 전체 URL을 붙여넣으세요.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleFetchData} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              데이터 가져오는 중...
            </>
          ) : (
            "데이터 가져오기"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
