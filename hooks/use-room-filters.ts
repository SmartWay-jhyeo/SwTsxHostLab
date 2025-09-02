"use client"

import { useState, useMemo } from "react"
import type { Room, FilterOptions, SortConfig } from "@/lib/types"
import { debounce } from "@/lib/utils"

export function useRoomFilters(initialRooms: Room[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    buildingType: "all",
    minPrice: null,
    maxPrice: null,
    minOccupancy: null,
    maxOccupancy: null,
    minSize: null,
    maxSize: null,
  })

  const [sortConfig, setSortConfig] = useState<SortConfig<Room>>({
    key: null,
    direction: null,
  })

  // 디바운스된 검색어 업데이트
  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((term: string) => {
        setFilters((prev) => ({ ...prev, searchTerm: term }))
      }, 300),
    [],
  )

  // 필터링된 룸 목록
  const filteredRooms = useMemo(() => {
    let result = [...initialRooms]

    // 검색어 필터링
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      result = result.filter(
        (room) =>
          room.name.toLowerCase().includes(term) ||
          room.address.toLowerCase().includes(term) ||
          room.building_type.toLowerCase().includes(term),
      )
    }

    // 건물 유형 필터링
    if (filters.buildingType !== "all") {
      result = result.filter((room) => room.building_type === filters.buildingType)
    }

    // 가격 범위 필터링
    if (filters.minPrice !== null) {
      result = result.filter((room) => room.weekly_price >= filters.minPrice!)
    }
    if (filters.maxPrice !== null) {
      result = result.filter((room) => room.weekly_price <= filters.maxPrice!)
    }

    // 예약률 범위 필터링
    if (filters.minOccupancy !== null) {
      result = result.filter((room) => room.occupancy_rate >= filters.minOccupancy!)
    }
    if (filters.maxOccupancy !== null) {
      result = result.filter((room) => room.occupancy_rate <= filters.maxOccupancy!)
    }

    // 평수 범위 필터링
    if (filters.minSize !== null) {
      result = result.filter((room) => room.size_pyeong >= filters.minSize!)
    }
    if (filters.maxSize !== null) {
      result = result.filter((room) => room.size_pyeong <= filters.maxSize!)
    }

    return result
  }, [initialRooms, filters])

  // 정렬된 룸 목록
  const sortedRooms = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredRooms
    }

    return [...filteredRooms].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue === bValue) return 0

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue)
      } else {
        comparison = (aValue as number) - (bValue as number)
      }

      return sortConfig.direction === "ascending" ? comparison : -comparison
    })
  }, [filteredRooms, sortConfig])

  // 정렬 요청 처리
  const requestSort = (key: keyof Room) => {
    let direction: "ascending" | "descending" | null = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null
    }

    setSortConfig({ key, direction })
  }

  // 필터 업데이트 함수들
  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      buildingType: "all",
      minPrice: null,
      maxPrice: null,
      minOccupancy: null,
      maxOccupancy: null,
      minSize: null,
      maxSize: null,
    })
    setSortConfig({ key: null, direction: null })
  }

  return {
    filters,
    sortConfig,
    filteredRooms: sortedRooms,
    updateFilter,
    requestSort,
    resetFilters,
    debouncedSetSearchTerm,
    totalCount: initialRooms.length,
    filteredCount: sortedRooms.length,
  }
}
