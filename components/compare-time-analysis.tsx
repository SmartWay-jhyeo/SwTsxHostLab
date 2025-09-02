"use client"

import { useState } from "react"
import type { Room } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PdfExportButton } from "@/components/pdf-export-button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"

export function CompareTimeAnalysis({ previousData, currentData }: { previousData: Room[]; currentData: Room[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("summary")
  const compareResultsId = "compare-time-results"

  // 기본 통계 계산
  const totalPrevious = previousData.length
  const totalCurrent = currentData.length
  const totalChange = totalCurrent - totalPrevious
  const totalChangePercent = totalPrevious > 0 ? (totalChange / totalPrevious) * 100 : 0

  // 평균 가격 계산
  const avgPricePrevious = previousData.reduce((sum, room) => sum + room.weekly_price, 0) / totalPrevious
  const avgPriceCurrent = currentData.reduce((sum, room) => sum + room.weekly_price, 0) / totalCurrent
  const priceChange = avgPriceCurrent - avgPricePrevious
  const priceChangePercent = avgPricePrevious > 0 ? (priceChange / avgPricePrevious) * 100 : 0

  // 평균 예약률 계산
  const avgOccupancyPrevious = previousData.reduce((sum, room) => sum + room.occupancy_rate, 0) / totalPrevious
  const avgOccupancyCurrent = currentData.reduce((sum, room) => sum + room.occupancy_rate, 0) / totalCurrent
  const occupancyChange = avgOccupancyCurrent - avgOccupancyPrevious

  // 건물유형 분포 계산
  const buildingTypesPrevious = getBuildingTypeDistribution(previousData)
  const buildingTypesCurrent = getBuildingTypeDistribution(currentData)

  // 변경된 매물 찾기
  const changedRooms = findChangedRooms(previousData, currentData)
  const filteredChangedRooms = changedRooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">시간 비교 분석 결과</h2>
        <PdfExportButton contentId={compareResultsId} fileName={`시간비교_${activeTab}_분석`} />
      </div>

      <Tabs defaultValue="summary" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">변경 요약</TabsTrigger>
          <TabsTrigger value="price">가격 변화</TabsTrigger>
          <TabsTrigger value="occupancy">예약률 변화</TabsTrigger>
          <TabsTrigger value="rooms">개별 매물 변화</TabsTrigger>
        </TabsList>

        <div id={compareResultsId} className="bg-white p-6 rounded-md mt-2">
          <TabsContent value="summary" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>매물 수 변화</CardTitle>
                  <CardDescription>전체 매물 수 변화</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "이전", value: totalPrevious },
                          { name: "현재", value: totalCurrent },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}개`, "매물 수"]} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>
                      변화량: {totalChange > 0 ? "+" : ""}
                      {totalChange}개 ({totalChangePercent.toFixed(1)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>평균 가격 변화</CardTitle>
                  <CardDescription>주간 렌트비 평균 변화</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "이전", value: avgPricePrevious },
                          { name: "현재", value: avgPriceCurrent },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value.toLocaleString()}원`} />
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`, "평균 렌트비"]} />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>
                      변화량: {priceChange > 0 ? "+" : ""}
                      {priceChange.toLocaleString()}원 ({priceChangePercent.toFixed(1)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>평균 예약률 변화</CardTitle>
                  <CardDescription>예약률 평균 변화</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "이전", value: avgOccupancyPrevious },
                          { name: "현재", value: avgOccupancyCurrent },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "평균 예약률"]} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>
                      변화량: {occupancyChange > 0 ? "+" : ""}
                      {occupancyChange.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>건물유형 분포 변화</CardTitle>
                <CardDescription>건물유형별 매물 수 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.keys(buildingTypesCurrent).map((type) => ({
                        name: type,
                        이전: buildingTypesPrevious[type] || 0,
                        현재: buildingTypesCurrent[type] || 0,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}개`, ""]} />
                      <Legend />
                      <Bar dataKey="이전" fill="#8884d8" />
                      <Bar dataKey="현재" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="price" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>가격 분포 변화</CardTitle>
                <CardDescription>주간 렌트비 분포 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getPriceDistributionData(previousData, currentData)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}개`, ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="이전" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="현재" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">가격 변화 분석</h4>
                  <p className="text-sm text-muted-foreground">{getPriceChangeAnalysis(previousData, currentData)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="occupancy" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>예약률 분포 변화</CardTitle>
                <CardDescription>예약률 분포 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getOccupancyDistributionData(previousData, currentData)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}개`, ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="이전" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="현재" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">예약률 변화 분석</h4>
                  <p className="text-sm text-muted-foreground">
                    {getOccupancyChangeAnalysis(previousData, currentData)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>개별 매물 변화</CardTitle>
                <CardDescription>개별 매물의 변화 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="매물명으로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  {filteredChangedRooms.length > 0 ? (
                    filteredChangedRooms.map((room) => (
                      <Card key={room.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <CardDescription>{room.address}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {room.changes.map((change, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{change.field}:</span>
                                <span>
                                  {change.oldValue} → {change.newValue}
                                  {change.field.includes("가격") || change.field.includes("렌트비") ? "원" : ""}
                                  {change.field.includes("예약률") ? "%" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">변경된 매물이 없거나 검색 결과가 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
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
function getPriceDistributionData(previousData: Room[], currentData: Room[]): any[] {
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
  const previousCounts = new Array(priceRanges.length).fill(0)
  const currentCounts = new Array(priceRanges.length).fill(0)

  previousData.forEach((room) => {
    const price = room.weekly_price
    if (price < 200000) previousCounts[0]++
    else if (price < 300000) previousCounts[1]++
    else if (price < 400000) previousCounts[2]++
    else if (price < 500000) previousCounts[3]++
    else if (price < 600000) previousCounts[4]++
    else if (price < 700000) previousCounts[5]++
    else if (price < 800000) previousCounts[6]++
    else previousCounts[7]++
  })

  currentData.forEach((room) => {
    const price = room.weekly_price
    if (price < 200000) currentCounts[0]++
    else if (price < 300000) currentCounts[1]++
    else if (price < 400000) currentCounts[2]++
    else if (price < 500000) currentCounts[3]++
    else if (price < 600000) currentCounts[4]++
    else if (price < 700000) currentCounts[5]++
    else if (price < 800000) currentCounts[6]++
    else currentCounts[7]++
  })

  // 데이터 포맷 생성
  return priceRanges.map((range, index) => ({
    range,
    이전: previousCounts[index],
    현재: currentCounts[index],
  }))
}

// 예약률 분포 데이터 생성 함수
function getOccupancyDistributionData(previousData: Room[], currentData: Room[]): any[] {
  // 예약률 범위 설정 (20% 단위)
  const occupancyRanges = ["0~20%", "20~40%", "40~60%", "60~80%", "80~100%"]

  // 각 범위별 매물 수 계산
  const previousCounts = new Array(occupancyRanges.length).fill(0)
  const currentCounts = new Array(occupancyRanges.length).fill(0)

  previousData.forEach((room) => {
    const occupancy = room.occupancy_rate
    if (occupancy < 20) previousCounts[0]++
    else if (occupancy < 40) previousCounts[1]++
    else if (occupancy < 60) previousCounts[2]++
    else if (occupancy < 80) previousCounts[3]++
    else previousCounts[4]++
  })

  currentData.forEach((room) => {
    const occupancy = room.occupancy_rate
    if (occupancy < 20) currentCounts[0]++
    else if (occupancy < 40) currentCounts[1]++
    else if (occupancy < 60) currentCounts[2]++
    else if (occupancy < 80) currentCounts[3]++
    else currentCounts[4]++
  })

  // 데이터 포맷 생성
  return occupancyRanges.map((range, index) => ({
    range,
    이전: previousCounts[index],
    현재: currentCounts[index],
  }))
}

// 변경된 매물 찾기 함수
interface ChangedRoom {
  id: number
  name: string
  address: string
  changes: {
    field: string
    oldValue: string | number
    newValue: string | number
  }[]
}

function findChangedRooms(previousData: Room[], currentData: Room[]): ChangedRoom[] {
  const changedRooms: ChangedRoom[] = []

  // 이전 데이터의 매물 ID 맵 생성
  const previousRoomMap = new Map<number, Room>()
  previousData.forEach((room) => {
    previousRoomMap.set(room.id, room)
  })

  // 현재 데이터의 매물과 이전 데이터 비교
  currentData.forEach((currentRoom) => {
    const previousRoom = previousRoomMap.get(currentRoom.id)
    if (previousRoom) {
      const changes = []

      // 가격 변화 확인
      if (previousRoom.weekly_price !== currentRoom.weekly_price) {
        changes.push({
          field: "주간 렌트비",
          oldValue: previousRoom.weekly_price.toLocaleString(),
          newValue: currentRoom.weekly_price.toLocaleString(),
        })
      }

      // 관리비 변화 확인
      if (previousRoom.weekly_maintenance !== currentRoom.weekly_maintenance) {
        changes.push({
          field: "주간 관리비",
          oldValue: previousRoom.weekly_maintenance.toLocaleString(),
          newValue: currentRoom.weekly_maintenance.toLocaleString(),
        })
      }

      // 청소비 변화 확인
      if (previousRoom.cleaning_fee !== currentRoom.cleaning_fee) {
        changes.push({
          field: "청소비",
          oldValue: previousRoom.cleaning_fee.toLocaleString(),
          newValue: currentRoom.cleaning_fee.toLocaleString(),
        })
      }

      // 예약률 변화 확인
      if (previousRoom.occupancy_rate !== currentRoom.occupancy_rate) {
        changes.push({
          field: "예약률",
          oldValue: previousRoom.occupancy_rate.toFixed(1),
          newValue: currentRoom.occupancy_rate.toFixed(1),
        })
      }

      // 할인율 변화 확인
      if (previousRoom.discount_4weeks !== currentRoom.discount_4weeks) {
        changes.push({
          field: "4주 할인율",
          oldValue: previousRoom.discount_4weeks,
          newValue: currentRoom.discount_4weeks,
        })
      }

      // 변경사항이 있는 경우 추가
      if (changes.length > 0) {
        changedRooms.push({
          id: currentRoom.id,
          name: currentRoom.name,
          address: currentRoom.address,
          changes,
        })
      }
    }
  })

  return changedRooms
}

// 가격 변화 분석 텍스트 생성 함수
function getPriceChangeAnalysis(previousData: Room[], currentData: Room[]): string {
  const avgPricePrevious = previousData.reduce((sum, room) => sum + room.weekly_price, 0) / previousData.length
  const avgPriceCurrent = currentData.reduce((sum, room) => sum + room.weekly_price, 0) / currentData.length
  const priceChange = avgPriceCurrent - avgPricePrevious
  const priceChangePercent = (priceChange / avgPricePrevious) * 100

  // 가격 범위별 변화 분석
  const previousDistribution = getPriceDistributionData(previousData, [])
  const currentDistribution = getPriceDistributionData([], currentData)

  // 가장 많은 매물이 있는 가격대 찾기
  const mostCommonPreviousIndex = previousDistribution.reduce(
    (maxIndex, item, index, arr) => (item.이전 > arr[maxIndex].이전 ? index : maxIndex),
    0,
  )
  const mostCommonCurrentIndex = currentDistribution.reduce(
    (maxIndex, item, index, arr) => (item.현재 > arr[maxIndex].현재 ? index : maxIndex),
    0,
  )

  const mostCommonPreviousRange = previousDistribution[mostCommonPreviousIndex].range
  const mostCommonCurrentRange = currentDistribution[mostCommonCurrentIndex].range

  if (priceChange > 0) {
    return `평균 주간 렌트비가 ${avgPricePrevious.toLocaleString()}원에서 ${avgPriceCurrent.toLocaleString()}원으로 ${priceChange.toLocaleString()}원(${priceChangePercent.toFixed(1)}%) 상승했습니다. 이전에는 ${mostCommonPreviousRange} 구간에 가장 많은 매물이 분포했으나, 현재는 ${mostCommonCurrentRange} 구간에 가장 많은 매물이 분포하고 있습니다. 전반적인 가격 상승 추세가 관찰됩니다.`
  } else if (priceChange < 0) {
    return `평균 주간 렌트비가 ${avgPricePrevious.toLocaleString()}원에서 ${avgPriceCurrent.toLocaleString()}원으로 ${Math.abs(priceChange).toLocaleString()}원(${Math.abs(priceChangePercent).toFixed(1)}%) 하락했습니다. 이전에는 ${mostCommonPreviousRange} 구간에 가장 많은 매물이 분포했으나, 현재는 ${mostCommonCurrentRange} 구간에 가장 많은 매물이 분포하고 있습니다. 전반적인 가격 하락 추세가 관찰됩니다.`
  } else {
    return `평균 주간 렌트비는 ${avgPricePrevious.toLocaleString()}원으로 변화가 없습니다. 이전과 현재 모두 ${mostCommonPreviousRange} 구간에 가장 많은 매물이 분포하고 있습니다. 가격 안정성이 유지되고 있습니다.`
  }
}

// 예약률 변화 분석 텍스트 생성 함수
function getOccupancyChangeAnalysis(previousData: Room[], currentData: Room[]): string {
  const avgOccupancyPrevious = previousData.reduce((sum, room) => sum + room.occupancy_rate, 0) / previousData.length
  const avgOccupancyCurrent = currentData.reduce((sum, room) => sum + room.occupancy_rate, 0) / currentData.length
  const occupancyChange = avgOccupancyCurrent - avgOccupancyPrevious

  // 예약률 범위별 변화 분석
  const previousDistribution = getOccupancyDistributionData(previousData, [])
  const currentDistribution = getOccupancyDistributionData([], currentData)

  // 가장 많은 매물이 있는 예약률 범위 찾기
  const mostCommonPreviousIndex = previousDistribution.reduce(
    (maxIndex, item, index, arr) => (item.이전 > arr[maxIndex].이전 ? index : maxIndex),
    0,
  )
  const mostCommonCurrentIndex = currentDistribution.reduce(
    (maxIndex, item, index, arr) => (item.현재 > arr[maxIndex].현재 ? index : maxIndex),
    0,
  )

  const mostCommonPreviousRange = previousDistribution[mostCommonPreviousIndex].range
  const mostCommonCurrentRange = currentDistribution[mostCommonCurrentIndex].range

  if (occupancyChange > 0) {
    return `평균 예약률이 ${avgOccupancyPrevious.toFixed(1)}%에서 ${avgOccupancyCurrent.toFixed(1)}%로 ${occupancyChange.toFixed(1)}% 상승했습니다. 이전에는 ${mostCommonPreviousRange} 구간에 가장 많은 매물이 분포했으나, 현재는 ${mostCommonCurrentRange} 구간에 가장 많은 매물이 분포하고 있습니다. 전반적인 예약률 상승 추세가 관찰됩니다.`
  } else if (occupancyChange < 0) {
    return `평균 예약률이 ${avgOccupancyPrevious.toFixed(1)}%에서 ${avgOccupancyCurrent.toFixed(1)}%로 ${Math.abs(occupancyChange).toFixed(1)}% 하락했습니다. 이전에는 ${mostCommonPreviousRange} 구간에 가장 많은 매물이 분포했으나, 현재는 ${mostCommonCurrentRange} 구간에 가장 많은 매물이 분포하고 있습니다. 전반적인 예약률 하락 추세가 관찰됩니다.`
  } else {
    return `평균 예약률은 ${avgOccupancyPrevious.toFixed(1)}%로 변화가 없습니다. 이전과 현재 모두 ${mostCommonPreviousRange} 구간에 가장 많은 매물이 분포하고 있습니다. 예약률 안정성이 유지되고 있습니다.`
  }
}
