"use client"

import { useState } from "react"
import type { Room } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PropertyDetail } from "@/components/property-detail"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Cell,
  ReferenceLine,
} from "recharts"

export function TopProperties({ rooms, periodMonths }: { rooms: Room[]; periodMonths: number }) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // 예약률 기준으로 정렬하여 상위 3개 매물 선택
  const topRooms = [...rooms].sort((a, b) => b.occupancy_rate - a.occupancy_rate).slice(0, 3)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>상위 예약률 매물</CardTitle>
          <CardDescription>예약률이 가장 높은 상위 3개 매물의 정보를 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순위</TableHead>
                <TableHead>숙소명</TableHead>
                <TableHead>건물유형</TableHead>
                <TableHead className="text-right">평수</TableHead>
                <TableHead className="text-right">방개수</TableHead>
                <TableHead className="text-right">예약률</TableHead>
                <TableHead className="text-right">주간 렌트비</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRooms.map((room, index) => (
                <TableRow key={room.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.building_type}</TableCell>
                  <TableCell className="text-right">{room.size_pyeong}평</TableCell>
                  <TableCell className="text-right">{room.room_count}개</TableCell>
                  <TableCell className="text-right">{room.occupancy_rate}%</TableCell>
                  <TableCell className="text-right">{room.weekly_price.toLocaleString()}원</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRoom(room)}>
                          상세보기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>숙소 상세 정보</DialogTitle>
                        </DialogHeader>
                        {selectedRoom && <PropertyDetail room={selectedRoom} />}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {topRooms.length > 0 && (
        <Tabs defaultValue={`property-${topRooms[0].id}`}>
          <TabsList className="grid w-full grid-cols-3">
            {topRooms.map((room, index) => (
              <TabsTrigger key={room.id} value={`property-${room.id}`}>
                TOP {index + 1}: {room.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {topRooms.map((room, index) => (
            <TabsContent key={room.id} value={`property-${room.id}`} className="mt-6">
              <PropertyAnalysis room={room} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

interface ScenarioParams {
  pattern: string
  occupancyRate: number
  weeks: number | number[]
  repeat: number | number[]
  discount: number | number[]
  monthlyRent: number
  maintenanceFee: number
  cleaningCost: number
}

interface ScenarioResult {
  pattern: string
  booking_pattern: string
  occupancy_rate: number
  gross_revenue: number
  commission: number
  cleaning_revenue: number
  cleaning_cost: number
  expenses: Record<string, number>
  net_income: number
  discount_amount: number
  weeks: number | number[]
  discount_rate: number | number[]
}

// 시나리오 계산 함수
function calculateScenario(
  room: Room,
  { pattern, occupancyRate, weeks, repeat, discount, monthlyRent, maintenanceFee, cleaningCost }: ScenarioParams,
): ScenarioResult {
  const weeklyBase = room.weekly_price + room.weekly_maintenance
  const commissionRate = 0.033 // 3.3%

  let baseRevenue = 0
  let cleaningRevenue = 0
  let cleaningCount = 0

  if (Array.isArray(weeks)) {
    // 복합 패턴 (예: 2주 + 1주)
    for (let i = 0; i < weeks.length; i++) {
      const weekCount = weeks[i]
      const repeatCount = Array.isArray(repeat) ? repeat[i] : repeat
      const discountRate = Array.isArray(discount) ? discount[i] : discount

      baseRevenue += weeklyBase * weekCount * repeatCount * (1 - discountRate / 100)
      cleaningCount += repeatCount
    }
  } else {
    // 단일 패턴
    baseRevenue = weeklyBase * weeks * repeat * (1 - discount / 100)
    cleaningCount = repeat
  }

  cleaningRevenue = room.cleaning_fee * cleaningCount
  const totalRevenue = baseRevenue + cleaningRevenue

  // 수수료 계산
  const commission = totalRevenue * commissionRate

  // 지출 계산
  const expenses = {
    월세: monthlyRent,
    관리비: maintenanceFee,
    청소비: cleaningCost * cleaningCount,
  }

  // 순수익 계산
  const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0)
  const netIncome = totalRevenue * (1 - commissionRate) - totalExpenses

  // 할인액 계산
  const basePrice =
    weeklyBase *
    (Array.isArray(weeks)
      ? weeks.reduce((sum, w, i) => sum + w * (Array.isArray(repeat) ? repeat[i] : repeat), 0)
      : weeks * repeat)
  const discountAmount = basePrice - baseRevenue

  return {
    pattern,
    booking_pattern: pattern,
    occupancy_rate: occupancyRate,
    gross_revenue: totalRevenue,
    commission,
    cleaning_revenue: cleaningRevenue,
    cleaning_cost: expenses["청소비"],
    expenses,
    net_income: netIncome,
    discount_amount: discountAmount,
    weeks,
    discount_rate: discount,
  }
}

function PropertyAnalysis({ room }: { room: Room }) {
  const [monthlyRent, setMonthlyRent] = useState("")
  const [maintenanceFee, setMaintenanceFee] = useState("")
  const [setupCost, setSetupCost] = useState("")
  const [cleaningCost, setCleaningCost] = useState("")
  const [scenarios, setScenarios] = useState<any[]>([])

  // 수익성 분석 계산
  const calculateAnalysis = () => {
    if (!monthlyRent || !maintenanceFee || !setupCost || !cleaningCost) {
      alert("모든 필드를 입력해주세요.")
      return
    }

    const rent = Number.parseInt(monthlyRent.replace(/,/g, ""))
    const maintenance = Number.parseInt(maintenanceFee.replace(/,/g, ""))
    const setup = Number.parseInt(setupCost.replace(/,/g, ""))
    const cleaning = Number.parseInt(cleaningCost.replace(/,/g, ""))

    // 예약 패턴별 시나리오 계산
    const calculatedScenarios = [
      calculateScenario(room, {
        pattern: "1주 계약 x 4회",
        occupancyRate: 100,
        weeks: 1,
        repeat: 4,
        discount: 0,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "2주 계약 x 2회",
        occupancyRate: 100,
        weeks: 2,
        repeat: 2,
        discount: room.discount_2weeks,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "4주 계약 x 1회",
        occupancyRate: 100,
        weeks: 4,
        repeat: 1,
        discount: room.discount_4weeks,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "1주 계약 x 3회",
        occupancyRate: 75,
        weeks: 1,
        repeat: 3,
        discount: 0,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "2주 계약 + 1주 계약",
        occupancyRate: 75,
        weeks: [2, 1],
        repeat: [1, 1],
        discount: [room.discount_2weeks, 0],
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "1주 계약 x 2회",
        occupancyRate: 50,
        weeks: 1,
        repeat: 2,
        discount: 0,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "2주 계약 x 1회",
        occupancyRate: 50,
        weeks: 2,
        repeat: 1,
        discount: room.discount_2weeks,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
      calculateScenario(room, {
        pattern: "1주 계약 x 1회",
        occupancyRate: 25,
        weeks: 1,
        repeat: 1,
        discount: 0,
        monthlyRent: rent,
        maintenanceFee: maintenance,
        cleaningCost: cleaning,
      }),
    ]

    setScenarios(calculatedScenarios)
  }

  // ROI 시뮬레이션 데이터 생성
  const generateRoiData = () => {
    if (scenarios.length === 0) return []

    const setup = Number.parseInt(setupCost.replace(/,/g, ""))
    const months = Array.from({ length: 25 }, (_, i) => i) // 0~24개월

    // 예약률별 최고 수익 시나리오 선택
    const bestScenarios: Record<number, any> = {}
    scenarios.forEach((scenario) => {
      const occupancy = scenario.occupancy_rate
      if (!bestScenarios[occupancy] || scenario.net_income > bestScenarios[occupancy].net_income) {
        bestScenarios[occupancy] = scenario
      }
    })

    // 예약률별 ROI 데이터 생성
    return months.map((month) => {
      const data: Record<string, any> = { month }

      Object.entries(bestScenarios).forEach(([occupancy, scenario]) => {
        const monthlyProfit = scenario.net_income
        const cumulativeProfit = month === 0 ? -setup : -setup + monthlyProfit * month
        data[`occupancy${occupancy}`] = cumulativeProfit
      })

      return data
    })
  }

  const roiData = generateRoiData()

  return (
    <div className="grid md:grid-cols-5 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>매물 정보</CardTitle>
            <CardDescription>{room.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">주소:</span> {room.address}
              </p>
              <p>
                <span className="font-medium">건물유형:</span> {room.building_type}
              </p>
              <p>
                <span className="font-medium">평수:</span> {room.size_pyeong}평
              </p>
              <p>
                <span className="font-medium">방 개수:</span> {room.room_count}개
              </p>
              <p>
                <span className="font-medium">예약률:</span> {room.occupancy_rate}%
              </p>
              <p>
                <span className="font-medium">주간 렌트비:</span> {room.weekly_price.toLocaleString()}원
              </p>
              <p>
                <span className="font-medium">주간 관리비:</span> {room.weekly_maintenance.toLocaleString()}원
              </p>
              <p>
                <span className="font-medium">청소비:</span> {room.cleaning_fee.toLocaleString()}원
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://33m2.co.kr/room/detail/${room.id}`, "_blank")}
            >
              33m² 사이트에서 보기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수익성 분석 입력</CardTitle>
            <CardDescription>수익성 분석을 위한 정보를 입력해주세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthly-rent">월 렌트비</Label>
              <Input
                id="monthly-rent"
                placeholder="예: 1,000,000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-fee">월 관리비</Label>
              <Input
                id="maintenance-fee"
                placeholder="예: 200,000"
                value={maintenanceFee}
                onChange={(e) => setMaintenanceFee(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-cost">초기 셋팅비용</Label>
              <Input
                id="setup-cost"
                placeholder="예: 5,000,000"
                value={setupCost}
                onChange={(e) => setSetupCost(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaning-cost">회당 청소비</Label>
              <Input
                id="cleaning-cost"
                placeholder="예: 30,000"
                value={cleaningCost}
                onChange={(e) => setCleaningCost(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={calculateAnalysis}>
              수익성 분석 계산
            </Button>
          </CardContent>
        </Card>

        {scenarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>월간 예상 소득표</CardTitle>
              <CardDescription>예약 패턴별 수익 분석 결과입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약패턴</TableHead>
                    <TableHead className="text-right">예약률</TableHead>
                    <TableHead className="text-right">총수입</TableHead>
                    <TableHead className="text-right">순수익</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((scenario, index) => (
                    <TableRow key={index}>
                      <TableCell>{scenario.pattern}</TableCell>
                      <TableCell className="text-right">{scenario.occupancy_rate}%</TableCell>
                      <TableCell className="text-right">
                        {Math.round(scenario.gross_revenue).toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-right">{Math.round(scenario.net_income).toLocaleString()}원</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="md:col-span-3 space-y-6">
        {scenarios.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>수익성 분석</CardTitle>
                <CardDescription>월간 수입과 지출 분석입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "월 수입", value: scenarios[0].gross_revenue },
                        {
                          name: "고정 비용",
                          value: -Object.values(scenarios[0].expenses).reduce(
                            (sum: number, expense: number) => sum + expense,
                            0,
                          ),
                        },
                        { name: "순수익", value: scenarios[0].net_income },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${Math.abs(value).toLocaleString()}원`} />
                      <Tooltip formatter={(value) => [`${Math.abs(Number(value)).toLocaleString()}원`, ""]} />
                      <Bar dataKey="value" fill="#8884d8">
                        {[
                          { value: scenarios[0].gross_revenue, color: "#2ecc71" },
                          {
                            value: -Object.values(scenarios[0].expenses).reduce(
                              (sum: number, expense: number) => sum + expense,
                              0,
                            ),
                            color: "#e74c3c",
                          },
                          { value: scenarios[0].net_income, color: "#3498db" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>투자금 회수 시뮬레이션</CardTitle>
                <CardDescription>초기 셋팅비용 포함 투자금 회수 기간 시뮬레이션입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={roiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: "개월 수", position: "insideBottomRight", offset: -10 }} />
                      <YAxis tickFormatter={(value) => `${value.toLocaleString()}원`} />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toLocaleString()}원`, "누적 수익"]}
                        labelFormatter={(label) => `${label}개월`}
                      />
                      <Legend />
                      {Object.keys(
                        scenarios.reduce((acc, scenario) => {
                          acc[scenario.occupancy_rate] = true
                          return acc
                        }, {}),
                      ).map((occupancy, index) => (
                        <Line
                          key={occupancy}
                          type="monotone"
                          dataKey={`occupancy${occupancy}`}
                          name={`예약률 ${occupancy}%`}
                          stroke={COLORS[index % COLORS.length]}
                          activeDot={{ r: 8 }}
                        />
                      ))}
                      <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">분석 결과</h4>
                  <p className="text-sm text-muted-foreground">
                    예약률 100%일 경우 약 {calculateBreakEvenMonth(roiData, "occupancy100")}개월, 예약률 75%일 경우 약{" "}
                    {calculateBreakEvenMonth(roiData, "occupancy75")}개월, 예약률 50%일 경우 약{" "}
                    {calculateBreakEvenMonth(roiData, "occupancy50")}개월 후 초기 투자금을 회수할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

// 손익분기점 계산 함수
function calculateBreakEvenMonth(data: any[], key: string): string | number {
  if (!data || data.length === 0) {
    return "데이터 없음"
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i][key] >= 0) {
      return i
    }
  }
  return "24개월 이상"
}

// 차트 색상
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]
