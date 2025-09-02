"use client"
import type { Room } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PdfExportButton } from "@/components/pdf-export-button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
} from "recharts"

export function CompareAreaAnalysis({ area1Data, area2Data }: { area1Data: Room[]; area2Data: Room[] }) {
  const compareAreaResultsId = "compare-area-results"

  // 지역 이름 추출 (첫 번째 매물의 주소에서 구 이름 추출)
  const area1Name = area1Data.length > 0 ? extractAreaName(area1Data[0].address) : "지역 1"
  const area2Name = area2Data.length > 0 ? extractAreaName(area2Data[0].address) : "지역 2"

  // 기본 통계 계산
  const area1Count = area1Data.length
  const area2Count = area2Data.length

  // 평균 가격 계산
  const avgPriceArea1 = area1Data.reduce((sum, room) => sum + room.weekly_price, 0) / area1Count
  const avgPriceArea2 = area2Data.reduce((sum, room) => sum + room.weekly_price, 0) / area2Count

  // 평균 예약률 계산
  const avgOccupancyArea1 = area1Data.reduce((sum, room) => sum + room.occupancy_rate, 0) / area1Count
  const avgOccupancyArea2 = area2Data.reduce((sum, room) => sum + room.occupancy_rate, 0) / area2Count

  // 건물유형 분포 계산
  const buildingTypesArea1 = getBuildingTypeDistribution(area1Data)
  const buildingTypesArea2 = getBuildingTypeDistribution(area2Data)

  // 가격 분포 데이터
  const priceDistributionData = getPriceDistributionData(area1Data, area2Data, area1Name, area2Name)

  // 예약률 분포 데이터
  const occupancyDistributionData = getOccupancyDistributionData(area1Data, area2Data, area1Name, area2Name)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">지역 비교 분석 결과</h2>
        <PdfExportButton contentId={compareAreaResultsId} fileName={`${area1Name}_${area2Name}_비교분석`} />
      </div>

      <div id={compareAreaResultsId} className="space-y-6 bg-white p-6 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>매물 수 비교</CardTitle>
              <CardDescription>지역별 매물 수 비교</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: area1Name, value: area1Count },
                      { name: area2Name, value: area2Count },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}개`, "매물 수"]} />
                    <Bar dataKey="value" fill="#8884d8">
                      <Cell fill="#8884d8" />
                      <Cell fill="#82ca9d" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>평균 가격 비교</CardTitle>
              <CardDescription>주간 렌트비 평균 비교</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: area1Name, value: avgPriceArea1 },
                      { name: area2Name, value: avgPriceArea2 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value.toLocaleString()}원`} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`, "평균 렌트비"]} />
                    <Bar dataKey="value" fill="#82ca9d">
                      <Cell fill="#8884d8" />
                      <Cell fill="#82ca9d" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>평균 예약률 비교</CardTitle>
              <CardDescription>예약률 평균 비교</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: area1Name, value: avgOccupancyArea1 },
                      { name: area2Name, value: avgOccupancyArea2 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "평균 예약률"]} />
                    <Bar dataKey="value" fill="#8884d8">
                      <Cell fill="#8884d8" />
                      <Cell fill="#82ca9d" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>건물유형 분포 비교</CardTitle>
            <CardDescription>지역별 건물유형 분포 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.keys({ ...buildingTypesArea1, ...buildingTypesArea2 }).map((type) => ({
                    name: type,
                    [area1Name]: buildingTypesArea1[type] || 0,
                    [area2Name]: buildingTypesArea2[type] || 0,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}개`, ""]} />
                  <Legend />
                  <Bar dataKey={area1Name} fill="#8884d8" />
                  <Bar dataKey={area2Name} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>가격 분포 비교</CardTitle>
            <CardDescription>주간 렌트비 분포 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}개`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey={area1Name} stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey={area2Name} stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-2">가격 비교 분석</h4>
              <p className="text-sm text-muted-foreground">
                {getPriceComparisonAnalysis(area1Data, area2Data, area1Name, area2Name)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예약률 분포 비교</CardTitle>
            <CardDescription>예약률 분포 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}개`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey={area1Name} stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey={area2Name} stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-2">예약률 비교 분석</h4>
              <p className="text-sm text-muted-foreground">
                {getOccupancyComparisonAnalysis(area1Data, area2Data, area1Name, area2Name)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 주소에서 지역명 추출 (구 단위)
function extractAreaName(address: string): string {
  const match = address.match(/([가-힣]+시\s[가-힣]+구|[가-힣]+구)/)
  return match ? match[0] : "지역"
}

// 건물유형 분포 계산 함수
function getBuildingTypeDistribution(rooms: Room[]): Record<string, number> {
  const typeCount: Record<string, number> = {}

  rooms.forEach((room) => {
    const type = room.building_type
    typeCount[type] = (typeCount[type] || 0) + 1
  })

  return typeCount
}

// 가격 분포 데이터 생성 함수
function getPriceDistributionData(area1Data: Room[], area2Data: Room[], area1Name: string, area2Name: string): any[] {
  // 가격 범위 설정 (10만원 단위)
  const priceRanges = [
    "~20만원",
    "20~30만원",
    "30~40만원",
    "40~50만원",
    "50~60만원",
    "60~70만원",
    "70~80만원",
    "80만원~",
  ]

  // 각 범위별 매물 수 계산
  const area1Counts = new Array(priceRanges.length).fill(0)
  const area2Counts = new Array(priceRanges.length).fill(0)

  area1Data.forEach((room) => {
    const price = room.weekly_price
    if (price < 200000) area1Counts[0]++
    else if (price < 300000) area1Counts[1]++
    else if (price < 400000) area1Counts[2]++
    else if (price < 500000) area1Counts[3]++
    else if (price < 600000) area1Counts[4]++
    else if (price < 700000) area1Counts[5]++
    else if (price < 800000) area1Counts[6]++
    else area1Counts[7]++
  })

  area2Data.forEach((room) => {
    const price = room.weekly_price
    if (price < 200000) area2Counts[0]++
    else if (price < 300000) area2Counts[1]++
    else if (price < 400000) area2Counts[2]++
    else if (price < 500000) area2Counts[3]++
    else if (price < 600000) area2Counts[4]++
    else if (price < 700000) area2Counts[5]++
    else if (price < 800000) area2Counts[6]++
    else area2Counts[7]++
  })

  // 데이터 포맷 생성
  return priceRanges.map((range, index) => ({
    range,
    [area1Name]: area1Counts[index],
    [area2Name]: area2Counts[index],
  }))
}

// 예약률 분포 데이터 생성 함수
function getOccupancyDistributionData(
  area1Data: Room[],
  area2Data: Room[],
  area1Name: string,
  area2Name: string,
): any[] {
  // 예약률 범위 설정 (20% 단위)
  const occupancyRanges = ["0~20%", "20~40%", "40~60%", "60~80%", "80~100%"]

  // 각 범위별 매물 수 계산
  const area1Counts = new Array(occupancyRanges.length).fill(0)
  const area2Counts = new Array(occupancyRanges.length).fill(0)

  area1Data.forEach((room) => {
    const occupancy = room.occupancy_rate
    if (occupancy < 20) area1Counts[0]++
    else if (occupancy < 40) area1Counts[1]++
    else if (occupancy < 60) area1Counts[2]++
    else if (occupancy < 80) area1Counts[3]++
    else area1Counts[4]++
  })

  area2Data.forEach((room) => {
    const occupancy = room.occupancy_rate
    if (occupancy < 20) area2Counts[0]++
    else if (occupancy < 40) area2Counts[1]++
    else if (occupancy < 60) area2Counts[2]++
    else if (occupancy < 80) area2Counts[3]++
    else area2Counts[4]++
  })

  // 데이터 포맷 생성
  return occupancyRanges.map((range, index) => ({
    range,
    [area1Name]: area1Counts[index],
    [area2Name]: area2Counts[index],
  }))
}

// 가격 비교 분석 텍스트 생성 함수
function getPriceComparisonAnalysis(
  area1Data: Room[],
  area2Data: Room[],
  area1Name: string,
  area2Name: string,
): string {
  const avgPriceArea1 = area1Data.reduce((sum, room) => sum + room.weekly_price, 0) / area1Data.length
  const avgPriceArea2 = area2Data.reduce((sum, room) => sum + room.weekly_price, 0) / area2Data.length
  const priceDiff = avgPriceArea1 - avgPriceArea2
  const priceDiffPercent = (priceDiff / avgPriceArea2) * 100

  if (priceDiff > 0) {
    return `${area1Name}의 평균 주간 렌트비는 ${avgPriceArea1.toLocaleString()}원으로, ${area2Name}의 ${avgPriceArea2.toLocaleString()}원보다 ${Math.abs(priceDiff).toLocaleString()}원(${Math.abs(priceDiffPercent).toFixed(1)}%) 높습니다. 이는 ${area1Name}의 위치적 특성과 수요가 더 높기 때문으로 분석됩니다.`
  } else if (priceDiff < 0) {
    return `${area1Name}의 평균 주간 렌트비는 ${avgPriceArea1.toLocaleString()}원으로, ${area2Name}의 ${avgPriceArea2.toLocaleString()}원보다 ${Math.abs(priceDiff).toLocaleString()}원(${Math.abs(priceDiffPercent).toFixed(1)}%) 낮습니다. 이는 ${area2Name}의 위치적 특성과 수요가 더 높기 때문으로 분석됩니다.`
  } else {
    return `${area1Name}와 ${area2Name}의 평균 주간 렌트비는 ${avgPriceArea1.toLocaleString()}원으로 동일합니다. 두 지역의 수요와 공급이 비슷한 수준으로 유지되고 있는 것으로 분석됩니다.`
  }
}

// 예약률 비교 분석 텍스트 생성 함수
function getOccupancyComparisonAnalysis(
  area1Data: Room[],
  area2Data: Room[],
  area1Name: string,
  area2Name: string,
): string {
  const avgOccupancyArea1 = area1Data.reduce((sum, room) => sum + room.occupancy_rate, 0) / area1Data.length
  const avgOccupancyArea2 = area2Data.reduce((sum, room) => sum + room.occupancy_rate, 0) / area2Data.length
  const occupancyDiff = avgOccupancyArea1 - avgOccupancyArea2

  if (occupancyDiff > 0) {
    return `${area1Name}의 평균 예약률은 ${avgOccupancyArea1.toFixed(1)}%로, ${area2Name}의 ${avgOccupancyArea2.toFixed(1)}%보다 ${Math.abs(occupancyDiff).toFixed(1)}% 높습니다. 이는 ${area1Name}의 인기도와 수요가 더 높다는 것을 의미합니다.`
  } else if (occupancyDiff < 0) {
    return `${area1Name}의 평균 예약률은 ${avgOccupancyArea1.toFixed(1)}%로, ${area2Name}의 ${avgOccupancyArea2.toFixed(1)}%보다 ${Math.abs(occupancyDiff).toFixed(1)}% 낮습니다. 이는 ${area2Name}의 인기도와 수요가 더 높다는 것을 의미합니다.`
  } else {
    return `${area1Name}와 ${area2Name}의 평균 예약률은 ${avgOccupancyArea1.toFixed(1)}%로 동일합니다. 두 지역의 인기도와 수요가 비슷한 수준으로 유지되고 있는 것으로 분석됩니다.`
  }
}
