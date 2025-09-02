"use client"

import { useState, useMemo } from "react"
import { PAGINATION } from "@/lib/constants"

export function usePagination<T>(items: T[], initialLimit: number = PAGINATION.defaultLimit) {
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)

  // 페이지네이션 정보 계산
  const paginationInfo = useMemo(() => {
    const total = items.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (currentPage - 1) * limit
    const endIndex = Math.min(startIndex + limit, total)

    return {
      total,
      totalPages,
      currentPage,
      limit,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  }, [items.length, currentPage, limit])

  // 현재 페이지의 아이템들
  const paginatedItems = useMemo(() => {
    const { startIndex, endIndex } = paginationInfo
    return items.slice(startIndex, endIndex)
  }, [items, paginationInfo])

  // 페이지 변경
  const goToPage = (page: number) => {
    const { totalPages } = paginationInfo
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // 다음 페이지
  const goToNextPage = () => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  // 이전 페이지
  const goToPrevPage = () => {
    if (paginationInfo.hasPrevPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  // 첫 페이지
  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  // 마지막 페이지
  const goToLastPage = () => {
    setCurrentPage(paginationInfo.totalPages)
  }

  // 페이지 크기 변경
  const changeLimit = (newLimit: number) => {
    setLimit(Math.min(newLimit, PAGINATION.maxLimit))
    setCurrentPage(1) // 첫 페이지로 리셋
  }

  // 페이지 리셋
  const reset = () => {
    setCurrentPage(1)
    setLimit(initialLimit)
  }

  return {
    paginatedItems,
    paginationInfo,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    changeLimit,
    reset,
  }
}
