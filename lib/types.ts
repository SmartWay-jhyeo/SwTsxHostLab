// 기본 숙소 정보 인터페이스
export interface Room {
  id: number
  name: string
  address: string
  building_type: string
  room_count: number
  weekly_price: number
  weekly_maintenance: number
  cleaning_fee: number

  // 할인율 정보
  discount_2weeks: number
  discount_3weeks: number
  discount_4weeks: number
  discount_5weeks: number
  discount_6weeks: number
  discount_7weeks: number
  discount_8weeks: number
  discount_9weeks: number
  discount_10weeks: number
  discount_11weeks: number
  discount_12weeks: number

  // 예약률 정보
  occupancy_rate: number
  occupancy_2rate: number
  occupancy_3rate: number

  // 숙소 상세 정보
  bathroom_count: number
  kitchen_count: number
  living_room_count: number
  has_elevator: boolean
  parking_info: string
  size_pyeong: number
  images: string[]
  is_super_host: boolean

  // 위치 정보
  latitude: number | null
  longitude: number | null

  // 리뷰 정보
  review_info: Review | null

  // 네이버 부동산 데이터
  naver_property_data?: NaverPropertyData | null

  // 추가 비용 정보 (데이터베이스에서 관리)
  monthly_rent?: number
  monthly_maintenance?: number
  cleaning_cost?: number
  initial_setup_cost?: number
  deposit?: number
  property_id?: string
}

// 리뷰 상세 정보
export interface ReviewDetail {
  user_name: string
  review_date: string
  score: number
  text: string
}

// 리뷰 정보
export interface Review {
  review_count: number
  latest_review_date: string
  review_score: number
  review_details: ReviewDetail[]
}

// 네이버 부동산 데이터
export interface NaverPropertyData {
  property_type: string
  price_info: {
    sale_price?: number
    deposit?: number
    monthly_rent?: number
  }
  building_info: {
    total_floors?: number
    current_floor?: number
    building_year?: number
  }
  area_info: {
    exclusive_area?: number
    supply_area?: number
  }
}

// 수익성 분석 관련 타입
export interface RentalCosts {
  monthlyRent: number
  maintenanceFee: number
  cleaningCost: number
  setupCost: number
  deposit: number
}

export interface SimulationScenario {
  pattern: string
  occupancy_rate: number
  gross_revenue: number
  net_income: number
  commission: number
  cleaning_revenue: number
  cleaning_cost: number
  expenses: Record<string, number>
  discount_amount: number
  weeks: number | number[]
  discount_rate: number | number[]
  breakEvenMonths?: number
}

// 정렬 관련 타입
export interface SortConfig<T> {
  key: keyof T | null
  direction: "ascending" | "descending" | null
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 페이지네이션 타입
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 필터 옵션 타입
export interface FilterOptions {
  searchTerm: string
  buildingType: string
  minPrice: number | null
  maxPrice: number | null
  minOccupancy: number | null
  maxOccupancy: number | null
  minSize: number | null
  maxSize: number | null
}

// 차트 데이터 타입
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: any
}

// 통계 정보 타입
export interface Statistics {
  average: number
  min: number
  max: number
  stdDev: number
  count: number
}

// 지역 정보 타입
export interface RegionInfo {
  city: string
  district?: string
  neighborhood?: string
}

// 사용자 권한 타입
export interface UserPermission {
  id?: number
  user_id: string
  city_name: string | null
  district_name: string | null
  neighborhood_name: string | null
  user_email?: string
  created_at?: string
}

// 인증 사용자 타입
export interface AuthUser {
  id: string
  email: string
  created_at: string
  user_metadata?: any
  isAdmin?: boolean
}

// 상담 일지 타입
export interface ConsultationNote {
  id?: number
  user_id: string
  location: string
  content: string
  room_data: Room[]
  created_at: string
  updated_at?: string
}

// 분석 결과 저장 타입
export interface SavedAnalysisResult {
  id: string
  title: string
  location: string
  room_data: Room[]
  analysis_summary?: string
  created_at: string
  updated_at?: string
  user_id?: string
  password_protected: boolean
}
