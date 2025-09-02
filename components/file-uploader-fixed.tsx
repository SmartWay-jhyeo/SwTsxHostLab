"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Room, ReviewDetail, Review } from "@/lib/types"

interface FileUploaderProps {
  onDataLoaded: (data: Room[]) => void
  label: string
  helpText: string
}

export function FileUploader({ onDataLoaded, label, helpText }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now())

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // JSON 데이터를 Room 객체로 변환
      const rooms: Room[] = data.map((roomData: any) => {
        // Review 객체 재구성
        let reviewInfo: Review | null = null
        if (roomData.review_info) {
          const reviewDetails: ReviewDetail[] =
            roomData.review_info.review_details?.map((detail: any) => ({
              user_name: detail.user_name || "",
              review_date: detail.review_date || "",
              score: detail.score || 0,
              text: detail.text || "",
            })) || []

          reviewInfo = {
            review_count: roomData.review_info.review_count || 0,
            latest_review_date: roomData.review_info.latest_review_date || "",
            review_score: roomData.review_info.review_score || 0,
            review_details: reviewDetails,
          }
        }

        // 누락된 필드에 기본값 설정
        return {
          id: roomData.id || 0,
          name: roomData.name || "",
          address: roomData.address || "",
          building_type: roomData.building_type || "",
          room_count: roomData.room_count || 0,
          weekly_price: roomData.weekly_price || 0,
          weekly_maintenance: roomData.weekly_maintenance || 0,
          cleaning_fee: roomData.cleaning_fee || 0,
          discount_2weeks: roomData.discount_2weeks || 0,
          discount_3weeks: roomData.discount_3weeks || 0,
          discount_4weeks: roomData.discount_4weeks || 0,
          discount_5weeks: roomData.discount_5weeks || 0,
          discount_6weeks: roomData.discount_6weeks || 0,
          discount_7weeks: roomData.discount_7weeks || 0,
          discount_8weeks: roomData.discount_8weeks || 0,
          discount_9weeks: roomData.discount_9weeks || 0,
          discount_10weeks: roomData.discount_10weeks || 0,
          discount_11weeks: roomData.discount_11weeks || 0,
          discount_12weeks: roomData.discount_12weeks || 0,
          occupancy_rate: roomData.occupancy_rate || 0,
          occupancy_2rate: roomData.occupancy_2rate || 0,
          occupancy_3rate: roomData.occupancy_3rate || 0,
          bathroom_count: roomData.bathroom_count || 0,
          kitchen_count: roomData.kitchen_count || 0,
          living_room_count: roomData.living_room_count || 0,
          has_elevator: roomData.has_elevator || false,
          parking_info: roomData.parking_info || "",
          size_pyeong: roomData.size_pyeong || 0,
          images: roomData.images || [],
          is_super_host: roomData.is_super_host || false,
          review_info: reviewInfo,
          latitude: roomData.latitude || null,
          longitude: roomData.longitude || null,
          naver_property_data: roomData.naver_property_data || null, // 네이버 부동산 데이터 추가
        }
      })

      onDataLoaded(rooms)

      // 파일 입력 필드 초기화
      setFileInputKey(Date.now())
    } catch (error) {
      console.error("파일 처리 중 오류 발생:", error)
      alert("파일 처리 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 text-center">
        <p className="mb-2 text-sm text-muted-foreground">{helpText}</p>
        <Button
          variant="outline"
          onClick={() => document.getElementById(`file-upload-${fileInputKey}`)?.click()}
          disabled={isLoading}
        >
          {isLoading ? "로딩 중..." : label}
        </Button>
        <input
          id={`file-upload-${fileInputKey}`}
          key={fileInputKey}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
