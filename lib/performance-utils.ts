// 메모이제이션 캐시
const memoCache = new Map()

// 간단한 메모이제이션 함수
export function memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: Parameters<T>) => string): T {
  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args)

    if (memoCache.has(key)) {
      return memoCache.get(key)
    }

    const result = fn(...args)
    memoCache.set(key, result)

    // 캐시 크기 제한 (메모리 누수 방지)
    if (memoCache.size > 1000) {
      const firstKey = memoCache.keys().next().value
      memoCache.delete(firstKey)
    }

    return result
  }) as T
}

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 배열 청크 분할 (대용량 데이터 처리용)
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// 가상 스크롤링을 위한 유틸리티
export function getVisibleItems<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  overscan = 5,
) {
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight), items.length - 1)

  const start = Math.max(0, visibleStart - overscan)
  const end = Math.min(items.length - 1, visibleEnd + overscan)

  return {
    items: items.slice(start, end + 1),
    startIndex: start,
    endIndex: end,
    totalHeight: items.length * itemHeight,
    offsetY: start * itemHeight,
  }
}

// 객체 깊은 비교 (React.memo 최적화용)
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (a == null || b == null) return false

  if (typeof a !== typeof b) return false

  if (typeof a !== "object") return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }

  return true
}

// 포맷팅 함수들 메모이제이션
export const formatCurrency = memoize(
  (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  },
  (amount) => `currency-${amount}`,
)

export const formatNumber = memoize(
  (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num)
  },
  (num) => `number-${num}`,
)

export const formatPercentage = memoize(
  (value: number | null | undefined, decimals = 1) => {
    if (value == null) return "0%"
    return `${value.toFixed(decimals)}%`
  },
  (value, decimals) => `percentage-${value}-${decimals}`,
)
