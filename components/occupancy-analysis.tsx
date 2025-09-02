"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Room } from "@/lib/types"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts"

export function OccupancyAnalysis({ rooms, periodMonths = 1 }: { rooms: Room[]; periodMonths?: number }) {
  // periodMonths에 기본값 1을 설정하고, 안전하게 문자열로 변환
  const [selectedPeriod, setSelectedPeriod] = useState(periodMonths ? periodMonths.toString() : "1")

  // 선택된 기간에 따른 예약률 데이터 가져오기
  const getOccupancyRate = (room: Room) => {
    if (!room) return 0

    if (selectedPeriod === "2") return room.occupancy_2rate || 0
    if (selectedPeriod === "3") return room.occupancy_3rate || 0
    return room.occupancy_rate || 0
  }

  // 가격대별 예약률 데이터
  const priceOccupancyData = rooms.map((room) => ({
    price: room.weekly_price || 0,
    occupancy: getOccupancyRate(room),
    name: room.name || "이름 없음",
  }))

  // 평형대별 예약률 데이터
  const sizeOccupancyData = rooms.map((room) => ({
    size: room.size_pyeong || 0,
    occupancy: getOccupancyRate(room),
    name: room.name || "이름 없음",
  }))

  // 건물유형별 평균 예약률 데이터
  const buildingTypeData = getBuildingTypeOccupancy(rooms, Number.parseInt(selectedPeriod) || 1)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="예약률 기간" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1개월 예약률</SelectItem>
            <SelectItem value="2">2개월 예약률</SelectItem>
            <SelectItem value="3">3개월 예약률</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="price">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="price">가격대별 예약률</TabsTrigger>
          <TabsTrigger value="size">평형대별 예약률</TabsTrigger>
          <TabsTrigger value="building">건물유형별 예약률</TabsTrigger>
        </TabsList>

        <TabsContent value="price" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>가격대별 예약률 분포</CardTitle>
              <CardDescription>주간 렌트비와 예약률의 상관관계를 확인할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="price"
                      name="주간 렌트비"
                      unit="원"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis type="number" dataKey="occupancy" name="예약률" unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "occupancy" ? `${value}%` : `${Number(value).toLocaleString()}원`,
                        name === "occupancy" ? "예약률" : "주간 렌트비",
                      ]}
                      labelFormatter={(label) => ""}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded p-2 shadow-sm">
                              <p className="font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm">주간 렌트비: {payload[0].payload.price.toLocaleString()}원</p>
                              <p className="text-sm">예약률: {payload[0].payload.occupancy}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Scatter name="예약률" data={priceOccupancyData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">분석 결과</h4>
                <p className="text-sm text-muted-foreground">{getPriceAnalysisText(priceOccupancyData)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="size" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>평형대별 예약률 분포</CardTitle>
              <CardDescription>평형과 예약률의 상관관계를 확인할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="size" name="평형" unit="평" />
                    <YAxis type="number" dataKey="occupancy" name="예약률" unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "occupancy" ? `${value}%` : `${value}평`,
                        name === "occupancy" ? "예약률" : "평형",
                      ]}
                      labelFormatter={(label) => ""}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded p-2 shadow-sm">
                              <p className="font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm">평형: {payload[0].payload.size}평</p>
                              <p className="text-sm">예약률: {payload[0].payload.occupancy}%</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Scatter name="예약률" data={sizeOccupancyData} fill="#82ca9d" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">분석 결과</h4>
                <p className="text-sm text-muted-foreground">{getSizeAnalysisText(sizeOccupancyData)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="building" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>건물유형별 평균 예약률</CardTitle>
              <CardDescription>건물유형별 평균 예약률을 비교할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buildingTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} label={{ value: "예약률 (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => [`${value}%`, "평균 예약률"]} />
                    <Legend />
                    <Bar dataKey="value" name="평균 예약률" fill="#8884d8">
                      {buildingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">분석 결과</h4>
                <p className="text-sm text-muted-foreground">{getBuildingTypeAnalysisText(buildingTypeData)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 건물유형별 평균 예약률 계산 함수
function getBuildingTypeOccupancy(rooms: Room[], periodMonths: number) {
  const typeData: Record<string, number[]> = {}

  rooms.forEach((room) => {
    if (!room) return

    const type = room.building_type || "기타"
    if (!typeData[type]) typeData[type] = []

    let occupancyRate = room.occupancy_rate || 0
    if (periodMonths === 2) occupancyRate = room.occupancy_2rate || 0
    if (periodMonths === 3) occupancyRate = room.occupancy_3rate || 0

    typeData[type].push(occupancyRate)
  })

  return Object.entries(typeData).map(([name, rates]) => ({
    name,
    value: Math.round((rates.reduce((sum, rate) => sum + rate, 0) / (rates.length || 1)) * 10) / 10,
    count: rates.length,
  }))
}

// 상관관계 계산 함수
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

// 표준편차 계산 함수
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

// 가격대별 예약률 분석 텍스트 생성 함수 (실제 데이터 분석)
function getPriceAnalysisText(data: { price: number; occupancy: number }[]) {
  if (!data || data.length === 0) {
    return "분석할 데이터가 없어요."
  }

  // 유효한 데이터만 필터링
  const validData = data.filter((item) => item.price > 0 && item.occupancy >= 0)
  if (validData.length < 3) {
    return "분석하기에는 데이터가 너무 적어요. 최소 3개 이상의 매물이 필요합니다."
  }

  // 기본 통계
  const prices = validData.map((item) => item.price)
  const occupancies = validData.map((item) => item.occupancy)

  const avgOccupancy = occupancies.reduce((sum, occ) => sum + occ, 0) / occupancies.length
  const stdDevOccupancy = calculateStandardDeviation(occupancies)
  const correlation = calculateCorrelation(prices, occupancies)

  // 가격대별 구간 분석 (적절한 구간 수 계산)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  const intervalSize = Math.ceil(priceRange / Math.min(5, Math.floor(validData.length / 3))) // 구간당 최소 3개씩

  const priceRanges: Record<string, number[]> = {}
  validData.forEach((item) => {
    const rangeStart = Math.floor((item.price - minPrice) / intervalSize) * intervalSize + minPrice
    const rangeEnd = rangeStart + intervalSize - 1
    const rangeKey = `${Math.round(rangeStart / 10000)}만원-${Math.round(rangeEnd / 10000)}만원`
    if (!priceRanges[rangeKey]) priceRanges[rangeKey] = []
    priceRanges[rangeKey].push(item.occupancy)
  })

  // 신뢰할 수 있는 구간만 분석 (3개 이상)
  const reliableRanges = Object.entries(priceRanges)
    .filter(([_, occupancies]) => occupancies.length >= 3)
    .map(([range, occupancies]) => ({
      range,
      avgOccupancy: occupancies.reduce((sum, occ) => sum + occ, 0) / occupancies.length,
      count: occupancies.length,
      stdDev: calculateStandardDeviation(occupancies),
    }))
    .sort((a, b) => b.avgOccupancy - a.avgOccupancy)

  let analysisText = `총 ${validData.length}개 매물을 분석했어요. 평균 예약률은 ${avgOccupancy.toFixed(1)}%이고, 예약률 편차는 ${stdDevOccupancy.toFixed(1)}%포인트예요.`

  // 상관관계 해석
  if (Math.abs(correlation) > 0.3) {
    const direction = correlation > 0 ? "높을수록" : "낮을수록"
    const strength = Math.abs(correlation) > 0.7 ? "강한" : Math.abs(correlation) > 0.5 ? "중간" : "약한"
    analysisText += ` 가격이 ${direction} 예약률이 높아지는 ${strength} 경향이 있어요 (상관계수: ${correlation.toFixed(2)}).`
  } else {
    analysisText += ` 가격과 예약률 사이에는 뚜렷한 관계가 보이지 않아요.`
  }

  // 신뢰할 수 있는 구간 분석
  if (reliableRanges.length >= 2) {
    const bestRange = reliableRanges[0]
    analysisText += ` 가장 좋은 성과를 보이는 가격대는 ${bestRange.range} 구간으로, ${bestRange.count}개 매물의 평균 예약률이 ${bestRange.avgOccupancy.toFixed(1)}%예요.`
  } else {
    analysisText += ` 각 가격대별로 매물 수가 적어서 구간별 비교는 어려워요.`
  }

  return analysisText
}

// 평형대별 예약률 분석 텍스트 생성 함수 (실제 데이터 분석)
function getSizeAnalysisText(data: { size: number; occupancy: number }[]) {
  if (!data || data.length === 0) {
    return "분석할 데이터가 없어요."
  }

  // 유효한 데이터만 필터링
  const validData = data.filter((item) => item.size > 0 && item.occupancy >= 0)
  if (validData.length < 3) {
    return "분석하기에는 데이터가 너무 적어요. 최소 3개 이상의 매물이 필요합니다."
  }

  // 기본 통계
  const sizes = validData.map((item) => item.size)
  const occupancies = validData.map((item) => item.occupancy)

  const avgOccupancy = occupancies.reduce((sum, occ) => sum + occ, 0) / occupancies.length
  const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length
  const stdDevOccupancy = calculateStandardDeviation(occupancies)
  const correlation = calculateCorrelation(sizes, occupancies)

  // 평형대별 구간 분석
  const minSize = Math.min(...sizes)
  const maxSize = Math.max(...sizes)
  const sizeRange = maxSize - minSize
  const intervalSize = Math.max(3, Math.ceil(sizeRange / Math.min(4, Math.floor(validData.length / 3))))

  const sizeRanges: Record<string, number[]> = {}
  validData.forEach((item) => {
    const rangeStart = Math.floor((item.size - minSize) / intervalSize) * intervalSize + minSize
    const rangeEnd = rangeStart + intervalSize - 1
    const rangeKey = `${Math.round(rangeStart)}평-${Math.round(rangeEnd)}평`
    if (!sizeRanges[rangeKey]) sizeRanges[rangeKey] = []
    sizeRanges[rangeKey].push(item.occupancy)
  })

  // 신뢰할 수 있는 구간만 분석
  const reliableRanges = Object.entries(sizeRanges)
    .filter(([_, occupancies]) => occupancies.length >= 3)
    .map(([range, occupancies]) => ({
      range,
      avgOccupancy: occupancies.reduce((sum, occ) => sum + occ, 0) / occupancies.length,
      count: occupancies.length,
      stdDev: calculateStandardDeviation(occupancies),
    }))
    .sort((a, b) => b.avgOccupancy - a.avgOccupancy)

  let analysisText = `총 ${validData.length}개 매물을 분석했어요. 평균 평형은 ${avgSize.toFixed(1)}평이고, 평균 예약률은 ${avgOccupancy.toFixed(1)}%예요.`

  // 상관관계 해석
  if (Math.abs(correlation) > 0.3) {
    const direction = correlation > 0 ? "클수록" : "작을수록"
    const strength = Math.abs(correlation) > 0.7 ? "강한" : Math.abs(correlation) > 0.5 ? "중간" : "약한"
    analysisText += ` 평형이 ${direction} 예약률이 높아지는 ${strength} 경향이 있어요.`
  } else {
    analysisText += ` 평형과 예약률 사이에는 뚜렷한 관계가 보이지 않아요.`
  }

  // 신뢰할 수 있는 구간 분석
  if (reliableRanges.length >= 2) {
    const bestRange = reliableRanges[0]
    analysisText += ` 가장 좋은 성과를 보이는 평형대는 ${bestRange.range} 구간으로, ${bestRange.count}개 매물의 평균 예약률이 ${bestRange.avgOccupancy.toFixed(1)}%예요.`
  } else {
    analysisText += ` 각 평형대별로 매물 수가 적어서 구간별 비교는 어려워요.`
  }

  return analysisText
}

// 건물유형별 예약률 분석 텍스트 생성 함수 (실제 데이터 분석)
function getBuildingTypeAnalysisText(data: { name: string; value: number; count: number }[]) {
  if (!data || data.length === 0) {
    return "분석할 데이터가 없어요."
  }

  // 신뢰할 수 있는 데이터만 필터링 (5개 이상)
  const reliableData = data.filter((item) => item.count >= 5)
  const unreliableData = data.filter((item) => item.count < 5)

  // 전체 통계
  const totalProperties = data.reduce((sum, item) => sum + item.count, 0)
  const avgOccupancy = data.reduce((sum, item) => sum + item.value * item.count, 0) / totalProperties

  let analysisText = `총 ${totalProperties}개 매물을 ${data.length}개 건물유형으로 분석했어요. 전체 평균 예약률은 ${avgOccupancy.toFixed(1)}%예요.`

  if (reliableData.length >= 2) {
    // 신뢰할 수 있는 데이터로 분석
    const sortedReliable = [...reliableData].sort((a, b) => b.value - a.value)
    const bestType = sortedReliable[0]
    const worstType = sortedReliable[sortedReliable.length - 1]
    const performanceDiff = bestType.value - worstType.value

    // 표준편차 계산 (신뢰할 수 있는 데이터만)
    const reliableValues = reliableData.map((item) => item.value)
    const stdDev = calculateStandardDeviation(reliableValues)

    analysisText += ` 충분한 데이터가 있는 건물유형 중에서는 '${bestType.name}'이 가장 좋아요 (평균 ${bestType.value}%, ${bestType.count}개 매물).`

    if (performanceDiff > stdDev) {
      analysisText += ` '${worstType.name}'과 비교하면 ${performanceDiff.toFixed(1)}%포인트 차이가 나서 의미있는 차이라고 볼 수 있어요.`
    } else {
      analysisText += ` 다른 건물유형들과 큰 차이는 없는 편이에요.`
    }
  } else {
    analysisText += ` 대부분의 건물유형이 매물 수가 적어서 정확한 비교는 어려워요.`
  }

  if (unreliableData.length > 0) {
    const unreliableNames = unreliableData.map((item) => `${item.name}(${item.count}개)`).join(", ")
    analysisText += ` ${unreliableNames}은 매물 수가 적어서 참고용으로만 봐주세요.`
  }

  return analysisText
}

// 차트 색상
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]
