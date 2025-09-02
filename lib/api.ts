import type { Room } from "@/lib/types"
// Use built-in fetch API instead of node-fetch
// import * as cheerio from "cheerio" // Unused import

// const BASE_URL = "https://33m2.co.kr" // Unused constant

/**
 * 주어진 지역(keyword)에 대한 룸 데이터를 API 라우트를 통해 가져옵니다.
 */
export async function fetchData(): Promise<Room[]> {
  try {
    // 실제 데이터 대신 모의 데이터 생성 (실제 크롤링은 서버에서 구현 필요)
    const mockData = generateMockData()

    return mockData
  } catch (error) {
    console.error("검색 오류:", error)
    throw error
  }
}

// 모의 데이터 생성 함수
function generateMockData(): Room[] {
  const decodedLocation = "임의의 지역"
  const roomCount = 10 + Math.floor(Math.random() * 20) // 10-30개 방
  const mockRooms: Room[] = []

  const buildingTypes = ["오피스텔", "아파트", "빌라", "단독주택", "원룸"]

  for (let i = 0; i < roomCount; i++) {
    const weeklyPrice = 200000 + Math.floor(Math.random() * 600000) // 20-80만원
    const occupancyRate = 30 + Math.floor(Math.random() * 70) // 30-100%

    mockRooms.push({
      id: 1000 + i,
      name: `${decodedLocation} 숙소 ${i + 1}`,
      address: `${decodedLocation} ${Math.floor(Math.random() * 100) + 1}번길 ${Math.floor(Math.random() * 30) + 1}`,
      building_type: buildingTypes[Math.floor(Math.random() * buildingTypes.length)],
      room_count: 1 + Math.floor(Math.random() * 3),
      weekly_price: weeklyPrice,
      weekly_maintenance: Math.floor(weeklyPrice * 0.1),
      cleaning_fee: 30000 + Math.floor(Math.random() * 50000),
      discount_2weeks: Math.floor(Math.random() * 10),
      discount_3weeks: Math.floor(Math.random() * 15),
      discount_4weeks: Math.floor(Math.random() * 20),
      discount_5weeks: Math.floor(Math.random() * 22),
      discount_6weeks: Math.floor(Math.random() * 25),
      discount_7weeks: Math.floor(Math.random() * 27),
      discount_8weeks: Math.floor(Math.random() * 30),
      discount_9weeks: Math.floor(Math.random() * 32),
      discount_10weeks: Math.floor(Math.random() * 35),
      discount_11weeks: Math.floor(Math.random() * 37),
      discount_12weeks: Math.floor(Math.random() * 40),
      occupancy_rate: occupancyRate,
      occupancy_2rate: Math.max(20, occupancyRate - 10),
      occupancy_3rate: Math.max(10, occupancyRate - 20),
      bathroom_count: 1,
      kitchen_count: 1,
      living_room_count: Math.floor(Math.random() * 2),
      has_elevator: Math.random() > 0.5,
      parking_info: Math.random() > 0.7 ? "주차 가능" : "주차 불가",
      size_pyeong: 5 + Math.floor(Math.random() * 15),
      images: [],
      is_super_host: Math.random() > 0.7,
      review_info:
        Math.random() > 0.3
          ? {
              review_count: Math.floor(Math.random() * 50),
              latest_review_date: "2025년 3월",
              review_score: 3.5 + Math.random() * 1.5,
              review_details: [],
            }
          : null,
      latitude: 37.5 + (Math.random() - 0.5) * 0.1,
      longitude: 127 + (Math.random() - 0.5) * 0.1,
    })
  }

  return mockRooms
}
