import type { Room } from "./types"

// 시/도 키워드
const CITY_KEYWORDS = ["특별시", "광역시", "특별자치시", "특별자치도", "도"]

// 구/군 키워드
const DISTRICT_KEYWORDS = ["구", "군", "시"]

// 동/읍/면 키워드 (가 추가)
const NEIGHBORHOOD_KEYWORDS = ["동", "읍", "면", "리", "가"]

// 제외할 키워드 (건물명 등)
const EXCLUDE_KEYWORDS = [
  "A동",
  "B동",
  "C동",
  "D동",
  "E동",
  "1동",
  "2동",
  "3동",
  "4동",
  "5동",
  "6동",
  "7동",
  "8동",
  "9동",
  "101동",
  "102동",
  "103동",
  "104동",
  "105동",
  "106동",
  "107동",
  "108동",
  "109동",
  "110동",
  "111동",
  "112동",
  "113동",
  "114동",
  "115동",
]

// 시/도 매핑 테이블 (구 명칭 -> 새 명칭)
const CITY_MAPPING: Record<string, string> = {
  강원도: "강원특별자치도",
  전라북도: "전북특별자치도", // 향후 변경 대비
  전라남도: "전라남도",
  경상북도: "경상북도",
  경상남도: "경상남도",
  충청북도: "충청북도",
  충청남도: "충청남도",
}

export interface ParsedAddress {
  city: string
  district: string
  neighborhood: string
  fullAddress: string
}

export interface RegionGroup {
  city: string
  district: string
  neighborhood: string
  properties: Room[]
  newCount: number
  updateCount: number
}

export interface ValidationResult {
  valid: Array<Room & { parsedAddress: ParsedAddress }>
  invalid: Array<Room & { error: string }>
  summary: {
    total: number
    valid: number
    invalid: number
  }
}

// 주소 파싱 함수
export function parseAddress(address: string): ParsedAddress | null {
  if (!address || typeof address !== "string") {
    return null
  }

  const cleanAddress = address.trim()

  try {
    // 시/도 추출 (더 정확한 매칭을 위해 개선)
    let city = ""

    // 1. 정확한 키워드 매칭
    for (const keyword of CITY_KEYWORDS) {
      const regex = new RegExp(`([가-힣]+${keyword})`)
      const match = cleanAddress.match(regex)
      if (match) {
        let foundCity = match[1]

        // 매핑 테이블 적용 (구 명칭을 새 명칭으로 변환)
        if (CITY_MAPPING[foundCity]) {
          foundCity = CITY_MAPPING[foundCity]
        }

        city = foundCity
        break
      }
    }

    // 2. 특별한 경우 처리 (강원특별자치도 등)
    if (!city) {
      if (cleanAddress.includes("강원특별자치도") || cleanAddress.includes("강원도")) {
        city = "강원특별자치도"
      } else if (cleanAddress.includes("제주특별자치도") || cleanAddress.includes("제주도")) {
        city = "제주특별자치도"
      } else if (cleanAddress.includes("세종특별자치시") || cleanAddress.includes("세종시")) {
        city = "세종특별자치시"
      }
    }

    if (!city) return null

    // 시/도 이후 부분 추출 (원본 주소에서 찾은 시/도명 기준)
    let afterCity = ""
    if (cleanAddress.includes(city)) {
      afterCity = cleanAddress.split(city)[1]?.trim()
    } else {
      // 매핑된 경우 원본 명칭으로도 시도
      const originalCity = Object.keys(CITY_MAPPING).find((key) => CITY_MAPPING[key] === city)
      if (originalCity && cleanAddress.includes(originalCity)) {
        afterCity = cleanAddress.split(originalCity)[1]?.trim()
      }
    }

    if (!afterCity) return null

    // 구/군 추출
    let district = ""
    for (const keyword of DISTRICT_KEYWORDS) {
      const regex = new RegExp(`([가-힣]+${keyword})`)
      const match = afterCity.match(regex)
      if (match) {
        district = match[1]
        break
      }
    }

    // 구/군 이후 부분 추출
    const afterDistrict = district ? afterCity.split(district)[1]?.trim() : afterCity

    // 동/읍/면 추출 (제외 키워드 필터링)
    let neighborhood = ""

    // 숫자+가 패턴 (을지로5가, 회현동2가 등)
    const numberGaMatch = afterDistrict?.match(/([가-힣]+\d+가)/)
    if (numberGaMatch) {
      const candidate = numberGaMatch[1]
      if (!EXCLUDE_KEYWORDS.includes(candidate)) {
        neighborhood = candidate
      }
    }

    // 일반 동/읍/면/리/가 패턴
    if (!neighborhood) {
      for (const keyword of NEIGHBORHOOD_KEYWORDS) {
        const regex = new RegExp(`([가-힣]+${keyword})`)
        const matches = afterDistrict?.match(new RegExp(regex.source, "g")) || []

        for (const match of matches) {
          // 제외 키워드 체크
          if (!EXCLUDE_KEYWORDS.includes(match)) {
            // 알파벳+숫자+동 패턴 제외 (A동, B동, 101동 등)
            if (!/^[A-Z]?\d*동$/.test(match)) {
              neighborhood = match
              break
            }
          }
        }

        if (neighborhood) break
      }
    }

    // 구/군이 없는 경우 (특별시 등)
    if (!district && city.includes("특별시")) {
      // 시/도 바로 다음에 오는 구 찾기
      const districtMatch = afterCity.match(/([가-힣]+구)/)
      if (districtMatch) {
        district = districtMatch[1]
      }
    }

    return {
      city: city || "",
      district: district || "",
      neighborhood: neighborhood || "",
      fullAddress: cleanAddress,
    }
  } catch (error) {
    console.error("주소 파싱 오류:", error, "주소:", address)
    return null
  }
}

// 주소 검증 함수
export function validateParsedAddresses(rooms: Room[]): ValidationResult {
  const valid: Array<Room & { parsedAddress: ParsedAddress }> = []
  const invalid: Array<Room & { error: string }> = []

  rooms.forEach((room) => {
    const address = room.address || ""
    const parsed = parseAddress(address)

    if (parsed && parsed.city && (parsed.district || parsed.neighborhood)) {
      valid.push({
        ...room,
        parsedAddress: parsed,
      })
    } else {
      invalid.push({
        ...room,
        error: parsed ? "불완전한 주소 정보" : "주소 파싱 실패",
      })
    }
  })

  return {
    valid,
    invalid,
    summary: {
      total: rooms.length,
      valid: valid.length,
      invalid: invalid.length,
    },
  }
}

// 지역별 그룹화 함수
export function groupByRegion(
  rooms: Array<Room & { parsedAddress: ParsedAddress }>,
  selectedCity: string,
): RegionGroup[] {
  const groups = new Map<string, Room[]>()

  rooms.forEach((room) => {
    const { city, district, neighborhood } = room.parsedAddress

    // 선택된 시/도와 일치하는지 확인 (매핑 고려)
    let isMatch = city === selectedCity

    // 매핑된 경우도 고려
    if (!isMatch) {
      const originalCity = Object.keys(CITY_MAPPING).find((key) => CITY_MAPPING[key] === selectedCity)
      if (originalCity && city === originalCity) {
        isMatch = true
      }
    }

    if (isMatch) {
      const key = `${district}|${neighborhood}`

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(room)
    }
  })

  return Array.from(groups.entries()).map(([key, properties]) => {
    const [district, neighborhood] = key.split("|")
    return {
      city: selectedCity,
      district,
      neighborhood,
      properties,
      newCount: 0,
      updateCount: 0,
    }
  })
}

// 기존 데이터와 비교하여 분류
export async function classifyDataByExistence(groups: RegionGroup[], supabase: any): Promise<RegionGroup[]> {
  const classifiedGroups: RegionGroup[] = []

  for (const group of groups) {
    try {
      // 해당 지역의 기존 매물 조회
      const propertyIds = group.properties.map((p) => p.id || p.property_id).filter(Boolean)

      if (propertyIds.length === 0) {
        classifiedGroups.push({
          ...group,
          newCount: group.properties.length,
          updateCount: 0,
        })
        continue
      }

      const { data: existingProperties } = await supabase
        .from("properties")
        .select("property_id")
        .in("property_id", propertyIds)

      const existingIds = new Set((existingProperties || []).map((p: any) => p.property_id))

      const newCount = group.properties.filter((p) => !existingIds.has(p.id || p.property_id)).length
      const updateCount = group.properties.filter((p) => existingIds.has(p.id || p.property_id)).length

      classifiedGroups.push({
        ...group,
        newCount,
        updateCount,
      })
    } catch (error) {
      console.error("데이터 분류 오류:", error)
      classifiedGroups.push({
        ...group,
        newCount: group.properties.length,
        updateCount: 0,
      })
    }
  }

  return classifiedGroups
}
