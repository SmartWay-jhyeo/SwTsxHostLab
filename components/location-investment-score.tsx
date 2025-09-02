"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, Users, DollarSign, Star, CheckCircle } from "lucide-react"

// 지역 데이터 타입 정의
interface LocationData {
  id: string
  name: string
  district: string
  profitabilityScore: number // 수익성 점수 (1-10)
  stabilityScore: number // 안정성 점수 (1-10)
  growthPotentialScore: number // 성장 잠재력 점수 (1-10)
  managementEaseScore: number // 관리 용이성 점수 (1-10)
  averageOccupancy: number // 평균 예약률 (%)
  averageDailyRate: number // 평균 일일 가격 (원)
  averageMonthlyRent: number // 평균 월세 (원)
  mainGuestTypes: string[] // 주요 게스트 유형
  amenitiesImportance: string[] // 중요한 편의시설
  seasonality: "high" | "medium" | "low" // 계절성 정도
  competitionLevel: "high" | "medium" | "low" // 경쟁 수준
  investmentTips: string[] // 투자 팁
}

// 샘플 지역 데이터
const locationData: LocationData[] = [
  {
    id: "gangnam",
    name: "강남역",
    district: "강남구",
    profitabilityScore: 8,
    stabilityScore: 7,
    growthPotentialScore: 9,
    managementEaseScore: 6,
    averageOccupancy: 75,
    averageDailyRate: 120000,
    averageMonthlyRent: 1500000,
    mainGuestTypes: ["비즈니스 여행객", "해외 관광객", "국내 관광객"],
    amenitiesImportance: ["고속 와이파이", "업무 공간", "대중교통 접근성"],
    seasonality: "low",
    competitionLevel: "high",
    investmentTips: [
      "비즈니스 여행객을 위한 업무 공간을 갖추세요",
      "영어 서비스를 강화하면 해외 관광객 유치에 유리합니다",
      "주변 맛집, 쇼핑 정보를 제공하면 게스트 만족도가 높아집니다",
    ],
  },
  {
    id: "hongdae",
    name: "홍대입구",
    district: "마포구",
    profitabilityScore: 7,
    stabilityScore: 6,
    growthPotentialScore: 8,
    managementEaseScore: 5,
    averageOccupancy: 80,
    averageDailyRate: 100000,
    averageMonthlyRent: 1200000,
    mainGuestTypes: ["젊은 관광객", "외국인 배낭여행객", "파티 여행객"],
    amenitiesImportance: ["엔터테인먼트 시설", "세탁 시설", "주변 나이트라이프"],
    seasonality: "medium",
    competitionLevel: "high",
    investmentTips: [
      "소음 차단 시설에 투자하세요 (주변이 시끄러울 수 있음)",
      "젊은 감각의 인테리어가 경쟁력이 됩니다",
      "주변 클럽, 바, 공연장 정보를 제공하면 좋습니다",
    ],
  },
  {
    id: "jongno",
    name: "종로",
    district: "종로구",
    profitabilityScore: 6,
    stabilityScore: 8,
    growthPotentialScore: 7,
    managementEaseScore: 7,
    averageOccupancy: 70,
    averageDailyRate: 90000,
    averageMonthlyRent: 1100000,
    mainGuestTypes: ["문화 관광객", "역사 탐방객", "중장년층 여행객"],
    amenitiesImportance: ["전통적 분위기", "관광 정보", "편안한 침구"],
    seasonality: "medium",
    competitionLevel: "medium",
    investmentTips: [
      "한국 전통 요소를 인테리어에 가미하면 차별화됩니다",
      "주변 고궁, 박물관 정보와 가이드북을 제공하세요",
      "조용하고 안락한 환경이 중요합니다",
    ],
  },
  {
    id: "itaewon",
    name: "이태원",
    district: "용산구",
    profitabilityScore: 7,
    stabilityScore: 5,
    growthPotentialScore: 8,
    managementEaseScore: 6,
    averageOccupancy: 72,
    averageDailyRate: 110000,
    averageMonthlyRent: 1300000,
    mainGuestTypes: ["외국인 장기 체류자", "파티 여행객", "다국적 관광객"],
    amenitiesImportance: ["다국어 서비스", "국제적 분위기", "다양한 음식점 접근성"],
    seasonality: "medium",
    competitionLevel: "high",
    investmentTips: [
      "다국어 안내 자료를 준비하세요",
      "국제적 감각의 인테리어가 선호됩니다",
      "주변 다국적 레스토랑, 바 정보를 제공하세요",
    ],
  },
  {
    id: "gangdong",
    name: "강동구",
    district: "강동구",
    profitabilityScore: 5,
    stabilityScore: 7,
    growthPotentialScore: 6,
    managementEaseScore: 8,
    averageOccupancy: 65,
    averageDailyRate: 80000,
    averageMonthlyRent: 900000,
    mainGuestTypes: ["장기 체류자", "가족 여행객", "비즈니스 출장객"],
    amenitiesImportance: ["주방 시설", "세탁 시설", "장기 숙박 편의성"],
    seasonality: "low",
    competitionLevel: "low",
    investmentTips: [
      "장기 숙박 할인을 제공하면 예약률을 높일 수 있습니다",
      "가족 친화적 시설(아기 침대, 장난감 등)을 갖추세요",
      "조용하고 안전한 환경을 강조하세요",
    ],
  },
  {
    id: "yeouido",
    name: "여의도",
    district: "영등포구",
    profitabilityScore: 7,
    stabilityScore: 8,
    growthPotentialScore: 7,
    managementEaseScore: 7,
    averageOccupancy: 68,
    averageDailyRate: 105000,
    averageMonthlyRent: 1250000,
    mainGuestTypes: ["비즈니스 출장객", "금융권 종사자", "장기 체류자"],
    amenitiesImportance: ["업무 공간", "고속 와이파이", "조용한 환경"],
    seasonality: "low",
    competitionLevel: "medium",
    investmentTips: [
      "비즈니스 친화적 시설(작업 공간, 프린터 등)을 갖추세요",
      "주중 예약이 주말보다 많은 특성을 고려하세요",
      "깔끔하고 모던한 인테리어가 선호됩니다",
    ],
  },
]

// 투자자 유형 정의
const investorTypes = [
  {
    id: "stable",
    name: "안정 추구형",
    description: "안정적인 수익과 낮은 리스크를 선호하는 투자자",
    weightProfitability: 0.2,
    weightStability: 0.5,
    weightGrowth: 0.1,
    weightManagement: 0.2,
  },
  {
    id: "balanced",
    name: "균형 추구형",
    description: "수익성과 안정성의 균형을 추구하는 투자자",
    weightProfitability: 0.3,
    weightStability: 0.3,
    weightGrowth: 0.2,
    weightManagement: 0.2,
  },
  {
    id: "growth",
    name: "성장 추구형",
    description: "높은 수익과 성장 잠재력을 중시하는 투자자",
    weightProfitability: 0.4,
    weightStability: 0.1,
    weightGrowth: 0.4,
    weightManagement: 0.1,
  },
  {
    id: "handsfree",
    name: "편의 추구형",
    description: "관리의 편의성과 안정적 수익을 중시하는 투자자",
    weightProfitability: 0.2,
    weightStability: 0.3,
    weightGrowth: 0.1,
    weightManagement: 0.4,
  },
]

export function LocationInvestmentScore() {
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [investorType, setInvestorType] = useState<string>("balanced")
  const [budget, setBudget] = useState<string>("150000000")
  const [results, setResults] = useState<any>(null)

  // 투자 점수 계산
  const calculateInvestmentScore = () => {
    if (!selectedLocation) return

    const location = locationData.find((loc) => loc.id === selectedLocation)
    if (!location) return

    const investor = investorTypes.find((inv) => inv.id === investorType)
    if (!investor) return

    // 투자자 유형에 따른 가중치 적용
    const weightedScore =
      (location.profitabilityScore * investor.weightProfitability +
        location.stabilityScore * investor.weightStability +
        location.growthPotentialScore * investor.weightGrowth +
        location.managementEaseScore * investor.weightManagement) *
      10 // 100점 만점으로 변환

    // 예산 적합성 계산 (스튜디오 기준 약 3000만원 초기 투자 가정)
    const budgetAmount = Number.parseFloat(budget)
    const estimatedInitialInvestment = 30000000
    const estimatedMonthlyExpenses = location.averageMonthlyRent + 500000 // 월세 + 기타 비용
    const estimatedMonthlyRevenue = location.averageDailyRate * 30 * (location.averageOccupancy / 100)
    const estimatedMonthlyProfit = estimatedMonthlyRevenue - estimatedMonthlyExpenses
    const estimatedAnnualProfit = estimatedMonthlyProfit * 12
    const estimatedROI = (estimatedAnnualProfit / estimatedInitialInvestment) * 100
    const estimatedPaybackPeriod = estimatedInitialInvestment / estimatedMonthlyProfit

    // 예산 적합성 점수 (100점 만점)
    const budgetFitScore = Math.min(
      100,
      (budgetAmount / (estimatedInitialInvestment + estimatedMonthlyExpenses * 6)) * 100,
    )

    // 경쟁 수준에 따른 점수 조정
    let competitionAdjustment = 0
    if (location.competitionLevel === "high") competitionAdjustment = -5
    else if (location.competitionLevel === "low") competitionAdjustment = 5

    // 계절성에 따른 점수 조정
    let seasonalityAdjustment = 0
    if (location.seasonality === "high") seasonalityAdjustment = -5
    else if (location.seasonality === "low") seasonalityAdjustment = 5

    // 최종 투자 점수 (100점 만점)
    const finalScore = Math.min(100, Math.max(0, weightedScore + competitionAdjustment + seasonalityAdjustment))

    // 투자 등급 결정
    let investmentGrade
    if (finalScore >= 85) investmentGrade = "A+"
    else if (finalScore >= 75) investmentGrade = "A"
    else if (finalScore >= 65) investmentGrade = "B+"
    else if (finalScore >= 55) investmentGrade = "B"
    else if (finalScore >= 45) investmentGrade = "C+"
    else investmentGrade = "C"

    // 투자 적합성 메시지
    let investmentMessage
    if (finalScore >= 75) {
      investmentMessage = "매우 적합한 투자처입니다. 높은 수익과 안정성이 기대됩니다."
    } else if (finalScore >= 60) {
      investmentMessage = "적합한 투자처입니다. 합리적인 수익과 안정성이 기대됩니다."
    } else if (finalScore >= 45) {
      investmentMessage = "보통 수준의 투자처입니다. 신중한 접근이 필요합니다."
    } else {
      investmentMessage = "투자 리스크가 높습니다. 다른 지역을 고려해보세요."
    }

    // 유사한 지역 추천
    const similarLocations = locationData
      .filter((loc) => loc.id !== selectedLocation)
      .map((loc) => {
        const similarity =
          Math.abs(loc.profitabilityScore - location.profitabilityScore) +
          Math.abs(loc.stabilityScore - location.stabilityScore) +
          Math.abs(loc.growthPotentialScore - location.growthPotentialScore) +
          Math.abs(loc.managementEaseScore - location.managementEaseScore)
        return { ...loc, similarity }
      })
      .sort((a, b) => a.similarity - b.similarity)
      .slice(0, 2)

    setResults({
      location,
      investor,
      weightedScore,
      finalScore,
      investmentGrade,
      investmentMessage,
      budgetFitScore,
      estimatedInitialInvestment,
      estimatedMonthlyExpenses,
      estimatedMonthlyRevenue,
      estimatedMonthlyProfit,
      estimatedAnnualProfit,
      estimatedROI,
      estimatedPaybackPeriod,
      similarLocations,
    })
  }

  // 지역별 투자 점수 비교
  const compareLocations = () => {
    const investor = investorTypes.find((inv) => inv.id === investorType)
    if (!investor) return []

    const comparedLocations = locationData
      .map((location) => {
        // 투자자 유형에 따른 가중치 적용
        const weightedScore =
          (location.profitabilityScore * investor.weightProfitability +
            location.stabilityScore * investor.weightStability +
            location.growthPotentialScore * investor.weightGrowth +
            location.managementEaseScore * investor.weightManagement) *
          10 // 100점 만점으로 변환

        // 경쟁 수준에 따른 점수 조정
        let competitionAdjustment = 0
        if (location.competitionLevel === "high") competitionAdjustment = -5
        else if (location.competitionLevel === "low") competitionAdjustment = 5

        // 계절성에 따른 점수 조정
        let seasonalityAdjustment = 0
        if (location.seasonality === "high") seasonalityAdjustment = -5
        else if (location.seasonality === "low") seasonalityAdjustment = 5

        // 최종 투자 점수 (100점 만점)
        const finalScore = Math.min(100, Math.max(0, weightedScore + competitionAdjustment + seasonalityAdjustment))

        // 투자 등급 결정
        let investmentGrade
        if (finalScore >= 85) investmentGrade = "A+"
        else if (finalScore >= 75) investmentGrade = "A"
        else if (finalScore >= 65) investmentGrade = "B+"
        else if (finalScore >= 55) investmentGrade = "B"
        else if (finalScore >= 45) investmentGrade = "C+"
        else investmentGrade = "C"

        // 예산 적합성 계산
        const budgetAmount = Number.parseFloat(budget)
        const estimatedInitialInvestment = 30000000
        const estimatedMonthlyExpenses = location.averageMonthlyRent + 500000
        const budgetFitScore = Math.min(
          100,
          (budgetAmount / (estimatedInitialInvestment + estimatedMonthlyExpenses * 6)) * 100,
        )

        return {
          ...location,
          finalScore,
          investmentGrade,
          budgetFitScore,
        }
      })
      .sort((a, b) => b.finalScore - a.finalScore)

    return comparedLocations
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          지역 투자 점수 시스템
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!results ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">지역 선택</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="지역을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationData.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.district})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="investorType">투자자 유형</Label>
                  <Select value={investorType} onValueChange={setInvestorType}>
                    <SelectTrigger id="investorType">
                      <SelectValue placeholder="투자자 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {investorTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investorTypes.find((t) => t.id === investorType)?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">총 투자 예산</Label>
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
                  <p className="text-xs text-muted-foreground mt-1">초기 셋업 비용과 운영 자금을 포함한 총 예산</p>
                </div>

                <Button onClick={calculateInvestmentScore} className="w-full mt-6" disabled={!selectedLocation}>
                  투자 점수 분석하기
                </Button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">지역별 투자 점수 비교</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">지역</th>
                      <th className="text-center py-2">투자 점수</th>
                      <th className="text-center py-2">등급</th>
                      <th className="text-center py-2">예약률</th>
                      <th className="text-right py-2">일일 가격</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareLocations()?.map((location, index) => (
                      <tr
                        key={location.id}
                        className={`border-b ${index === 0 ? "bg-primary/10" : ""}`}
                        onClick={() => setSelectedLocation(location.id)}
                      >
                        <td className="py-2 cursor-pointer">
                          {location.name}
                          {index === 0 && (
                            <Badge variant="outline" className="ml-2 bg-primary/20 text-primary">
                              최고점
                            </Badge>
                          )}
                        </td>
                        <td className="text-center py-2">{Math.round(location.finalScore)}</td>
                        <td className="text-center py-2">{location.investmentGrade}</td>
                        <td className="text-center py-2">{location.averageOccupancy}%</td>
                        <td className="text-right py-2">₩{location.averageDailyRate.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">지역을 클릭하면 해당 지역을 선택할 수 있습니다.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">
                    {results.location.name} ({results.location.district})
                  </h3>
                  <p className="text-sm text-muted-foreground">투자자 유형: {results.investor.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{Math.round(results.finalScore)}</div>
                  <div className="text-sm text-muted-foreground">투자 점수</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">투자 등급</h3>
                  <p className="text-2xl font-bold">{results.investmentGrade}</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">예상 연간 ROI</h3>
                  <p className="text-2xl font-bold">{results.estimatedROI.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">평균 예약률</h3>
                  <p className="text-2xl font-bold">{results.location.averageOccupancy}%</p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">월 예상 수익</h3>
                  <p className="text-2xl font-bold">₩{Math.round(results.estimatedMonthlyProfit).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="financial">재무 분석</TabsTrigger>
                <TabsTrigger value="market">시장 분석</TabsTrigger>
                <TabsTrigger value="recommendations">추천 사항</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">투자 적합성 평가</h3>
                    <div className="p-3 rounded-lg bg-primary/5 mb-3">
                      <p className="font-medium">{results.investmentMessage}</p>
                    </div>

                    <h4 className="font-medium mt-4 mb-2">지역 특성 점수</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>수익성</span>
                            <span>{results.location.profitabilityScore}/10</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${results.location.profitabilityScore * 10}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>안정성</span>
                            <span>{results.location.stabilityScore}/10</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${results.location.stabilityScore * 10}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>성장 잠재력</span>
                            <span>{results.location.growthPotentialScore}/10</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${results.location.growthPotentialScore * 10}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm">
                            <span>관리 용이성</span>
                            <span>{results.location.managementEaseScore}/10</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${results.location.managementEaseScore * 10}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">예산 적합성</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>예산 적합도</span>
                          <span>{Math.round(results.budgetFitScore)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              results.budgetFitScore >= 80
                                ? "bg-green-500"
                                : results.budgetFitScore >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${results.budgetFitScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-muted-foreground">예상 초기 투자 비용</p>
                          <p className="font-medium">₩{results.estimatedInitialInvestment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">월 운영 비용</p>
                          <p className="font-medium">₩{results.estimatedMonthlyExpenses.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mt-2">
                        <p className="text-sm text-blue-700">
                          {results.budgetFitScore >= 80
                            ? "설정한 예산으로 충분히 투자와 운영이 가능합니다."
                            : results.budgetFitScore >= 50
                              ? "설정한 예산으로 투자는 가능하나, 여유 자금을 더 확보하는 것이 좋습니다."
                              : "설정한 예산으로는 투자와 운영이 어려울 수 있습니다. 예산을 늘리거나 다른 지역을 고려하세요."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">수익 분석</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">월 예상 수입</span>
                        <span className="font-medium">
                          ₩{Math.round(results.estimatedMonthlyRevenue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">월 예상 지출</span>
                        <span className="font-medium text-red-500">
                          -₩{results.estimatedMonthlyExpenses.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-px bg-border my-2"></div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">월 순이익</span>
                        <span className="font-medium text-green-600">
                          ₩{Math.round(results.estimatedMonthlyProfit).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">연간 순이익</span>
                        <span className="font-medium text-green-600">
                          ₩{Math.round(results.estimatedAnnualProfit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">투자 수익률 분석</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">초기 투자 비용</span>
                        <span className="font-medium">₩{results.estimatedInitialInvestment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">연간 ROI</span>
                        <span className="font-medium">{results.estimatedROI.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">투자금 회수 기간</span>
                        <span className="font-medium">{results.estimatedPaybackPeriod.toFixed(1)} 개월</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 mt-4">
                      <h4 className="font-medium text-green-800 mb-1">투자 인사이트</h4>
                      <p className="text-sm text-green-700">
                        {results.estimatedROI >= 20
                          ? "매우 높은 ROI를 기대할 수 있는 투자처입니다. 경쟁이 치열할 수 있으니 빠른 진입을 고려하세요."
                          : results.estimatedROI >= 15
                            ? "좋은 수익률을 기대할 수 있는 투자처입니다. 일반적인 금융 상품보다 높은 수익이 예상됩니다."
                            : "적정 수준의 ROI를 제공하는 투자처입니다. 안정적인 운영이 중요합니다."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">장기 수익 전망</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">1년 후 누적 수익</span>
                        <span className="font-medium">
                          ₩{Math.round(results.estimatedAnnualProfit).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">2년 후 누적 수익</span>
                        <span className="font-medium">
                          ₩{Math.round(results.estimatedAnnualProfit * 2).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">3년 후 누적 수익</span>
                        <span className="font-medium">
                          ₩{Math.round(results.estimatedAnnualProfit * 3).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">5년 후 누적 수익</span>
                        <span className="font-medium">
                          ₩{Math.round(results.estimatedAnnualProfit * 5).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">시장 특성</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">경쟁 수준</p>
                        <p className="font-medium">
                          {results.location.competitionLevel === "high"
                            ? "높음"
                            : results.location.competitionLevel === "medium"
                              ? "중간"
                              : "낮음"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">계절성</p>
                        <p className="font-medium">
                          {results.location.seasonality === "high"
                            ? "높음"
                            : results.location.seasonality === "medium"
                              ? "중간"
                              : "낮음"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">주요 게스트 유형</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {results.location.mainGuestTypes.map((type: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-primary/5">
                          {type}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="font-semibold mb-3 mt-4">중요한 편의시설</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.location.amenitiesImportance.map((amenity: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">유사한 지역 비교</h3>
                    <div className="space-y-4">
                      {results.similarLocations.map((location: any) => (
                        <div key={location.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                {location.name} ({location.district})
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                예약률 {location.averageOccupancy}% | 일일 ₩{location.averageDailyRate.toLocaleString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedLocation(location.id)}>
                              분석하기
                            </Button>
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
                    <h3 className="font-semibold mb-3">투자 팁</h3>
                    <ul className="space-y-2">
                      {results.location.investmentTips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">운영 전략 제안</h3>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-1">가격 책정 전략</h4>
                        <p className="text-sm text-blue-700">
                          {results.location.averageOccupancy > 75
                            ? "예약률이 높은 지역으로, 현재 시세보다 5-10% 높게 가격을 책정해도 경쟁력이 있습니다."
                            : results.location.averageOccupancy > 60
                              ? "적정 수준의 예약률을 보이는 지역으로, 시세에 맞춰 가격을 책정하되 주말에는 10-15% 할증을 고려하세요."
                              : "예약률이 다소 낮은 지역으로, 초기에는 시세보다 5-10% 낮게 가격을 책정하여 리뷰를 쌓는 전략이 효과적입니다."}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <h4 className="font-medium text-amber-800 mb-1">마케팅 포인트</h4>
                        <p className="text-sm text-amber-700">
                          이 지역의 주요 게스트({results.location.mainGuestTypes[0]},{" "}
                          {results.location.mainGuestTypes[1]})를 타겟팅하여 그들이 중요시하는{" "}
                          {results.location.amenitiesImportance[0]}와(과)
                          {results.location.amenitiesImportance[1]}을(를) 강조하는 리스팅을 작성하세요.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <h4 className="font-medium text-green-800 mb-1">장기적 성장 전략</h4>
                        <p className="text-sm text-green-700">
                          {results.location.growthPotentialScore >= 8
                            ? "높은 성장 잠재력을 가진 지역으로, 장기적 관점에서 추가 투자를 고려해볼 만합니다."
                            : results.location.growthPotentialScore >= 6
                              ? "적정 수준의 성장 잠재력을 가진 지역으로, 안정적인 운영에 집중하세요."
                              : "성장 잠재력이 제한적인 지역으로, 현재의 수익성에 집중하고 과도한 추가 투자는 신중히 검토하세요."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setResults(null)}>
                다시 분석하기
              </Button>
              <Button>결과 저장하기</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
