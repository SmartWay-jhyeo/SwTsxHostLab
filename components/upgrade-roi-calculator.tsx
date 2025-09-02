"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, DollarSign, Home, TrendingUp, BarChart } from "lucide-react"

// 업그레이드 항목 타입 정의
interface UpgradeItem {
  id: string
  name: string
  category: string
  description: string
  minCost: number
  maxCost: number
  priceImpact: number // 가격 상승 효과 (%)
  occupancyImpact: number // 예약률 상승 효과 (% 포인트)
  reviewImpact: number // 리뷰 점수 상승 효과 (0.1-0.5)
  timeToImplement: number // 구현 시간 (일)
  maintenanceCost: number // 연간 유지 비용
  lifespan: number // 수명 (년)
}

// 샘플 업그레이드 항목 데이터
const upgradeItems: UpgradeItem[] = [
  {
    id: "premium-bedding",
    name: "프리미엄 침구",
    category: "침실",
    description: "고급 매트리스, 베개, 이불 등 침구류 업그레이드",
    minCost: 500000,
    maxCost: 2000000,
    priceImpact: 5,
    occupancyImpact: 3,
    reviewImpact: 0.3,
    timeToImplement: 1,
    maintenanceCost: 200000,
    lifespan: 3,
  },
  {
    id: "smart-tv",
    name: "스마트 TV",
    category: "엔터테인먼트",
    description: "최신 스마트 TV 및 스트리밍 서비스 구독",
    minCost: 800000,
    maxCost: 2500000,
    priceImpact: 3,
    occupancyImpact: 2,
    reviewImpact: 0.2,
    timeToImplement: 1,
    maintenanceCost: 100000,
    lifespan: 5,
  },
  {
    id: "kitchen-upgrade",
    name: "주방 업그레이드",
    category: "주방",
    description: "고급 주방 가전 및 조리 도구 업그레이드",
    minCost: 1000000,
    maxCost: 5000000,
    priceImpact: 7,
    occupancyImpact: 4,
    reviewImpact: 0.4,
    timeToImplement: 3,
    maintenanceCost: 300000,
    lifespan: 7,
  },
  {
    id: "bathroom-remodel",
    name: "욕실 리모델링",
    category: "욕실",
    description: "욕실 시설 및 인테리어 개선",
    minCost: 2000000,
    maxCost: 10000000,
    priceImpact: 10,
    occupancyImpact: 5,
    reviewImpact: 0.5,
    timeToImplement: 7,
    maintenanceCost: 500000,
    lifespan: 10,
  },
  {
    id: "smart-home",
    name: "스마트홈 시스템",
    category: "기술",
    description: "스마트 조명, 온도 조절, 보안 시스템 등 설치",
    minCost: 1500000,
    maxCost: 7000000,
    priceImpact: 8,
    occupancyImpact: 4,
    reviewImpact: 0.4,
    timeToImplement: 5,
    maintenanceCost: 400000,
    lifespan: 6,
  },
  {
    id: "interior-design",
    name: "인테리어 디자인",
    category: "인테리어",
    description: "전문 인테리어 디자이너를 통한 공간 리디자인",
    minCost: 3000000,
    maxCost: 15000000,
    priceImpact: 15,
    occupancyImpact: 7,
    reviewImpact: 0.5,
    timeToImplement: 14,
    maintenanceCost: 1000000,
    lifespan: 5,
  },
  {
    id: "workspace",
    name: "업무 공간",
    category: "기능",
    description: "재택근무자를 위한 전용 업무 공간 구성",
    minCost: 1000000,
    maxCost: 3000000,
    priceImpact: 6,
    occupancyImpact: 5,
    reviewImpact: 0.3,
    timeToImplement: 3,
    maintenanceCost: 200000,
    lifespan: 5,
  },
  {
    id: "outdoor-space",
    name: "야외 공간",
    category: "외부",
    description: "발코니, 테라스 등 야외 공간 개선",
    minCost: 2000000,
    maxCost: 8000000,
    priceImpact: 12,
    occupancyImpact: 6,
    reviewImpact: 0.4,
    timeToImplement: 10,
    maintenanceCost: 700000,
    lifespan: 8,
  },
  {
    id: "high-speed-wifi",
    name: "고속 와이파이",
    category: "기술",
    description: "초고속 인터넷 및 메시 와이파이 시스템 설치",
    minCost: 300000,
    maxCost: 1000000,
    priceImpact: 4,
    occupancyImpact: 3,
    reviewImpact: 0.3,
    timeToImplement: 1,
    maintenanceCost: 150000,
    lifespan: 4,
  },
  {
    id: "soundproofing",
    name: "방음 시설",
    category: "편안함",
    description: "창문, 벽, 천장 방음 처리",
    minCost: 1500000,
    maxCost: 5000000,
    priceImpact: 7,
    occupancyImpact: 4,
    reviewImpact: 0.4,
    timeToImplement: 5,
    maintenanceCost: 100000,
    lifespan: 10,
  },
]

// 업그레이드 카테고리 정의
const categories = [
  { id: "all", name: "전체" },
  { id: "bedroom", name: "침실" },
  { id: "kitchen", name: "주방" },
  { id: "bathroom", name: "욕실" },
  { id: "tech", name: "기술" },
  { id: "interior", name: "인테리어" },
  { id: "function", name: "기능" },
  { id: "exterior", name: "외부" },
]

export function UpgradeRoiCalculator() {
  const [currentPrice, setCurrentPrice] = useState<string>("100000")
  const [currentOccupancy, setCurrentOccupancy] = useState<string>("70")
  const [budget, setBudget] = useState<string>("5000000")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([])
  const [customUpgradeCosts, setCustomUpgradeCosts] = useState<Record<string, number>>({})
  const [results, setResults] = useState<any>(null)

  // 선택된 업그레이드 항목 관리
  const toggleUpgrade = (upgradeId: string) => {
    if (selectedUpgrades.includes(upgradeId)) {
      setSelectedUpgrades(selectedUpgrades.filter((id) => id !== upgradeId))
    } else {
      setSelectedUpgrades([...selectedUpgrades, upgradeId])
    }
  }

  // 업그레이드 비용 설정
  const setUpgradeCost = (upgradeId: string, cost: number) => {
    setCustomUpgradeCosts({
      ...customUpgradeCosts,
      [upgradeId]: cost,
    })
  }

  // 필터링된 업그레이드 항목
  const filteredUpgrades = upgradeItems.filter(
    (item) => selectedCategory === "all" || item.category.toLowerCase().includes(selectedCategory.toLowerCase()),
  )

  // ROI 계산
  const calculateROI = () => {
    const currentPriceValue = Number.parseFloat(currentPrice)
    const currentOccupancyValue = Number.parseFloat(currentOccupancy)

    // 현재 월 수익 계산
    const currentMonthlyRevenue = currentPriceValue * 30 * (currentOccupancyValue / 100)

    // 선택된 업그레이드 항목 정보
    const selectedItems = upgradeItems.filter((item) => selectedUpgrades.includes(item.id))

    // 총 업그레이드 비용
    const totalUpgradeCost = selectedItems.reduce(
      (sum, item) => sum + (customUpgradeCosts[item.id] || Math.round((item.minCost + item.maxCost) / 2)),
      0,
    )

    // 가격 상승 효과 계산
    const priceIncrease =
      selectedItems.reduce((total, item) => total * (1 + item.priceImpact / 100), currentPriceValue) - currentPriceValue

    // 예약률 상승 효과 계산 (최대 95%까지)
    const occupancyIncrease =
      Math.min(95, currentOccupancyValue + selectedItems.reduce((total, item) => total + item.occupancyImpact, 0)) -
      currentOccupancyValue

    // 업그레이드 후 월 수익 계산
    const newPrice = currentPriceValue + priceIncrease
    const newOccupancy = currentOccupancyValue + occupancyIncrease
    const newMonthlyRevenue = newPrice * 30 * (newOccupancy / 100)

    // 월 수익 증가
    const monthlyRevenueIncrease = newMonthlyRevenue - currentMonthlyRevenue

    // 연간 유지 비용
    const annualMaintenanceCost = selectedItems.reduce((sum, item) => sum + item.maintenanceCost, 0)

    // 연간 순이익 증가
    const annualProfitIncrease = monthlyRevenueIncrease * 12 - annualMaintenanceCost

    // ROI 계산
    const roi = (annualProfitIncrease / totalUpgradeCost) * 100

    // 투자 회수 기간 (월)
    const paybackPeriod = totalUpgradeCost / monthlyRevenueIncrease

    // 각 업그레이드 항목별 ROI 계산
    const upgradeROIs = selectedItems.map((item) => {
      const itemCost = customUpgradeCosts[item.id] || Math.round((item.minCost + item.maxCost) / 2)

      // 개별 항목의 가격 상승 효과
      const itemPriceIncrease = currentPriceValue * (item.priceImpact / 100)

      // 개별 항목의 예약률 상승 효과 (최대 95%까지)
      const itemOccupancyIncrease = Math.min(95, currentOccupancyValue + item.occupancyImpact) - currentOccupancyValue

      // 개별 항목의 월 수익 증가
      const itemNewPrice = currentPriceValue + itemPriceIncrease
      const itemNewOccupancy = currentOccupancyValue + itemOccupancyIncrease
      const itemNewMonthlyRevenue = itemNewPrice * 30 * (itemNewOccupancy / 100)
      const itemMonthlyRevenueIncrease = itemNewMonthlyRevenue - currentMonthlyRevenue

      // 개별 항목의 연간 순이익 증가
      const itemAnnualProfitIncrease = itemMonthlyRevenueIncrease * 12 - item.maintenanceCost

      // 개별 항목의 ROI
      const itemRoi = (itemAnnualProfitIncrease / itemCost) * 100

      // 개별 항목의 투자 회수 기간 (월)
      const itemPaybackPeriod = itemCost / itemMonthlyRevenueIncrease

      return {
        ...item,
        cost: itemCost,
        priceIncrease: itemPriceIncrease,
        occupancyIncrease: itemOccupancyIncrease,
        monthlyRevenueIncrease: itemMonthlyRevenueIncrease,
        annualProfitIncrease: itemAnnualProfitIncrease,
        roi: itemRoi,
        paybackPeriod: itemPaybackPeriod,
      }
    })

    // 결과 설정
    setResults({
      currentPrice: currentPriceValue,
      currentOccupancy: currentOccupancyValue,
      currentMonthlyRevenue,
      newPrice,
      newOccupancy,
      newMonthlyRevenue,
      priceIncrease,
      occupancyIncrease,
      monthlyRevenueIncrease,
      annualProfitIncrease,
      totalUpgradeCost,
      annualMaintenanceCost,
      roi,
      paybackPeriod,
      upgradeROIs,
      selectedItems,
    })
  }

  // 예산 내 최적 조합 추천
  const recommendOptimalCombination = () => {
    const budgetValue = Number.parseFloat(budget)
    const currentPriceValue = Number.parseFloat(currentPrice)
    const currentOccupancyValue = Number.parseFloat(currentOccupancy)

    // 모든 업그레이드 항목의 ROI 계산
    const allUpgradeROIs = upgradeItems.map((item) => {
      const itemCost = Math.round((item.minCost + item.maxCost) / 2)

      // 개별 항목의 가격 상승 효과
      const itemPriceIncrease = currentPriceValue * (item.priceImpact / 100)

      // 개별 항목의 예약률 상승 효과 (최대 95%까지)
      const itemOccupancyIncrease = Math.min(95, currentOccupancyValue + item.occupancyImpact) - currentOccupancyValue

      // 개별 항목의 월 수익 증가
      const itemNewPrice = currentPriceValue + itemPriceIncrease
      const itemNewOccupancy = currentOccupancyValue + itemOccupancyIncrease
      const itemNewMonthlyRevenue = itemNewPrice * 30 * (itemNewOccupancy / 100)
      const itemMonthlyRevenueIncrease = itemNewMonthlyRevenue - currentPriceValue * 30 * (currentOccupancyValue / 100)

      // 개별 항목의 연간 순이익 증가
      const itemAnnualProfitIncrease = itemMonthlyRevenueIncrease * 12 - item.maintenanceCost

      // 개별 항목의 ROI
      const itemRoi = (itemAnnualProfitIncrease / itemCost) * 100

      return {
        ...item,
        cost: itemCost,
        roi: itemRoi,
        annualProfitIncrease: itemAnnualProfitIncrease,
      }
    })

    // ROI 기준으로 정렬
    const sortedUpgrades = [...allUpgradeROIs].sort((a, b) => b.roi - a.roi)

    // 예산 내에서 최대 ROI를 제공하는 조합 찾기
    let remainingBudget = budgetValue
    const recommendedUpgrades: string[] = []

    for (const upgrade of sortedUpgrades) {
      if (upgrade.cost <= remainingBudget) {
        recommendedUpgrades.push(upgrade.id)
        remainingBudget -= upgrade.cost
      }
    }

    // 추천 업그레이드 설정
    setSelectedUpgrades(recommendedUpgrades)

    // 각 업그레이드의 기본 비용 설정
    const newCustomCosts: Record<string, number> = {}
    recommendedUpgrades.forEach((id) => {
      const item = upgradeItems.find((u) => u.id === id)
      if (item) {
        newCustomCosts[id] = Math.round((item.minCost + item.maxCost) / 2)
      }
    })

    setCustomUpgradeCosts(newCustomCosts)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          숙소 업그레이드 ROI 계산기
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!results ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPrice">현재 일일 가격 (원)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPrice"
                      type="number"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentOccupancy">현재 평균 예약률 (%)</Label>
                  <Input
                    id="currentOccupancy"
                    type="number"
                    min="0"
                    max="100"
                    value={currentOccupancy}
                    onChange={(e) => setCurrentOccupancy(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">업그레이드 예산 (원)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
                  </div>
                </div>

                <Button onClick={recommendOptimalCombination} variant="outline" className="w-full">
                  예산 내 최적 조합 추천
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">업그레이드 항목 선택</h3>
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUpgrades.map((upgrade) => {
                  const isSelected = selectedUpgrades.includes(upgrade.id)
                  const defaultCost = Math.round((upgrade.minCost + upgrade.maxCost) / 2)
                  const currentCost = customUpgradeCosts[upgrade.id] || defaultCost

                  return (
                    <div
                      key={upgrade.id}
                      className={`border rounded-lg p-4 ${isSelected ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{upgrade.name}</h4>
                          <p className="text-sm text-muted-foreground">{upgrade.description}</p>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-sm">
                              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                              <span>가격 상승 효과: +{upgrade.priceImpact}%</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <BarChart className="w-4 h-4 mr-2 text-blue-500" />
                              <span>예약률 상승 효과: +{upgrade.occupancyImpact}%p</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleUpgrade(upgrade.id)}
                        >
                          {isSelected ? "선택됨" : "선택"}
                        </Button>
                      </div>

                      {isSelected && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <Label htmlFor={`cost-${upgrade.id}`} className="text-sm">
                              비용 설정 (₩{upgrade.minCost.toLocaleString()} ~ ₩{upgrade.maxCost.toLocaleString()})
                            </Label>
                            <div className="flex items-center gap-4">
                              <Slider
                                id={`cost-${upgrade.id}`}
                                min={upgrade.minCost}
                                max={upgrade.maxCost}
                                step={100000}
                                value={[currentCost]}
                                onValueChange={(value) => setUpgradeCost(upgrade.id, value[0])}
                                className="flex-1"
                              />
                              <div className="w-24 text-right font-medium">₩{currentCost.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>구현 시간: {upgrade.timeToImplement}일</div>
                            <div>연간 유지비: ₩{upgrade.maintenanceCost.toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  선택된 항목: {selectedUpgrades.length}개 / 총 비용: ₩
                  {selectedUpgrades
                    .reduce((sum, id) => {
                      const item = upgradeItems.find((u) => u.id === id)
                      return sum + (item ? customUpgradeCosts[id] || Math.round((item.minCost + item.maxCost) / 2) : 0)
                    }, 0)
                    .toLocaleString()}
                </p>
              </div>

              <Button onClick={calculateROI} disabled={selectedUpgrades.length === 0}>
                ROI 계산하기
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">업그레이드 ROI 분석 결과</h3>
                  <p className="text-sm text-muted-foreground">
                    선택된 항목: {results.selectedItems.length}개 / 총 비용: ₩
                    {results.totalUpgradeCost.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{results.roi.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">연간 ROI</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">월 수익 증가</h3>
                  <p className="text-2xl font-bold">₩{Math.round(results.monthlyRevenueIncrease).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">투자 회수 기간</h3>
                  <p className="text-2xl font-bold">{results.paybackPeriod.toFixed(1)}개월</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <BarChart className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">가격 상승</h3>
                  <p className="text-2xl font-bold">+{Math.round(results.priceIncrease).toLocaleString()}원</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">예약률 상승</h3>
                  <p className="text-2xl font-bold">+{results.occupancyIncrease.toFixed(1)}%p</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="comparison">항목별 ROI 비교</TabsTrigger>
                <TabsTrigger value="recommendations">추천 사항</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">업그레이드 전후 비교</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">일일 가격</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">₩{results.currentPrice.toLocaleString()}</p>
                            <span className="text-sm text-green-600">→</span>
                            <p className="font-medium">₩{Math.round(results.newPrice).toLocaleString()}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">예약률</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{results.currentOccupancy}%</p>
                            <span className="text-sm text-green-600">→</span>
                            <p className="font-medium">{results.newOccupancy.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">월 수익</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">₩{Math.round(results.currentMonthlyRevenue).toLocaleString()}</p>
                            <span className="text-sm text-green-600">→</span>
                            <p className="font-medium">₩{Math.round(results.newMonthlyRevenue).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-border my-2"></div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">총 업그레이드 비용</p>
                          <p className="font-medium">₩{results.totalUpgradeCost.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">연간 유지 비용</p>
                          <p className="font-medium">₩{results.annualMaintenanceCost.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="h-px bg-border my-2"></div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">연간 순이익 증가</p>
                          <p className="font-medium text-green-600">
                            ₩{Math.round(results.annualProfitIncrease).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">5년 누적 순이익 증가</p>
                          <p className="font-medium text-green-600">
                            ₩{Math.round(results.annualProfitIncrease * 5).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">���택된 업그레이드 항목</h3>
                    <div className="space-y-3">
                      {results.selectedItems.map((item: UpgradeItem) => {
                        const itemCost = customUpgradeCosts[item.id] || Math.round((item.minCost + item.maxCost) / 2)

                        return (
                          <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₩{itemCost.toLocaleString()}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">항목별 ROI 비교</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">업그레이드 항목</th>
                            <th className="text-right py-2">비용</th>
                            <th className="text-right py-2">연간 수익 증가</th>
                            <th className="text-right py-2">ROI</th>
                            <th className="text-right py-2">회수 기간</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.upgradeROIs
                            .sort((a: any, b: any) => b.roi - a.roi)
                            .map((item: any) => (
                              <tr key={item.id} className="border-b">
                                <td className="py-2">
                                  <div>
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{item.category}</span>
                                  </div>
                                </td>
                                <td className="text-right py-2">₩{item.cost.toLocaleString()}</td>
                                <td className="text-right py-2 text-green-600">
                                  ₩{Math.round(item.annualProfitIncrease).toLocaleString()}
                                </td>
                                <td className="text-right py-2 font-medium">{item.roi.toFixed(1)}%</td>
                                <td className="text-right py-2">{item.paybackPeriod.toFixed(1)}개월</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">ROI 기준 최적 업그레이드 순서</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      예산이 제한적인 경우, 아래 순서대로 업그레이드를 진행하는 것이 가장 효율적입니다.
                    </p>
                    <div className="space-y-2">
                      {results.upgradeROIs
                        .sort((a: any, b: any) => b.roi - a.roi)
                        .map((item: any, index: number) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
                            <div className="bg-primary/10 text-primary font-medium w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                ROI: {item.roi.toFixed(1)}% | 비용: ₩{item.cost.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">최적화 제안</h3>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-1">투자 우선순위</h4>
                        <p className="text-sm text-blue-700">
                          {results.upgradeROIs[0]?.roi > 50
                            ? `${results.upgradeROIs[0]?.name}의 ROI가 매우 높습니다. 가장 먼저 투자하는 것이 좋습니다.`
                            : `전반적인 ROI가 적정 수준입니다. 예산에 맞게 단계적으로 업그레이드를 진행하세요.`}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <h4 className="font-medium text-amber-800 mb-1">가격 책정 전략</h4>
                        <p className="text-sm text-amber-700">
                          업그레이드 후 가격을 {Math.round(results.newPrice).toLocaleString()}원으로 설정하되, 초기에는{" "}
                          {Math.round(results.newPrice * 0.95).toLocaleString()}원 정도로 시작하여 리뷰와 예약률을
                          확인한 후 점진적으로 인상하는 것이 좋습니다.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <h4 className="font-medium text-green-800 mb-1">마케팅 포인트</h4>
                        <p className="text-sm text-green-700">
                          업그레이드 후에는{" "}
                          {results.selectedItems
                            .slice(0, 3)
                            .map((i: UpgradeItem) => i.name)
                            .join(", ")}{" "}
                          등의 새로운 특징을 리스팅 설명과 사진에 강조하여 게스트의 관심을 끌어야 합니다.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <h4 className="font-medium text-purple-800 mb-1">구현 계획</h4>
                        <p className="text-sm text-purple-700">
                          전체 업그레이드 완료까지 약{" "}
                          {Math.max(...results.selectedItems.map((i: UpgradeItem) => i.timeToImplement))}일이 소요될
                          것으로 예상됩니다. 예약이 적은 시즌에 맞춰 계획을 세우는 것이 좋습니다.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">장기 계획</h3>
                    <div className="space-y-3">
                      <p className="text-sm">
                        현재 선택한 업그레이드의 투자 회수 기간은 약 {results.paybackPeriod.toFixed(1)}개월입니다. 이후
                        추가 업그레이드를 고려할 때는 다음 항목들을 검토해보세요:
                      </p>

                      <ul className="space-y-2 text-sm">
                        {upgradeItems
                          .filter((item) => !selectedUpgrades.includes(item.id))
                          .sort((a, b) => b.priceImpact + b.occupancyImpact - (a.priceImpact + a.occupancyImpact))
                          .slice(0, 3)
                          .map((item) => (
                            <li key={item.id} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>
                                {item.name} - 가격 상승 효과 +{item.priceImpact}%, 예약률 상승 효과 +
                                {item.occupancyImpact}%p
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setResults(null)}>
                다시 계산하기
              </Button>
              <Button>결과 저장하기</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
