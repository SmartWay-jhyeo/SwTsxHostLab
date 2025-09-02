"use client"

import { useState, useCallback, useMemo } from "react"
import type { Room, SimulationScenario, RentalCosts } from "@/lib/types"
import { COMMISSION_RATE } from "@/lib/constants"

interface ScenarioParams {
  pattern: string
  occupancyRate: number
  weeks: number | number[]
  repeat: number | number[]
  discount: number | number[]
}

export function useProfitCalculation(room: Room | null) {
  const [costs, setCosts] = useState<RentalCosts>({
    monthlyRent: room?.monthly_rent || 1200000,
    maintenanceFee: room?.monthly_maintenance || 200000,
    cleaningCost: room?.cleaning_cost || 100000,
    setupCost: room?.initial_setup_cost || 2000000,
    deposit: room?.deposit || 10000000,
  })

  const [scenarios, setScenarios] = useState<SimulationScenario[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  // 단일 시나리오 계산 함수
  const calculateScenario = useCallback(
    (params: ScenarioParams): SimulationScenario => {
      if (!room) {
        throw new Error("숙소 정보가 없습니다.")
      }

      const { pattern, occupancyRate, weeks, repeat, discount } = params
      const weeklyBase = room.weekly_price + room.weekly_maintenance

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
      const commission = totalRevenue * COMMISSION_RATE

      // 지출 계산
      const expenses = {
        월세: costs.monthlyRent,
        관리비: costs.maintenanceFee,
        청소비: costs.cleaningCost * cleaningCount,
      }

      // 순수익 계산
      const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0)
      const netIncome = totalRevenue * (1 - COMMISSION_RATE) - totalExpenses

      // 할인액 계산
      const basePrice =
        weeklyBase *
        (Array.isArray(weeks)
          ? weeks.reduce((sum, w, i) => sum + w * (Array.isArray(repeat) ? repeat[i] : repeat), 0)
          : weeks * repeat)
      const discountAmount = basePrice - baseRevenue

      // 투자금 회수 기간 계산
      const breakEvenMonths = netIncome > 0 ? costs.setupCost / netIncome : 0

      return {
        pattern,
        occupancy_rate: occupancyRate,
        gross_revenue: totalRevenue,
        net_income: netIncome,
        commission,
        cleaning_revenue: cleaningRevenue,
        cleaning_cost: expenses["청소비"],
        expenses,
        discount_amount: discountAmount,
        weeks,
        discount_rate: discount,
        breakEvenMonths,
      }
    },
    [room, costs],
  )

  // 모든 시나리오 계산
  const calculateAllScenarios = useCallback(async () => {
    if (!room) {
      throw new Error("숙소 정보가 없습니다.")
    }

    setIsCalculating(true)

    try {
      // 비동기 처리로 UI 블로킹 방지
      await new Promise((resolve) => setTimeout(resolve, 10))

      const scenarioParams: ScenarioParams[] = [
        {
          pattern: "1주 계약 x 4회",
          occupancyRate: 100,
          weeks: 1,
          repeat: 4,
          discount: 0,
        },
        {
          pattern: "2주 계약 x 2회",
          occupancyRate: 100,
          weeks: 2,
          repeat: 2,
          discount: room.discount_2weeks,
        },
        {
          pattern: "4주 계약 x 1회",
          occupancyRate: 100,
          weeks: 4,
          repeat: 1,
          discount: room.discount_4weeks,
        },
        {
          pattern: "1주 계약 x 3회",
          occupancyRate: 75,
          weeks: 1,
          repeat: 3,
          discount: 0,
        },
        {
          pattern: "2주 계약 + 1주 계약",
          occupancyRate: 75,
          weeks: [2, 1],
          repeat: [1, 1],
          discount: [room.discount_2weeks, 0],
        },
        {
          pattern: "1주 계약 x 2회",
          occupancyRate: 50,
          weeks: 1,
          repeat: 2,
          discount: 0,
        },
        {
          pattern: "2주 계약 x 1회",
          occupancyRate: 50,
          weeks: 2,
          repeat: 1,
          discount: room.discount_2weeks,
        },
        {
          pattern: "1주 계약 x 1회",
          occupancyRate: 25,
          weeks: 1,
          repeat: 1,
          discount: 0,
        },
      ]

      const calculatedScenarios = scenarioParams.map(calculateScenario)
      setScenarios(calculatedScenarios)

      return calculatedScenarios
    } finally {
      setIsCalculating(false)
    }
  }, [room, calculateScenario])

  // ROI 시뮬레이션 데이터 생성
  const roiData = useMemo(() => {
    if (scenarios.length === 0) return []

    const months = Array.from({ length: 25 }, (_, i) => i) // 0~24개월

    // 예약률별 최고 수익 시나리오 선택
    const bestScenarios: Record<number, SimulationScenario> = {}
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
        const cumulativeProfit = month === 0 ? -costs.setupCost : -costs.setupCost + monthlyProfit * month
        data[`occupancy${occupancy}`] = cumulativeProfit
      })

      return data
    })
  }, [scenarios, costs.setupCost])

  // 최적 시나리오 찾기
  const bestScenario = useMemo(() => {
    if (scenarios.length === 0) return null
    return scenarios.reduce((best, current) => (current.net_income > best.net_income ? current : best))
  }, [scenarios])

  // 비용 업데이트 함수
  const updateCosts = useCallback((newCosts: Partial<RentalCosts>) => {
    setCosts((prev) => ({ ...prev, ...newCosts }))
  }, [])

  // 손익분기점 계산
  const calculateBreakEvenMonth = useCallback((data: any[], key: string): string | number => {
    if (!data || data.length === 0) {
      return "데이터 없음"
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i][key] >= 0) {
        return i
      }
    }
    return "24개월 이상"
  }, [])

  return {
    costs,
    scenarios,
    roiData,
    bestScenario,
    isCalculating,
    updateCosts,
    calculateAllScenarios,
    calculateBreakEvenMonth,
  }
}
