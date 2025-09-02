/**
 * 애플리케이션 전체에서 사용되는 상수들을 정의합니다.
 */

// 차트 색상 팔레트
export const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
] as const

// 건물 유형 목록
export const BUILDING_TYPES = ["오피스텔", "아파트", "빌라", "단독주택", "원룸", "투룸", "쓰리룸"] as const

// 예약률 범위 색상 매핑
export const OCCUPANCY_COLORS = {
  low: "#ef4444", // 0-25% (빨간색)
  medium: "#eab308", // 25-50% (노란색)
  high: "#3b82f6", // 50-75% (파란색)
  excellent: "#22c55e", // 75-100% (초록색)
} as const

// 수수료율
export const COMMISSION_RATE = 0.033 // 3.3%

// 기본 설정값
export const DEFAULT_VALUES = {
  monthlyRent: 1200000,
  monthlyMaintenance: 200000,
  cleaningCost: 100000,
  setupCost: 2000000,
  deposit: 10000000,
  occupancyRate: 75,
  periodMonths: 1,
} as const

// 페이지네이션 설정
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const

// 검색 설정
export const SEARCH = {
  debounceDelay: 300,
  minSearchLength: 2,
} as const

// 날짜 형식
export const DATE_FORMATS = {
  display: "yyyy년 MM월 dd일",
  api: "yyyy-MM-dd",
  datetime: "yyyy-MM-dd HH:mm:ss",
} as const

// 통화 설정
export const CURRENCY = {
  symbol: "₩",
  unit: "원",
  locale: "ko-KR",
} as const

// 지도 설정
export const MAP_CONFIG = {
  defaultZoom: 15,
  maxZoom: 18,
  minZoom: 10,
  defaultCenter: [37.5665, 126.978] as [number, number], // 서울시청
} as const

// 파일 업로드 설정
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [".json"],
  maxFiles: 1,
} as const

// 애니메이션 설정
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: "ease-in-out",
} as const

// 브레이크포인트
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

// 에러 메시지
export const ERROR_MESSAGES = {
  networkError: "네트워크 연결을 확인해주세요.",
  serverError: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  validationError: "입력값을 확인해주세요.",
  authError: "인증이 필요합니다.",
  permissionError: "권한이 없습니다.",
  notFoundError: "요청한 데이터를 찾을 수 없습니다.",
  fileUploadError: "파일 업로드 중 오류가 발생했습니다.",
  dataProcessingError: "데이터 처리 중 오류가 발생했습니다.",
} as const

// 성공 메시지
export const SUCCESS_MESSAGES = {
  dataSaved: "데이터가 성공적으로 저장되었습니다.",
  dataUpdated: "데이터가 성공적으로 업데이트되었습니다.",
  dataDeleted: "데이터가 성공적으로 삭제되었습니다.",
  fileUploaded: "파일이 성공적으로 업로드되었습니다.",
  calculationCompleted: "계산이 완료되었습니다.",
  analysisCompleted: "분석이 완료되었습니다.",
} as const

// 로딩 메시지
export const LOADING_MESSAGES = {
  loading: "로딩 중...",
  processing: "처리 중...",
  calculating: "계산 중...",
  analyzing: "분석 중...",
  saving: "저장 중...",
  uploading: "업로드 중...",
  deleting: "삭제 중...",
} as const
