import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// 호스트 프로필 인터페이스
interface HostSituation {
  ageGroup?: "20대" | "30대" | "40대" | "50대" | "60대이상"
  gender?: "남성" | "여성"
  budget?: "500만원 이하" | "500-1000만원" | "1000-2000만원" | "2000-3000만원" | "3000-5000만원" | "5000만원 이상"
}

// 1. 시장 데이터 요약 부분을 생성하는 함수 (analysisData가 있을 때)
function createMarketDataSection(analysisData: any): string {
  return `# ${analysisData.location} 지역 단기임대 시장 분석 데이터

## 1. 기본 통계
- **총 매물 수**: ${analysisData.roomCount}개
- **평균 주간 가격**: ${analysisData.avgWeeklyPrice.toLocaleString()}원
- **평균 예약률**: ${analysisData.avgOccupancyRate}%
- **최고 주간 가격**: ${analysisData.maxPrice.toLocaleString()}원
- **최저 주간 가격**: ${analysisData.minPrice.toLocaleString()}원
- **최고 예약률**: ${analysisData.maxOccupancy}%
- **최저 예약률**: ${analysisData.minOccupancy}%

## 2. 건물 유형별 분포 및 성과
${Object.entries(analysisData.buildingTypeStats)
  .map(
    ([type, stats]: [string, any]) =>
      `- **${type}**: ${stats.count}개 (${Math.round((stats.count / analysisData.roomCount) * 100)}%)
  - 평균 가격: ${stats.avgPrice.toLocaleString()}원
  - 평균 예약률: ${stats.avgOccupancy}%`,
  )
  .join("\n\n")}

## 3. 방 유형별 분포 및 성과
${Object.entries(analysisData.roomTypeStats)
  .map(
    ([type, stats]: [string, any]) =>
      `- **${type}**: ${stats.count}개 (${Math.round((stats.count / analysisData.roomCount) * 100)}%)
  - 평균 가격: ${stats.avgPrice.toLocaleString()}원
  - 평균 예약률: ${stats.avgOccupancy}%`,
  )
  .join("\n\n")}

## 4. 가격대별 분포 및 예약률
${Object.entries(analysisData.priceRanges)
  .filter(([_, stats]: [string, any]) => stats.count > 0)
  .map(
    ([range, stats]: [string, any]) =>
      `- **${range}**: ${stats.count}개 (${Math.round((stats.count / analysisData.roomCount) * 100)}%)
  - 평균 예약률: ${stats.avgOccupancy}%`,
  )
  .join("\n\n")}

## 5. 평형대별 분포 및 성과
${Object.entries(analysisData.sizeRanges)
  .filter(([_, stats]: [string, any]) => stats.count > 0)
  .map(
    ([range, stats]: [string, any]) =>
      `- **${range}**: ${stats.count}개 (${Math.round((stats.count / analysisData.roomCount) * 100)}%)
  - 평균 가격: ${stats.avgPrice.toLocaleString()}원
  - 평균 예약률: ${stats.avgOccupancy}%`,
  )
  .join("\n\n")}

## 6. 인기 편의시설 TOP 10
${analysisData.topAmenities
  .map(
    (amenity: any, idx: number) => `${idx + 1}. **${amenity.name}**: ${amenity.count}개 숙소 (${amenity.percentage}%)`,
  )
  .join("\n")}

## 7. 예약률이 높은 상위 5개 숙소
${analysisData.topByOccupancy
  .map(
    (prop: any, idx: number) =>
      `${idx + 1}. **${prop.name}**: ${prop.weekly_price.toLocaleString()}원, 예약률 ${prop.occupancy_rate}%, ${prop.size_m2}㎡, ${prop.building_type}`,
  )
  .join("\n")}

## 8. 수익성이 높은 상위 5개 숙소
${analysisData.topByRevenue
  .map(
    (prop: any, idx: number) =>
      `${idx + 1}. **${prop.name}**: ${prop.weekly_price.toLocaleString()}원, 예약률 ${prop.occupancy_rate}%, 월 예상 수익 ${prop.estimated_revenue.toLocaleString()}원`,
  )
  .join("\n")}`
}

// 2. 간단한 숙소 데이터 요약 (rooms만 있을 때)
function createSimpleDataSection(rooms: any[], location: string): string {
  const roomsData = rooms
    .map(
      (room, idx) =>
        `${idx + 1}. **${room.name}** (${room.address})
   - 주간 가격: ${room.weekly_price?.toLocaleString() || "정보없음"}원
   - 예약률: ${room.occupancy_rate || "정보없음"}%
   - 건물 유형: ${room.building_type || "정보없음"}
   - 평형: ${room.size_pyeong || room.size_m2 || "정보없음"}${room.size_pyeong ? "평" : "㎡"}`,
    )
    .join("\n\n")

  return `# ${location} 지역 단기임대 숙소 데이터

## 분석 대상 숙소 목록 (총 ${rooms.length}개)
${roomsData}`
}

// 3. 호스트 프로필 분석 부분을 생성하는 함수
function createHostProfileSection(hostSituation?: HostSituation): string {
  if (!hostSituation || (!hostSituation.ageGroup && !hostSituation.gender && !hostSituation.budget)) {
    return `## 호스트 프로필 분석
- **호스트 유형**: 일반 호스트
- **투자 예산**: 1000만원 이하 (보증금 포함)
- **호스트 특성**: 기본 분석으로 진행`
  }

  const situationParts = [hostSituation.ageGroup, hostSituation.gender].filter(Boolean)
  const hostProfile = situationParts.length > 0 ? situationParts.join(" ") : "맞춤"
  const budgetInfo = hostSituation.budget || "1000만원 이하"

  const characteristics = []

  // 연령대별 특성
  if (hostSituation.ageGroup) {
    switch (hostSituation.ageGroup) {
      case "20대":
        characteristics.push("SNS 마케팅과 트렌드에 민감한 세대, 디지털 네이티브")
        break
      case "30대":
        characteristics.push("체계적이고 안정적인 운영 선호, 중장기 투자 관점")
        break
      case "40대":
        characteristics.push("풍부한 사회경험과 안정적인 투자 성향, 신뢰성 중시")
        break
      case "50대":
        characteristics.push("품질 중심의 운영과 장기적 관계 구축에 강점, 충분한 자본력")
        break
      case "60대이상":
        characteristics.push("개인적 관심사와 연계한 특색있는 운영 가능, 풍부한 인생경험")
        break
    }
  }

  // 성별별 특성
  if (hostSituation.gender) {
    if (hostSituation.gender === "남성") {
      characteristics.push("효율성과 수익성 중심의 체계적 접근 선호, 데이터 기반 의사결정")
    } else {
      characteristics.push("안전성과 편안함을 중시하는 세심한 관리 선호, 감성적 터치")
    }
  }

  // 예산별 특성
  if (hostSituation.budget) {
    switch (hostSituation.budget) {
      case "500만원 이하":
        characteristics.push("소규모 투자로 최대 효과를 내는 전략 필요")
        break
      case "500-1000만원":
        characteristics.push("중소규모 투자로 균형잡힌 수익 추구")
        break
      case "1000-2000만원":
        characteristics.push("중규모 투자로 프리미엄 요소 도입 가능")
        break
      case "2000-3000만원":
        characteristics.push("중대규모 투자로 차별화된 컨셉 구현 가능")
        break
      case "3000-5000만원":
        characteristics.push("대규모 투자로 럭셔리 세그먼트 진입 가능")
        break
      case "5000만원 이상":
        characteristics.push("최고급 투자로 프리미엄 브랜드 구축 가능")
        break
    }
  }

  return `## 호스트 프로필 분석
- **호스트 유형**: ${hostProfile} 호스트
- **투자 예산**: ${budgetInfo} (보증금 포함)
- **호스트 특성**: ${characteristics.join(", ")}`
}

// 4. 최종 프롬프트를 생성하는 함수
function createFinalPrompt(
  dataSection: string,
  hostProfileSection: string,
  location: string,
  customPrompt?: string,
): string {
  const basePrompt = `${dataSection}

---

${hostProfileSection}

---

# 최종 분석 요청사항

당신은 대한민국 숙박업 시장 최고의 데이터 분석가이자 컨설턴트입니다.

위의 **시장 분석 데이터**와 **호스트 프로필**을 바탕으로, 아래 두 부분으로 구성된 전문적인 컨설팅 보고서를 작성해주세요.

## Part 1: ${location} 시장 종합 분석 보고서

1. **시장 트렌드**: 데이터를 기반으로 ${location} 단기임대 시장의 주요 특징과 트렌드를 요약해주세요.

2. **성공 전략**: 어떤 유형(건물, 가격대, 평형)의 숙소가 높은 예약률과 수익을 보이는지 분석하고, 성공적인 숙소의 공통점을 도출해주세요.

3. **투자 가이드**: 이 지역에 새로 진입하는 호스트를 위한 필수 편의시설, 적정 가격 책정 전략 등 실질적인 투자 가이드를 제시해주세요.

## Part 2: 호스트 맞춤형 숙소 컨셉 추천 (5가지)

**중요**: 먼저 ${location} 지역의 실제 특성을 검색하여 파악해주세요:
- 지역의 역사적/문화적 특징
- 주요 관광지, 명소, 축제
- 지역 특산품, 음식문화
- 교통 허브, 대학, 기업체
- 지역민들의 라이프스타일
- 계절별 특색 이벤트

위 정보를 바탕으로 **호스트 프로필(특성, 예산)에 최적화된** 5가지 컨셉을 제안해주세요:

### 컨셉 1-2: 기본 컨셉 (안정적이고 검증된 방향)
- 일반적이지만 확실한 수익성을 보장하는 컨셉

### 컨셉 3-5: 특색 컨셉 (지역 특성 활용한 창의적 방향)
- ${location} 지역만의 독특한 특성을 활용한 차별화된 컨셉
- 지역 문화, 역사, 특산품, 명소 등을 적극 활용
- 다른 지역에서는 구현하기 어려운 독창적인 아이디어

각 컨셉은 아래 항목을 반드시 포함해야 합니다:

1. **컨셉명 및 핵심 아이디어**: (창의적이고 기억에 남는 네이밍)
2. **타겟 고객**: (구체적인 페르소나)
3. **인테리어/차별화 방안**: (호스트의 예산 범위 내에서 실행 가능한 구체적 아이디어)
4. **마케팅 및 운영 전략**: (호스트의 특성을 활용한 실질적 방안)
5. **기대효과 및 성공 가능성**: (구체적인 수치와 근거)
6. **지역 특성 활용도**: (해당 지역에서만 가능한 요소들)

**특히 컨셉 3-5는 반드시 ${location} 지역의 고유한 특성을 깊이 있게 활용하여, 다른 지역에서는 절대 따라할 수 없는 독창적인 아이디어를 제시해주세요.**

전문가의 시각으로, 데이터에 근거하면서도 창의적이고 실현 가능한 인사이트를 담아주세요.`

  if (customPrompt) {
    return `${dataSection}

---

${hostProfileSection}

---

# 사용자 요청사항
${customPrompt}

---

위의 **시장 분석 데이터**와 **호스트 프로필**을 참고하여 사용자의 요청사항에 대해 전문가로서 답변해주세요.`
  }

  return basePrompt
}

// 메인 POST 함수
export async function POST(request: NextRequest) {
  try {
    console.log("AI 분석 요약 API 호출 시작")

    const { location, rooms, analysisData, hostSituation, customPrompt } = await request.json()

    console.log("요청 데이터:", {
      location,
      roomsCount: rooms?.length || 0,
      hasAnalysisData: !!analysisData,
      hostSituation,
      hasCustomPrompt: !!customPrompt,
    })

    if (!location) {
      return NextResponse.json({ error: "위치 정보가 필요합니다." }, { status: 400 })
    }

    let dataSection: string

    // analysisData가 있으면 상세 분석, 없으면 간단 분석
    if (analysisData) {
      // 1. 상세 시장 데이터 섹션 생성
      dataSection = createMarketDataSection(analysisData)
    } else if (rooms && rooms.length > 0) {
      // 2. 간단한 숙소 데이터 섹션 생성
      dataSection = createSimpleDataSection(rooms, location)
    } else {
      return NextResponse.json({ error: "분석할 데이터가 없습니다." }, { status: 400 })
    }

    // 3. 호스트 프로필 섹션 생성
    const hostProfileSection = createHostProfileSection(hostSituation)

    // 4. 최종 프롬프트 생성
    const finalPrompt = createFinalPrompt(dataSection, hostProfileSection, location, customPrompt)

    const systemMessage =
      "당신은 단기임대 플랫폼의 데이터 분석가 및 운영 전문가입니다. 실시간 검색 기능을 활용하여 해당 지역의 최신 정보를 파악하고, 데이터를 기반으로 객관적이고 통찰력 있는 분석을 제공하세요. 특히 지역의 고유한 특성을 깊이 있게 조사하여 창의적이고 실현 가능한 맞춤형 인사이트를 제공하고, 마크다운 형식으로 명확하고 깔끔하게 응답하세요."

    console.log("OpenAI API 호출 시작...")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemMessage,
      prompt: finalPrompt,
      temperature: 0.8, // 창의성을 위해 약간 높임
      maxTokens: 5000, // 더 상세한 분석을 위해 증가
    })

    if (!text || text.trim().length === 0) {
      console.error("OpenAI에서 빈 응답을 받음")
      return NextResponse.json({ error: "AI에서 빈 응답을 받았습니다." }, { status: 500 })
    }

    console.log("AI 분석 성공, 텍스트 길이:", text.length)
    return NextResponse.json({ summary: text })
  } catch (error: any) {
    console.error("AI 분석 오류:", error)

    // 기존 에러 처리 로직 유지
    const isQuotaError =
      error.message &&
      (error.message.includes("quota") || error.message.includes("exceeded") || error.message.includes("billing"))

    if (isQuotaError) {
      return NextResponse.json({ error: "OpenAI API 할당량이 초과되었습니다.", isQuotaError: true }, { status: 402 })
    }

    return NextResponse.json({ error: "요약 생성 중 오류가 발생했습니다: " + error.message }, { status: 500 })
  }
}
