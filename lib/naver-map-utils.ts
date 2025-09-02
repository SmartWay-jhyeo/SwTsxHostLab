// 네이버 부동산 URL 생성 함수
export function generateNaverPropertyUrl(latitude: number, longitude: number, buildingType?: string): string {
  // 좌표 정보
  const coordinates = `${latitude},${longitude},17`

  // 건물 유형에 따른 URL 생성
  if (buildingType) {
    const buildingTypeLower = buildingType.toLowerCase()

    // 오피스텔
    if (buildingTypeLower.includes("오피스텔") || buildingTypeLower.includes("오피")) {
      return `https://new.land.naver.com/search?ms=${coordinates}&a=OPST:PRE&b=B2&e=RETAIL`
    }

    // 아파트
    if (buildingTypeLower.includes("아파트") || buildingTypeLower.includes("apt")) {
      return `https://new.land.naver.com/search?ms=${coordinates}&a=PRE:APT&b=B2&e=RETAIL`
    }

    // 빌라/단독주택 등
    if (
      buildingTypeLower.includes("빌라") ||
      buildingTypeLower.includes("단독") ||
      buildingTypeLower.includes("주택") ||
      buildingTypeLower.includes("복층") ||
      buildingTypeLower.includes("상가주택") ||
      buildingTypeLower.includes("연립")
    ) {
      return `https://new.land.naver.com/houses?ms=${coordinates}&a=DDDGG:JWJT:SGJT:HOJT:VL&e=RETAIL`
    }

    // 원룸건물
    if (
      buildingTypeLower.includes("원룸") ||
      buildingTypeLower.includes("투룸") ||
      buildingTypeLower.includes("쓰리룸")
    ) {
      return `https://new.land.naver.com/rooms?ms=${coordinates}&a=APT:OPST:ABYG:OBYG:GM:OR:DDDGG:JWJT:SGJT:HOJT:VL&e=RETAIL&aa=SMALLSPCRENT`
    }
  }

  // 기본 URL (건물 유형이 없거나 매칭되지 않는 경우)
  return `https://new.land.naver.com/search?ms=${coordinates}`
}
