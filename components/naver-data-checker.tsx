"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { Room } from "@/lib/types"

interface NaverDataCheckerProps {
  rooms: Room[]
}

export function NaverDataChecker({ rooms }: NaverDataCheckerProps) {
  const [stats, setStats] = useState({
    total: 0,
    withNaverData: 0,
    percentage: 0,
  })

  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const withNaverData = rooms.filter((room) => room.naver_property_data).length
      setStats({
        total: rooms.length,
        withNaverData,
        percentage: Math.round((withNaverData / rooms.length) * 100),
      })
    }
  }, [rooms])

  const showSampleData = () => {
    const roomWithData = rooms.find((room) => room.naver_property_data)
    if (roomWithData && roomWithData.naver_property_data) {
      console.log("네이버 부동산 데이터 샘플:", roomWithData.naver_property_data)
      alert("네이버 부동산 데이터 샘플이 콘솔에 출력되었습니다.")
    } else {
      alert("네이버 부동산 데이터가 있는 방이 없습니다.")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          네이버 부동산 데이터 확인
          <Badge variant={stats.withNaverData > 0 ? "success" : "destructive"}>
            {stats.withNaverData > 0 ? "데이터 있음" : "데이터 없음"}
          </Badge>
        </CardTitle>
        <CardDescription>분석 데이터에 네이버 부동산 정보가 포함되어 있는지 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted p-2 rounded-md">
              <p className="text-sm text-muted-foreground">총 방 수</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <p className="text-sm text-muted-foreground">네이버 데이터 있음</p>
              <p className="text-xl font-bold">{stats.withNaverData}</p>
            </div>
            <div className="bg-muted p-2 rounded-md">
              <p className="text-sm text-muted-foreground">포함 비율</p>
              <p className="text-xl font-bold">{stats.percentage}%</p>
            </div>
          </div>

          {stats.withNaverData === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>네이버 부동산 데이터가 없습니다</AlertTitle>
              <AlertDescription>
                분석 데이터에 네이버 부동산 정보가 포함되어 있지 않습니다. 데이터 로드 과정에서 누락되었을 수 있습니다.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>네이버 부동산 데이터가 있습니다</AlertTitle>
              <AlertDescription>
                {stats.withNaverData}개의 방에 네이버 부동산 정보가 포함되어 있습니다. 호스트 시뮬레이션에서 활용할 수
                있습니다.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={showSampleData} variant="outline" className="w-full" disabled={stats.withNaverData === 0}>
            네이버 데이터 샘플 확인 (콘솔)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
