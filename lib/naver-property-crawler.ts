import * as cheerio from "cheerio"
import type { NaverPropertyData } from "@/lib/types"

/**
 * 네이버 부동산 데이터를 크롤링하는 함수
 * @param propertyId 네이버 부동산 ID (URL에서 complexes/ 뒤에 오는 숫자)
 * @returns 크롤링된 네이버 부동산 데이터
 */
export async function crawlNaverPropertyData(propertyId: string): Promise<NaverPropertyData | null> {
  try {
    // 네이버 부동산 URL
    const url = `https://new.land.naver.com/complexes/${propertyId}?ms=37.524418,126.929965,17&a=OPST&b=B2&e=RETAIL`

    // 웹사이트 데이터 가져오기
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`네이버 부동산 크롤링 실패: ${response.status} ${response.statusText}`)
      return null
    }

    const html = await response.text()

    // cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(html)

    // 데이터 추출 (실제 구현은 네이버 부동산 웹사이트 구조에 따라 달라질 수 있음)
    // 이 예제는 가상의 구조를 가정한 것입니다.
    const totalCount =
      Number.parseInt(
        $(".article_count")
          .text()
          .trim()
          .replace(/[^0-9]/g, ""),
        10,
      ) || 0

    // 보증금 추출
    const depositText = $(".price_info .deposit").text().trim()
    const averageDeposit = parseNaverPrice(depositText)

    // 월세 추출
    const monthlyRentText = $(".price_info .monthly_rent").text().trim()
    const averageMonthlyRent = parseNaverPrice(monthlyRentText)

    // 관리비 추출
    const maintenanceFeeText = $(".price_info .maintenance_fee").text().trim()
    const averageMaintenanceFee = parseNaverPrice(maintenanceFeeText)

    // 건물 유형 추출
    const buildingTypes: string[] = []
    $(".building_type li").each((_, el) => {
      buildingTypes.push($(el).text().trim())
    })

    // 매물 정보 추출
    const articles: any[] = []
    $(".article_item").each((_, el) => {
      const id = $(el).attr("data-id") || ""
      const name = $(el).find(".article_name").text().trim()
      const propertyType = $(el).find(".property_type").text().trim()
      const depositText = $(el).find(".deposit").text().trim()
      const deposit = parseNaverPrice(depositText)
      const monthlyRentText = $(el).find(".monthly_rent").text().trim()
      const monthlyRent = parseNaverPrice(monthlyRentText)
      const maintenanceFeeText = $(el).find(".maintenance_fee").text().trim()
      const maintenanceFee = parseNaverPrice(maintenanceFeeText)
      const floor = $(el).find(".floor").text().trim()
      const sizeText = $(el).find(".size").text().trim()
      const size = sizeText
      const sizePyeong = parseNaverPyeong(sizeText)
      const direction = $(el).find(".direction").text().trim()

      articles.push({
        id,
        name,
        property_type: propertyType,
        deposit,
        monthly_rent: monthlyRent,
        maintenance_fee: maintenanceFee,
        floor,
        size,
        size_pyeong: sizePyeong,
        direction,
      })
    })

    // 결과 데이터 구성
    const naverPropertyData: NaverPropertyData = {
      property_id: propertyId,
      total_count: totalCount,
      average_deposit: averageDeposit,
      average_monthly_rent: averageMonthlyRent,
      average_maintenance_fee: averageMaintenanceFee,
      min_deposit: Math.min(...articles.map((a) => a.deposit).filter((d) => d > 0)),
      min_monthly_rent: Math.min(...articles.map((a) => a.monthly_rent).filter((r) => r > 0)),
      min_maintenance_fee: Math.min(...articles.map((a) => a.maintenance_fee).filter((f) => f > 0)),
      buildings: buildingTypes,
      articles,
      property_types: {
        APT: articles.filter((a) => a.property_type === "APT").length,
        OPST: articles.filter((a) => a.property_type === "OPST").length,
        other: articles.filter((a) => !["APT", "OPST"].includes(a.property_type)).length,
        total: articles.length,
      },
      crawled_at: new Date().toISOString(),
      is_manually_edited: false,
    }

    return naverPropertyData
  } catch (error) {
    console.error("네이버 부동산 크롤링 오류:", error)
    return null
  }
}

/**
 * 네이버 부동산 가격 텍스트를 숫자로 변환하는 함수
 * @param priceText 가격 텍스트 (예: "1억 5,000만원", "500만원", "45만원")
 * @returns 숫자로 변환된 가격 (단위: 원)
 */
function parseNaverPrice(priceText: string): number {
  try {
    // 숫자만 추출
    const numericText = priceText.replace(/[^0-9]/g, "")
    if (!numericText) return 0

    // 억, 만 단위 처리
    if (priceText.includes("억") && priceText.includes("만")) {
      const parts = priceText.split("억")
      const billionPart = Number.parseInt(parts[0].replace(/[^0-9]/g, ""), 10) || 0
      const millionPart = Number.parseInt(parts[1].replace(/[^0-9]/g, ""), 10) || 0
      return billionPart * 100000000 + millionPart * 10000
    } else if (priceText.includes("억")) {
      const billionPart = Number.parseInt(priceText.replace(/[^0-9]/g, ""), 10) || 0
      return billionPart * 100000000
    } else if (priceText.includes("만")) {
      const millionPart = Number.parseInt(priceText.replace(/[^0-9]/g, ""), 10) || 0
      return millionPart * 10000
    }

    // 단순 숫자인 경우
    return Number.parseInt(numericText, 10) || 0
  } catch (error) {
    console.error("가격 파싱 오류:", error, priceText)
    return 0
  }
}

/**
 * 네이버 부동산 평수 텍스트를 숫자로 변환하는 함수
 * @param sizeText 평수 텍스트 (예: "24평", "24.5평")
 * @returns 숫자로 변환된 평수
 */
function parseNaverPyeong(sizeText: string): number {
  try {
    // 평 단위 추출
    const match = sizeText.match(/(\d+(\.\d+)?)평/)
    if (match && match[1]) {
      return Number.parseFloat(match[1])
    }
    return 0
  } catch (error) {
    console.error("평수 파싱 오류:", error, sizeText)
    return 0
  }
}
