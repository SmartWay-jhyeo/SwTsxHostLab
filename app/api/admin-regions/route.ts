import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level") // 'districts', 'dongs'
  const province = searchParams.get("province")
  const district = searchParams.get("district")

  try {
    if (level === "districts" && province) {
      // 시/군/구 데이터 가져오기
      const districts = await fetchDistricts(province)
      return NextResponse.json({ success: true, data: districts })
    }

    if (level === "dongs" && province && district) {
      // 읍/면/동 데이터 가져오기
      const dongs = await fetchDongs(province, district)
      return NextResponse.json({ success: true, data: dongs })
    }

    return NextResponse.json({ success: false, error: "잘못된 요청 파라미터" }, { status: 400 })
  } catch (error) {
    console.error("행정구역 API 오류:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

// 시/군/구 데이터 가져오기
async function fetchDistricts(provinceCode: string) {
  try {
    // 공공데이터포털 API 또는 다른 행정구역 API 호출
    // 여기서는 예시 데이터를 반환합니다

    const districtMap: { [key: string]: Array<{ code: string; name: string }> } = {
      "11": [
        // 서울특별시
        { code: "11110", name: "종로구" },
        { code: "11140", name: "중구" },
        { code: "11170", name: "용산구" },
        { code: "11200", name: "성동구" },
        { code: "11215", name: "광진구" },
        { code: "11230", name: "동대문구" },
        { code: "11260", name: "중랑구" },
        { code: "11290", name: "성북구" },
        { code: "11305", name: "강북구" },
        { code: "11320", name: "도봉구" },
        { code: "11350", name: "노원구" },
        { code: "11380", name: "은평구" },
        { code: "11410", name: "서대문구" },
        { code: "11440", name: "마포구" },
        { code: "11470", name: "양천구" },
        { code: "11500", name: "강서구" },
        { code: "11530", name: "구로구" },
        { code: "11545", name: "금천구" },
        { code: "11560", name: "영등포구" },
        { code: "11590", name: "동작구" },
        { code: "11620", name: "관악구" },
        { code: "11650", name: "서초구" },
        { code: "11680", name: "강남구" },
        { code: "11710", name: "송파구" },
        { code: "11740", name: "강동구" },
      ],
      "26": [
        // 부산광역시
        { code: "26110", name: "중구" },
        { code: "26140", name: "서구" },
        { code: "26170", name: "동구" },
        { code: "26200", name: "영도구" },
        { code: "26230", name: "부산진구" },
        { code: "26260", name: "동래구" },
        { code: "26290", name: "남구" },
        { code: "26320", name: "북구" },
        { code: "26350", name: "해운대구" },
        { code: "26380", name: "사하구" },
        { code: "26410", name: "금정구" },
        { code: "26440", name: "강서구" },
        { code: "26470", name: "연제구" },
        { code: "26500", name: "수영구" },
        { code: "26530", name: "사상구" },
        { code: "26710", name: "기장군" },
      ],
      // 다른 시/도 데이터도 추가...
    }

    return districtMap[provinceCode] || []
  } catch (error) {
    console.error("시/군/구 데이터 조회 오류:", error)
    return []
  }
}

// 읍/면/동 데이터 가져오기
async function fetchDongs(provinceCode: string, districtCode: string) {
  try {
    // 실제로는 API를 호출해야 하지만, 여기서는 예시 데이터 사용
    const dongMap: { [key: string]: Array<{ code: string; name: string }> } = {
      "11110": [
        // 종로구
        { code: "1111010100", name: "청운효자동" },
        { code: "1111010200", name: "사직동" },
        { code: "1111010300", name: "삼청동" },
        { code: "1111010400", name: "부암동" },
        { code: "1111010500", name: "평창동" },
        { code: "1111010600", name: "무악동" },
        { code: "1111010700", name: "교남동" },
        { code: "1111010800", name: "가회동" },
        { code: "1111010900", name: "종로1.2.3.4가동" },
        { code: "1111011000", name: "종로5.6가동" },
        { code: "1111011100", name: "이화동" },
        { code: "1111011200", name: "혜화동" },
        { code: "1111011300", name: "명륜3가동" },
        { code: "1111011400", name: "창신1동" },
        { code: "1111011500", name: "창신2동" },
        { code: "1111011600", name: "창신3동" },
        { code: "1111011700", name: "숭인1동" },
        { code: "1111011800", name: "숭인2동" },
      ],
      "11140": [
        // 중구
        { code: "1114010100", name: "소공동" },
        { code: "1114010200", name: "회현동" },
        { code: "1114010300", name: "명동" },
        { code: "1114010400", name: "필동" },
        { code: "1114010500", name: "장충동" },
        { code: "1114010600", name: "광희동" },
        { code: "1114010700", name: "을지로동" },
        { code: "1114010800", name: "신당동" },
        { code: "1114010900", name: "다산동" },
        { code: "1114011000", name: "약수동" },
        { code: "1114011100", name: "청구동" },
        { code: "1114011200", name: "신당5동" },
        { code: "1114011300", name: "동화동" },
        { code: "1114011400", name: "황학동" },
        { code: "1114011500", name: "중림동" },
      ],
      // 다른 구/군 데이터도 추가...
    }

    return dongMap[districtCode] || []
  } catch (error) {
    console.error("읍/면/동 데이터 조회 오류:", error)
    return []
  }
}
