"use client"

import type { Room } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
} from "recharts"

// 이상치 제거 함수
function removeOutliers<T>(items: T[], valueSelector: (item: T) => number, stdDevMultiplier = 2): T[] {
  const values = items.map(valueSelector)
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length)

  return items.filter((item) => {
    const value = valueSelector(item)
    return value >= avg - stdDevMultiplier * stdDev && value <= avg + stdDevMultiplier * stdDev
  })
}

// 평균 할인율 계산 함수
function getAvgDiscount(rooms: Room[], discountField: keyof Room): number {
  const sum = rooms.reduce((acc, room) => {
    const value = room[discountField]
    return acc + (typeof value === "number" ? value : 0)
  }, 0)
  return Math.round((sum / Math.max(rooms.length, 1)) * 10) / 10
}

export function PriceAnalysis({ rooms }: { rooms: Room[] }) {
  // 가격 이상치 제거
  const validPriceRooms = removeOutliers(rooms, (room) => room.weekly_price)

  // 평형 이상치 제거
  const validSizeRooms = removeOutliers(rooms, (room) => room.size_pyeong)

  // 가격 분포 데이터
  const priceData = validPriceRooms.map((room) => ({
    price: room.weekly_price,
    occupancy: room.occupancy_rate,
    name: room.name,
  }))

  // 평형 분포 데이터
  const sizeData = validSizeRooms.map((room) => ({
    size: room.size_pyeong,
    occupancy: room.occupancy_rate,
    name: room.name,
  }))

  const prices = rooms.map((r) => r.weekly_price)
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const sizes = rooms.map((r) => r.size_pyeong)
  const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length

  // 할인율 데이터
  const discountData = [
    { name: "2주", value: getAvgDiscount(rooms, "discount_2weeks") },
    { name: "4주", value: getAvgDiscount(rooms, "discount_4weeks") },
    { name: "8주", value: getAvgDiscount(rooms, "discount_8weeks") },
    { name: "12주", value: getAvgDiscount(rooms, "discount_12weeks") },
  ]

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>주간 렌트비 분포</CardTitle>
            <CardDescription>
              주간 렌트비와 예약률의 관계를 확인할 수 있습니다. (이상치 {rooms.length - validPriceRooms.length}개 제외)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
                  <Scatter name="예약률" data={priceData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-2">분석 결과</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>평균 렌트비: {Math.round(avgPrice).toLocaleString()}원</li>
                <li>최소 렌트비: {Math.min(...prices).toLocaleString()}원</li>
                <li>최대 렌트비: {Math.max(...prices).toLocaleString()}원</li>
                <li>
                  고수익 매물(예약률 75% 이상) 평균 렌트비:{" "}
                  {Math.round(
                    rooms.filter((r) => r.occupancy_rate >= 75).reduce((sum, r) => sum + r.weekly_price, 0) /
                      Math.max(1, rooms.filter((r) => r.occupancy_rate >= 75).length),
                  ).toLocaleString()}
                  원
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>평형별 분포</CardTitle>
            <CardDescription>
              평형과 예약률의 관계를 확인할 수 있습니다. (이상치 {rooms.length - validSizeRooms.length}개 제외)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
                  <Scatter name="예약률" data={sizeData} fill="#82ca9d" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-2">분석 결과</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>평균 평형: {avgSize.toFixed(1)}평</li>
                <li>최소 평형: {Math.min(...sizes).toFixed(1)}평</li>
                <li>최대 평형: {Math.max(...sizes).toFixed(1)}평</li>
                <li>
                  고수익 매물(예약률 75% 이상) 평균 평형:{" "}
                  {(
                    rooms.filter((r) => r.occupancy_rate >= 75).reduce((sum, r) => sum + r.size_pyeong, 0) /
                    Math.max(1, rooms.filter((r) => r.occupancy_rate >= 75).length)
                  ).toFixed(1)}
                  평
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>장기 계약 할인율</CardTitle>
          <CardDescription>계약 기간별 평균 할인율을 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discountData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: "평균 할인율 (%)", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => [`${value}%`, "평균 할인율"]} />
                <Bar dataKey="value" name="평균 할인율" fill="#8884d8">
                  {discountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">분석 결과</h4>
            <p className="text-sm text-muted-foreground">
              장기 계약 할인율 분석 결과, 계약 기간이 길수록 할인율이 높아지는 경향을 보입니다. 12주 계약의 경우 평균{" "}
              {discountData[3].value}%의 할인율을 제공하고 있어, 장기 투자 시 수익성 계산에 참고하시기 바랍니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 차트 색상
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]
