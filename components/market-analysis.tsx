"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { Room } from "@/lib/types"

interface MarketAnalysisProps {
  rooms: Room[]
  periodMonths: number
}

export function MarketAnalysis({ rooms, periodMonths }: MarketAnalysisProps) {
  // 건물 유형별 분석
  const buildingTypeData = rooms.reduce(
    (acc, room) => {
      const type = room.building_type || "기타"
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const buildingChartData = Object.entries(buildingTypeData).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: ((count / rooms.length) * 100).toFixed(1),
  }))

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value}개 ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* 건물유형 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>건물유형 분석</CardTitle>
          <CardDescription>지역 내 건물유형별 분포를 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {buildingChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buildingChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {buildingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              건물유형 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
