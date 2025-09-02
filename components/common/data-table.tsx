"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ChevronUp, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SortConfig } from "@/lib/types"

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (item: T) => void
  className?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "검색...",
  onRowClick,
  className,
  emptyMessage = "데이터가 없습니다.",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  })

  // 검색 필터링
  const filteredData =
    searchable && searchTerm
      ? data.filter((item) =>
          Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
        )
      : data

  // 정렬
  const sortedData =
    sortConfig.key && sortConfig.direction
      ? [...filteredData].sort((a, b) => {
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
      : filteredData

  // 정렬 요청 처리
  const requestSort = (key: keyof T) => {
    let direction: "ascending" | "descending" | null = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null
    }

    setSortConfig({ key, direction })
  }

  // 정렬 아이콘 렌더링
  const renderSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) return null

    if (sortConfig.direction === "ascending") {
      return <ChevronUp className="inline h-4 w-4 ml-1" />
    } else if (sortConfig.direction === "descending") {
      return <ChevronDown className="inline h-4 w-4 ml-1" />
    }

    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(column.className, column.sortable && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => column.sortable && requestSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <TableRow
                  key={index}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render ? column.render(item[column.key], item) : String(item[column.key] || "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
