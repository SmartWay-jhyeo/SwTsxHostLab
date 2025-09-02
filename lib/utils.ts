import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Room } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch (error) {
    console.error("날짜 형식 변환 오류:", error)
    return dateString
  }
}

/**
 * 숫자를 한국어 형식으로 포맷팅합니다.
 * @param num 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: "1,000")
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0"
  return num.toLocaleString("ko-KR")
}

/**
 * 통화 형식으로 숫자를 포맷팅합니다.
 * @param amount 금액
 * @param currency 통화 단위 (기본값: "원")
 * @returns 포맷팅된 통화 문자열
 */
export function formatCurrency(amount: number | undefined | null, currency = "원"): string {
  return `${formatNumber(amount)}${currency}`
}

/**
 * 백분율로 숫자를 포맷팅합니다.
 * @param rate 비율 (0-100)
 * @param decimals 소수점 자릿수 (기본값: 1)
 * @returns 포맷팅된 백분율 문자열
 */
export function formatPercentage(rate: number | undefined | null, decimals = 1): string {
  if (rate === undefined || rate === null || isNaN(rate)) return "0%"
  return `${rate.toFixed(decimals)}%`
}

/**
 * 숙소의 예약률을 기간에 따라 반환합니다.
 * @param room 숙소 객체
 * @param periodMonths 기간 (월 단위, 기본값: 1)
 * @returns 해당 기간의 예약률
 */
export function getOccupancyRate(room: Room | null, periodMonths = 1): number {
  if (!room) return 0

  switch (periodMonths) {
    case 2:
      return room.occupancy_2rate || 0
    case 3:
      return room.occupancy_3rate || 0
    default:
      return room.occupancy_rate || 0
  }
}

/**
 * 배열에서 이상치를 제거합니다.
 * @param items 원본 배열
 * @param valueSelector 값을 추출하는 함수
 * @param stdDevMultiplier 표준편차 배수 (기본값: 2)
 * @returns 이상치가 제거된 배열
 */
export function removeOutliers<T>(items: T[], valueSelector: (item: T) => number, stdDevMultiplier = 2): T[] {
  if (items.length === 0) return items

  const values = items.map(valueSelector)
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length)

  return items.filter((item) => {
    const value = valueSelector(item)
    return value >= avg - stdDevMultiplier * stdDev && value <= avg + stdDevMultiplier * stdDev
  })
}

/**
 * 숫자 배열의 통계를 계산합니다.
 * @param numbers 숫자 배열
 * @returns 통계 객체 (평균, 최소값, 최대값, 표준편차)
 */
export function calculateStatistics(numbers: number[]): {
  average: number
  min: number
  max: number
  stdDev: number
} {
  if (numbers.length === 0) {
    return { average: 0, min: 0, max: 0, stdDev: 0 }
  }

  const average = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const stdDev = Math.sqrt(numbers.reduce((sum, num) => sum + Math.pow(num - average, 2), 0) / numbers.length)

  return { average, min, max, stdDev }
}

/**
 * 리뷰 점수를 5점 만점으로 변환합니다.
 * @param score 100점 만점 점수
 * @returns 5점 만점 점수 (반올림)
 */
export function convertReviewScore(score: number | undefined | null): number | null {
  if (score === undefined || score === null || isNaN(score)) return null
  return Math.round(score / 20)
}

/**
 * 문자열에서 숫자만 추출합니다.
 * @param str 입력 문자열
 * @returns 추출된 숫자 (숫자가 없으면 0)
 */
export function extractNumber(str: string): number {
  const match = str.replace(/[^0-9]/g, "")
  return Number.parseInt(match) || 0
}

/**
 * 두 날짜 사이의 차이를 계산합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @param unit 단위 ('days' | 'months' | 'years')
 * @returns 날짜 차이
 */
export function dateDifference(
  date1: Date | string,
  date2: Date | string,
  unit: "days" | "months" | "years" = "days",
): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())

  switch (unit) {
    case "days":
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    case "months":
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
    case "years":
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365))
    default:
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

/**
 * 객체 배열을 특정 키로 그룹화합니다.
 * @param array 원본 배열
 * @param keySelector 키를 선택하는 함수
 * @returns 그룹화된 객체
 */
export function groupBy<T, K extends string | number>(array: T[], keySelector: (item: T) => K): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keySelector(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    },
    {} as Record<K, T[]>,
  )
}

/**
 * 배열을 청크 단위로 나눕니다.
 * @param array 원본 배열
 * @param size 청크 크기
 * @returns 청크로 나뉜 2차원 배열
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * 디바운스 함수를 생성합니다.
 * @param func 실행할 함수
 * @param delay 지연 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * 쓰로틀 함수를 생성합니다.
 * @param func 실행할 함수
 * @param limit 제한 시간 (밀리초)
 * @returns 쓰로틀된 함수
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
