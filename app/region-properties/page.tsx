"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Building,
  MapPin,
  Settings,
  ChevronUp,
  Save,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Room } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { MapClientComponent } from "@/components/map-client-component"
import { PropertyCard } from "@/components/property-card"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// 건물 그룹 타입 정의
interface BuildingGroup {
  buildingName: string
  address: string
  rooms: Room[]
  averageOccupancy: number
  totalRooms: number
  buildingType: string
  latitude: number | null
  longitude: number | null
  thumbnail: string | null
  // 평수별 정보 대신 방 개수별 정보로 변경
  roomTypeInfo: {
    roomCount: number // 방 개수 (1개, 2개 등)
    count: number // 해당 방 개수를 가진 숙소 수
    avgWeeklyPrice: number // 평균 주간 렌트비
    avgWeeklyMaintenance: number // 평균 주간 관리비
    avgCleaningFee: number // 평균 청소비
    avgOccupancyRate: number // 평균 예약률
    avgProfit: number // 평균 주간 순이익 (원)
  }
  // 기존 필드 제거
  sizeTypes: string[]
  priceBySize: Record<string, number>
  cleaningFeeBySize: Record<string, number>
}

interface RegionData {
  neighborhood_id: number
  city_name: string
  district_name: string
  neighborhood_name: string
  created_at: string
  property_count: number
}

export default function RegionPropertiesPage() {
  const [cities, setCities] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [neighborhoods, setNeighborhoods] = useState<RegionData[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<RegionData | null>(null)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"occupancy" | "price" | "size">("occupancy")
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)
  const [mapId, setMapId] = useState<string>("initial")
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set())
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const [bulkApplyPanels, setBulkApplyPanels] = useState<Set<string>>(new Set())
  const [bulkApplyCosts, setBulkApplyCosts] = useState<
    Record<
      string,
      {
        monthlyRent: number
        monthlyMaintenance: number
        cleaningCost: number
      }
    >
  >({})
  const [bulkApplyLoading, setBulkApplyLoading] = useState<Set<string>>(new Set())

  // 숙소 카드 요소에 대한 참조 객체 생성
  const roomCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const propertyListRef = useRef<HTMLDivElement | null>(null)
  const topScrollRef = useRef<HTMLDivElement | null>(null)

  // 스크롤 동기화를 위한 상태
  const [isScrolling, setIsScrolling] = useState(false)

  // Supabase 클라이언트 생성
  const supabase = createClient()

  // 시/도 목록 가져오기 (권한 기반)
  useEffect(() => {
    async function fetchCities() {
      setLoading(true)
      console.log("🚀 [프론트엔드] 시/도 목록 가져오기 시작")

      try {
        const response = await fetch("/api/regions?level=provinces")
        const data = await response.json()

        console.log("📡 [프론트엔드] 시/도 API 응답:", data)

        if (data.success) {
          console.log("✅ [프론트엔드] 받은 시/도 목록:", data.data)
          setCities(data.data)

          // 첫 번째 시/도 자동 선택
          if (data.data.length > 0 && !selectedCity) {
            console.log("🎯 [프론트엔드] 첫 번째 시/도 자동 선택:", data.data[0])
            setSelectedCity(data.data[0])
            fetchDistrictsByCity(data.data[0])
          } else {
            setLoading(false)
          }
        } else {
          console.error("❌ [프론트엔드] 시/도 목록 가져오기 실패:", data.error)
          setCities([])
          setLoading(false)
        }
      } catch (error) {
        console.error("❌ [프론트엔드] 시/도 목록 가져오기 오류:", error)
        setCities([])
        setLoading(false)
      }
    }

    fetchCities()
  }, [])

  // 선택한 시/도의 시/군/구 목록 가져오기 (권한 기반)
  const fetchDistrictsByCity = async (cityName: string) => {
    setLoading(true)
    console.log(`🚀 [프론트엔드] ${cityName}의 시/군/구 목록 가져오기 시작`)

    try {
      const response = await fetch(`/api/regions?level=districts&province=${encodeURIComponent(cityName)}`)
      const data = await response.json()

      console.log("📡 [프론트엔드] 시/군/구 API 응답:", data)

      if (data.success) {
        console.log("✅ [프론트엔드] 받은 시/군/구 목록:", data.data)
        setDistricts(data.data)

        // 첫 번째 시/군/구 자동 선택
        if (data.data.length > 0) {
          console.log("🎯 [프론트엔드] 첫 번째 시/군/구 자동 선택:", data.data[0])
          setSelectedDistrict(data.data[0])
          fetchNeighborhoodsByDistrict(cityName, data.data[0])
        } else {
          console.log("⚠️ [프론트엔드] 접근 가능한 시/군/구가 없습니다")
          setDistricts([])
          setNeighborhoods([])
          setSelectedDistrict(null)
          setSelectedNeighborhood(null)
          setRooms(null)
          setLoading(false)
        }
      } else {
        console.error("❌ [프론트엔드] 시/군/구 목록 가져오기 실패:", data.error)
        setDistricts([])
        setNeighborhoods([])
        setSelectedDistrict(null)
        setSelectedNeighborhood(null)
        setRooms(null)
        setLoading(false)
      }
    } catch (error) {
      console.error("❌ [프론트엔드] 시/군/구 목록 가져오기 오류:", error)
      setDistricts([])
      setNeighborhoods([])
      setSelectedDistrict(null)
      setSelectedNeighborhood(null)
      setRooms(null)
      setLoading(false)
    }
  }

  // 선택한 시/군/구의 읍/면/동 목록 가져오기 (권한 기반)
  const fetchNeighborhoodsByDistrict = async (cityName: string, districtName: string) => {
    setLoading(true)
    console.log(`🚀 [프론트엔드] ${cityName} ${districtName}의 읍/면/동 목록 가져오기 시작`)

    try {
      const response = await fetch(
        `/api/regions?level=dongs&province=${encodeURIComponent(cityName)}&district=${encodeURIComponent(districtName)}`,
      )
      const data = await response.json()

      console.log("📡 [프론트엔드] 읍/면/동 API 응답:", data)

      if (data.success) {
        console.log("✅ [프론트엔드] 받은 읍/면/동 목록:", data.data)

        // 읍/면/동 상세 정보 가져오기
        const { data: neighborhoodsData, error } = await supabase
          .from("neighborhoods")
          .select(`
            neighborhood_id,
            neighborhood_name,
            created_at,
            districts!inner(
              district_name,
              cities!inner(city_name)
            ),
            properties(count)
          `)
          .eq("districts.cities.city_name", cityName)
          .eq("districts.district_name", districtName)
          .in("neighborhood_name", data.data)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("❌ [프론트엔드] 읍/면/동 상세 정보 조회 오류:", error)
          setNeighborhoods([])
          setSelectedNeighborhood(null)
          setRooms(null)
          setLoading(false)
          return
        }

        console.log("📋 [프론트엔드] 읍/면/동 상세 정보:", neighborhoodsData)

        // 데이터 변환
        const neighborhoodData: RegionData[] = neighborhoodsData.map((item) => ({
          neighborhood_id: item.neighborhood_id,
          city_name: cityName,
          district_name: districtName,
          neighborhood_name: item.neighborhood_name,
          created_at: item.created_at,
          property_count: item.properties?.[0]?.count || 0,
        }))

        console.log("✅ [프론트엔드] 변환된 읍/면/동 데이터:", neighborhoodData)
        setNeighborhoods(neighborhoodData)

        // 첫 번째 읍/면/동 자동 선택
        if (neighborhoodData.length > 0) {
          console.log("🎯 [프론트엔드] 첫 번째 읍/면/동 자동 선택:", neighborhoodData[0])
          setSelectedNeighborhood(neighborhoodData[0])
          fetchPropertiesByNeighborhood(neighborhoodData[0].neighborhood_id)
        } else {
          console.log("⚠️ [프론트엔드] 접근 가능한 읍/면/동이 없습니다")
          setSelectedNeighborhood(null)
          setRooms(null)
          setLoading(false)
        }
      } else {
        console.error("❌ [프론트엔드] 읍/면/동 목록 가져오기 실패:", data.error)
        setNeighborhoods([])
        setSelectedNeighborhood(null)
        setRooms(null)
        setLoading(false)
      }
    } catch (error) {
      console.error("❌ [프론트엔드] 읍/면/동 목록 가져오기 오류:", error)
      setNeighborhoods([])
      setSelectedNeighborhood(null)
      setRooms(null)
      setLoading(false)
    }
  }

  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  // 선택한 읍/면/동의 부동산 데이터 가져오기
  const fetchPropertiesByNeighborhood = async (neighborhoodId: number) => {
    setDataLoading(true)
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
        *,
        property_details!property_details_property_id_fkey(*),
        property_pricing!property_pricing_property_id_fkey(*),
        property_occupancy!property_occupancy_property_id_fkey(*),
        property_images!property_images_property_id_fkey(*),
        property_reviews!property_reviews_property_id_fkey(*),
        property_review_summary!property_review_summary_property_id_fkey(*),
        updated_at,
        created_at
      `)
        .eq("neighborhood_id", neighborhoodId)
        .eq("is_active", true)

      if (error) {
        console.error("부동산 데이터 가져오기 오류:", error)
        setRooms(null)
        setDataLoading(false)
        return
      }

      // 데이터를 Room 형식으로 변환
      const roomsData: Room[] = data.map((property) => {
        const details = property.property_details?.[0]
        const pricing = property.property_pricing?.[0]
        const occupancy = property.property_occupancy

        const images = property.property_images || []
        const reviews = property.property_reviews || []
        const reviewSummary = property.property_review_summary?.[0]

        // property_occupancy 테이블에서 직접 값 가져오기 - 문자열을 숫자로 변환
        const finalOccupancyRate = occupancy?.occupancy_rate
          ? Number.parseFloat(occupancy.occupancy_rate.toString())
          : 0
        const finalOccupancy2Rate = occupancy?.occupancy_2rate
          ? Number.parseFloat(occupancy.occupancy_2rate.toString())
          : 0
        const finalOccupancy3Rate = occupancy?.occupancy_3rate.toString()
          ? Number.parseFloat(occupancy.occupancy_3rate.toString())
          : 0

        return {
          id: property.id,
          property_id: property.property_id?.toString() || null,
          name: property.name || "",
          address: property.address || "",
          latitude: property.latitude ? Number(property.latitude) : null,
          longitude: property.longitude ? Number(property.longitude) : null,
          building_type: details?.building_type || property.building_type || "",
          size_pyeong: details?.size_pyeong ? Number(details.size_pyeong) : 0,
          size_m2: details?.size_m2 ? Number(details.size_m2) : null,
          room_type: details?.room_type || null,
          // room_count 매핑 수정 - 여러 소스에서 확인
          room_count: details?.bedrooms
            ? Number(details.bedrooms)
            : details?.room_count
              ? Number(details.room_count)
              : property.room_count
                ? Number(property.room_count)
                : 1,
          weekly_price: pricing?.weekly_price ? Number(pricing.weekly_price) : 0,
          weekly_maintenance: pricing?.weekly_maintenance ? Number(pricing.weekly_maintenance) : 0,
          cleaning_fee: pricing?.cleaning_fee ? Number(pricing.cleaning_fee) : 0,
          discount_2weeks: pricing?.discount_2weeks ? Number(pricing.discount_2weeks) : 0,
          discount_3weeks: pricing?.discount_3weeks ? Number(pricing.discount_3weeks) : 0,
          discount_4weeks: pricing?.discount_4weeks ? Number(pricing.discount_4weeks) : 0,
          discount_5weeks: pricing?.discount_5weeks ? Number(pricing.discount_5weeks) : 0,
          discount_6weeks: pricing?.discount_6weeks ? Number(pricing.discount_6weeks) : 0,
          discount_7weeks: pricing?.discount_7weeks ? Number(pricing.discount_7weeks) : 0,
          discount_8weeks: pricing?.discount_8weeks ? Number(pricing.discount_8weeks) : 0,
          discount_9weeks: pricing?.discount_9weeks ? Number(pricing.discount_9weeks) : 0,
          discount_10weeks: pricing?.discount_10weeks ? Number(pricing.discount_10weeks) : 0,
          discount_11weeks: pricing?.discount_11weeks ? Number(pricing.discount_11weeks) : 0,
          discount_12weeks: pricing?.discount_12weeks ? Number(pricing.discount_12weeks) : 0,
          occupancy_rate: finalOccupancyRate,
          occupancy_2rate: finalOccupancy2Rate,
          occupancy_3rate: finalOccupancy3Rate,
          bathroom_count: details?.bathrooms ? Number(details.bathrooms) : 0,
          kitchen_count: details?.kitchen_count ? Number(details.kitchen_count) : 0,
          living_room_count: details?.living_room_count ? Number(details.living_room_count) : 0,
          has_elevator: details?.has_elevator || false,
          parking_info: details?.parking_info || "",
          images: images.map((img: any) => img.image_url).filter(Boolean),
          is_super_host: details?.is_super_host || false,
          review_info: reviewSummary
            ? {
                review_score: (reviewSummary.average_rating || 0) * 20,
                review_count: reviewSummary.review_count || 0,
                latest_review_date: reviewSummary.latest_review_date || "",
                review_details: reviews.map((review: any) => ({
                  user_name: review.user_name || "",
                  review_date: review.review_date || "",
                  score: (review.rating || 0) * 20,
                  text: review.comment || "",
                })),
              }
            : null,
          amenities: details?.amenities || [],
          naver_property_data: property.naver_property_data || null,
          // 월 단위 비용 정보 추가
          monthly_rent: pricing?.monthly_rent ? Number(pricing.monthly_rent) : undefined,
          monthly_maintenance: pricing?.monthly_maintenance ? Number(pricing.monthly_maintenance) : undefined,
          initial_setup_cost: pricing?.initial_setup_cost ? Number(pricing.initial_setup_cost) : undefined,
          deposit: pricing?.deposit ? Number(pricing.deposit) : undefined,
        }
      })

      // 최신 업데이트 날짜 계산
      const latestUpdate =
        data && data.length > 0
          ? new Date(Math.max(...data.map((p) => new Date(p.updated_at || p.created_at).getTime())))
          : null

      setLastUpdated(
        latestUpdate?.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }) || null,
      )

      setRooms(roomsData)
      calculateMapCenter(roomsData)
    } catch (error) {
      console.error("부동산 데이터 처리 오류:", error)
      setRooms(null)
    } finally {
      setDataLoading(false)
      setLoading(false)
    }
  }

  // 숙소 좌표의 평균을 계산하여 지도 중심 설정
  const calculateMapCenter = useCallback((roomsData: Room[]) => {
    // 유효한 좌표가 있는 방들만 필터링
    const validRooms = roomsData.filter((room) => room.latitude && room.longitude)

    if (validRooms.length === 0) {
      // 유효한 좌표가 없는 경우 기본 좌표 (서울 시청) 사용
      setMapCenter([37.5665, 126.978])
    } else {
      // 모든 좌표의 평균 계산
      const sumLat = validRooms.reduce((sum, room) => sum + (room.latitude || 0), 0)
      const sumLng = validRooms.reduce((sum, room) => sum + (room.longitude || 0), 0)

      const avgLat = sumLat / validRooms.length
      const avgLng = sumLng / validRooms.length

      setMapCenter([avgLat, avgLng])
    }

    // 지도 컴포넌트 강제 리렌더링을 위한 mapId 변경
    setMapId(`map-${Date.now()}`)
  }, [])

  // 시/도 선택 처리
  const handleCitySelect = (city: string) => {
    console.log("🎯 [프론트엔드] 시/도 선택:", city)
    setSelectedCity(city)
    fetchDistrictsByCity(city)
  }

  // 시/군/구 선택 처리
  const handleDistrictSelect = (district: string) => {
    console.log("🎯 [프론트엔드] 시/군/구 선택:", district)
    setSelectedDistrict(district)
    if (selectedCity) {
      fetchNeighborhoodsByDistrict(selectedCity, district)
    }
  }

  // 읍/면/동 선택 처리
  const handleNeighborhoodSelect = (neighborhood: RegionData) => {
    console.log("🎯 [프론트엔드] 읍/면/동 선택:", neighborhood)
    setSelectedNeighborhood(neighborhood)
    fetchPropertiesByNeighborhood(neighborhood.neighborhood_id)
  }

  // 예약률 업데이트 핸들러 추가
  const handleRoomUpdate = useCallback(
    (updatedRoom: Room) => {
      if (!rooms) return

      // rooms 배열에서 해당 room 업데이트
      const updatedRooms = rooms.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
      setRooms(updatedRooms)

      // 지도 강제 리렌더링을 위한 mapId 변경
      setMapId(`map-updated-${Date.now()}`)
    },
    [rooms],
  )

  // 고유한 숙소 유형 목록 가져오기
  const getBuildingTypes = () => {
    if (!rooms) return []
    const types = new Set<string>()
    rooms.forEach((room) => {
      if (room.building_type) {
        types.add(room.building_type)
      }
    })
    return Array.from(types).sort()
  }

  // 검색 및 정렬된 숙소 목록 가져오기
  const getFilteredRooms = () => {
    if (!rooms) return []

    let filteredRooms = [...rooms]

    // 검색어로 필터링
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase()
      filteredRooms = filteredRooms.filter(
        (room) =>
          (room.name && room.name.toLowerCase().includes(term)) ||
          (room.address && room.address.toLowerCase().includes(term)),
      )
    }

    // 숙소 유형으로 필터링
    if (buildingTypeFilter !== "all") {
      filteredRooms = filteredRooms.filter((room) => room.building_type === buildingTypeFilter)
    }

    // 정렬
    switch (sortBy) {
      case "occupancy":
        filteredRooms.sort((a, b) => b.occupancy_rate - a.occupancy_rate)
        break
      case "price":
        filteredRooms.sort((a, b) => a.weekly_price - b.weekly_price)
        break
      case "size":
        filteredRooms.sort((a, b) => b.size_pyeong - a.size_pyeong)
        break
    }

    return filteredRooms
  }

  // 주소에서 그룹화용 키 생성 (층수/호수 제거)
  const getGroupingKey = (address: string): string => {
    if (!address) return "알 수 없음"

    // 그룹화를 위해 층수/호수/세대 정보만 제거
    const cleanAddress = address
      .replace(/\s*\d*층\s*/g, "") // 4층, 지하1층 등
      .replace(/\s*반지하\s*/g, "") // 반지하
      .replace(/\s*지하\d*층?\s*/g, "") // 지하, 지하1층 등
      .replace(/\s*\d+호\s*/g, "") // 101호, 202호 등
      .replace(/\s*\d+세대\s*/g, "") // 1세대, 2세대 등
      .replace(/\s*[A-Z]\d*호?\s*/g, "") // A101호, B동 등
      .replace(/\s+/g, " ") // 연속된 공백 제거
      .trim()

    return cleanAddress
  }

  // 주소에서 건물명 추출 함수 (표시용 - 원본 주소 유지)
  const extractBuildingName = (address: string): string => {
    if (!address) return "알 수 없음"

    // 아파트/오피스텔 이름 추출을 위한 정규식 패턴
    const apartmentPattern =
      /(롯데캐슬|래미안|자이|푸르지오|더샵|힐스테이트|e편한세상|아이파크|센트럴파크|스카이뷰|파크원|파크타워|캐슬|타워|오피스텔|레지던스|아파트|빌라|맨션|하우스|스위트|팰리스|스테이|리젠시|파크|플레이스|스퀘어|포레|베이|시티|타운|빌리지|코트|테라스|가든|힐|밸리|뷰|스카이|로얄|그랜드|골드|실버|블루|그린|옐로우|레드|화이트|블랙)[\s]?([가-힣A-Za-z0-9]+)?/

    const match = address.match(apartmentPattern)
    if (match) {
      return match[0].trim()
    }

    // 동 정보 추출
    const dongPattern = /(\d+[-]?\d*)\s*동(?!\d)/
    const dongMatch = address.match(dongPattern)

    if (dongMatch) {
      const parts = address.split(" ")
      const dongIndex = parts.findIndex((part) => dongPattern.test(part))

      if (dongIndex > 0) {
        const buildingNumber = parts[dongIndex - 1]
        if (/^\d+$/.test(buildingNumber) || /^\d+[-]\d+$/.test(buildingNumber)) {
          return `${buildingNumber} ${dongMatch[0]}`
        }
        return dongMatch[0]
      }
      return dongMatch[0]
    }

    // 번지수 패턴 (예: 149, 29-1)
    const addressNumberPattern = /(\d+[-]?\d*)/
    const numberMatch = address.match(addressNumberPattern)

    if (numberMatch) {
      return numberMatch[0]
    }

    return address
  }

  const checkIfSameBuilding = (
    group1: BuildingGroup,
    group2: BuildingGroup,
    normalizedAddresses: Record<number, string>,
  ): boolean => {
    // 1. 그룹화 키가 동일한 경우
    const groupKey1 = getGroupingKey(group1.address)
    const groupKey2 = getGroupingKey(group2.address)

    if (groupKey1 === groupKey2 && groupKey1 !== "알 수 없음" && groupKey1 !== "") {
      return true
    }

    // 2. 위치 기반 확인 (위도/경도가 매우 가까운 경우)
    if (group1.latitude && group1.longitude && group2.latitude && group2.longitude) {
      const distance = calculateDistance(group1.latitude, group1.longitude, group2.latitude, group2.longitude)

      // 30미터 이내면 같은 건물로 간주
      if (distance < 0.03) {
        return true
      }
    }

    return false
  }

  // 두 지점 간의 거리 계산 (km 단위)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // 지구 반경 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const groupRoomsByBuilding = (rooms: Room[]): { singleRooms: Room[]; buildingGroups: BuildingGroup[] } => {
    const buildingGroups: Record<string, BuildingGroup> = {}
    const singleRooms: Room[] = []

    // 첫 번째 패스: 주소 정규화 및 초기 그룹화
    const normalizedAddresses: Record<number, string> = {}

    rooms.forEach((room) => {
      if (!room.address) {
        singleRooms.push(room)
        return
      }

      // 주소 정규화 (공백 제거, 소문자 변환)
      const normalizedAddress = room.address.replace(/\s+/g, " ").trim().toLowerCase()
      normalizedAddresses[room.id] = normalizedAddress

      // 그룹화용 키 생성 (층수/호수 제거)
      const groupingKey = getGroupingKey(room.address)

      // 건물명 추출 (표시용 - 원본 주소 기반)
      const buildingName = extractBuildingName(room.address)

      // 주소에서 지역 정보 추출 (시/구/동)
      const addressParts = normalizedAddress.split(" ")
      const regionParts = addressParts.slice(0, Math.min(3, addressParts.length)).join(" ")

      // 건물 그룹 키 생성 (그룹화용 키 사용)
      const groupKey = `${regionParts}_${groupingKey}`

      if (!buildingGroups[groupKey]) {
        buildingGroups[groupKey] = {
          buildingName: buildingName,
          address: room.address, // 원본 주소 유지
          rooms: [],
          averageOccupancy: 0,
          totalRooms: 0,
          buildingType: room.building_type || "기타",
          latitude: room.latitude,
          longitude: room.longitude,
          thumbnail: room.images && room.images.length > 0 ? room.images[0] : null,
          roomTypeInfo: {
            roomCount: 0,
            count: 0,
            avgWeeklyPrice: 0,
            avgWeeklyMaintenance: 0,
            avgCleaningFee: 0,
            avgOccupancyRate: 0,
            avgProfit: 0,
          },
          sizeTypes: [],
          priceBySize: {},
          cleaningFeeBySize: {},
        }
      }

      buildingGroups[groupKey].rooms.push(room)
    })

    // 두 번째 패스: 유사한 주소 병합
    const finalGroups: Record<string, BuildingGroup> = {}
    const processedKeys = new Set<string>()

    Object.entries(buildingGroups).forEach(([key, group]) => {
      if (processedKeys.has(key)) return

      processedKeys.add(key)
      finalGroups[key] = group

      // 같은 건물인지 확인하기 위한 추가 검사
      Object.entries(buildingGroups).forEach(([otherKey, otherGroup]) => {
        if (key === otherKey || processedKeys.has(otherKey)) return

        // 같은 건물인지 확인하는 조건들
        const isSameBuilding = checkIfSameBuilding(group, otherGroup, normalizedAddresses)

        if (isSameBuilding) {
          // 그룹 병합
          finalGroups[key].rooms = [...finalGroups[key].rooms, ...otherGroup.rooms]
          processedKeys.add(otherKey)
        }
      })
    })

    // 각 그룹의 평균 예약률 및 총 방 개수 계산
    const resultBuildingGroups: BuildingGroup[] = []

    Object.values(finalGroups).forEach((group) => {
      // 1개만 있는 건물은 그룹화하지 않고 개별 숙소로 처리
      if (group.rooms.length === 1) {
        singleRooms.push(group.rooms[0])
      } else {
        const totalOccupancy = group.rooms.reduce((sum, room) => sum + room.occupancy_rate, 0)
        group.averageOccupancy = totalOccupancy / group.rooms.length
        group.totalRooms = group.rooms.length

        // 방 개수별로 그룹화하여 평균 계산
        const roomsByCount: Record<number, Room[]> = {}

        group.rooms.forEach((room) => {
          const roomCount = room.room_count || 1
          if (!roomsByCount[roomCount]) {
            roomsByCount[roomCount] = []
          }
          roomsByCount[roomCount].push(room)
        })

        // 방 1개짜리 숙소 또는 방 2개짜리 숙소 선택
        let targetRoomCount = 1
        let targetRooms = roomsByCount[1] || []

        // 방 1개짜리 숙소가 없으면 방 2개짜리 숙소 사용
        if (targetRooms.length === 0) {
          targetRoomCount = 2
          targetRooms = roomsByCount[2] || []

          // 방 2개짜리도 없으면 가장 작은 방 개수 사용
          if (targetRooms.length === 0) {
            const availableRoomCounts = Object.keys(roomsByCount)
              .map(Number)
              .sort((a, b) => a - b)
            if (availableRoomCounts.length > 0) {
              targetRoomCount = availableRoomCounts[0]
              targetRooms = roomsByCount[targetRoomCount] || []
            }
          }
        }

        // 선택된 방 개수에 대한 평균 계산
        if (targetRooms.length > 0) {
          const avgWeeklyPrice = targetRooms.reduce((sum, room) => sum + room.weekly_price, 0) / targetRooms.length
          const avgWeeklyMaintenance =
            targetRooms.reduce((sum, room) => sum + (room.weekly_maintenance || 0), 0) / targetRooms.length
          const avgCleaningFee =
            targetRooms.reduce((sum, room) => sum + (room.cleaning_fee || 0), 0) / targetRooms.length
          const avgOccupancyRate = targetRooms.reduce((sum, room) => sum + room.occupancy_rate, 0) / targetRooms.length

          // 평균 순이익 계산 (주간 수입 - 주간 비용)
          // 평균 순이익 계산 (이미지의 계산 방식 적용)
          const avgProfit =
            targetRooms.reduce((sum, room) => {
              // 예약률에 따른 예약 횟수 계산
              let weeklyBookings = 1 // 기본값
              if (room.occupancy_rate >= 75) {
                weeklyBookings = 4
              } else if (room.occupancy_rate >= 50) {
                weeklyBookings = 3
              } else if (room.occupancy_rate >= 25) {
                weeklyBookings = 2
              } else {
                weeklyBookings = 1
              }

              // 수입 계산
              const weeklyAccommodationFee = room.weekly_price + (room.weekly_maintenance || 0)
              const monthlyIncome = weeklyAccommodationFee * weeklyBookings * (1 - 0.033) // 수수료 3.3% 차감
              const cleaningIncome = (room.cleaning_fee || 0) * weeklyBookings
              const totalIncome = monthlyIncome + cleaningIncome

              // 지출 계산
              const monthlyRent = room.monthly_rent || 1200000
              const monthlyMaintenance = room.monthly_maintenance || 200000
              const cleaningExpense = (room.cleaning_fee || 100000) * weeklyBookings
              const totalExpense = monthlyRent + monthlyMaintenance + cleaningExpense

              // 월 순이익
              const monthlyProfit = totalIncome - totalExpense

              return sum + monthlyProfit
            }, 0) / targetRooms.length

          group.roomTypeInfo = {
            roomCount: targetRoomCount,
            count: targetRooms.length,
            avgWeeklyPrice,
            avgWeeklyMaintenance,
            avgCleaningFee,
            avgOccupancyRate,
            avgProfit,
          }
        }

        // 정렬: 각 건물 내에서 예약률 높은 순으로 정렬
        group.rooms.sort((a, b) => b.occupancy_rate - a.occupancy_rate)

        resultBuildingGroups.push(group)
      }
    })

    // 건물 그룹을 배열로 변환하고 평균 예약률 기준으로 정렬
    return {
      singleRooms,
      buildingGroups: resultBuildingGroups.sort((a, b) => {
        if (sortBy === "occupancy") {
          return b.averageOccupancy - a.averageOccupancy
        } else if (sortBy === "price") {
          // 각 건물의 평균 가격으로 정렬
          const avgPriceA = a.rooms.reduce((sum, room) => sum + room.weekly_price, 0) / a.rooms.length
          const avgPriceB = b.rooms.reduce((sum, room) => sum + room.weekly_price, 0) / b.rooms.length
          return avgPriceA - avgPriceB
        } else {
          // size
          // 각 건물의 평균 크기로 정렬
          const avgSizeA = a.rooms.reduce((sum, room) => sum + room.size_pyeong, 0) / a.rooms.length
          const avgSizeB = b.rooms.reduce((sum, room) => sum + room.size_pyeong, 0) / b.rooms.length
          return avgSizeB - avgSizeA
        }
      }),
    }
  }

  // 전체적용 패널 토글
  const toggleBulkApplyPanel = (buildingKey: string) => {
    setBulkApplyPanels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(buildingKey)) {
        newSet.delete(buildingKey)
      } else {
        newSet.add(buildingKey)
        // 패널이 열릴 때 기본값 설정
        setBulkApplyCosts((prevCosts) => ({
          ...prevCosts,
          [buildingKey]: {
            monthlyRent: 1200000,
            monthlyMaintenance: 200000,
            cleaningCost: 100000,
          },
        }))
      }
      return newSet
    })
  }

  // 일괄 적용 비용 입력 핸들러
  const handleBulkCostChange = (
    buildingKey: string,
    field: "monthlyRent" | "monthlyMaintenance" | "cleaningCost",
    value: string,
  ) => {
    const numValue = Number.parseInt(value.replace(/[^0-9]/g, "")) || 0
    setBulkApplyCosts((prev) => ({
      ...prev,
      [buildingKey]: {
        ...prev[buildingKey],
        [field]: numValue,
      },
    }))
  }

  // 일괄 적용 실행
  const handleBulkApply = async (buildingKey: string, group: BuildingGroup) => {
    setBulkApplyLoading((prev) => new Set(prev).add(buildingKey))

    try {
      const costs = bulkApplyCosts[buildingKey]
      if (!costs) {
        throw new Error("비용 정보가 없습니다.")
      }

      // 모든 숙소에 대해 병렬로 업데이트 요청
      const updatePromises = group.rooms.map(async (room) => {
        const response = await fetch("/api/update-rental-costs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            propertyId: room.id,
            rentalCosts: {
              monthly_rent: costs.monthlyRent,
              monthly_maintenance: costs.monthlyMaintenance,
              initial_setup_cost: room.initial_setup_cost || 2000000, // 기존값 유지
              deposit: room.deposit || 10000000, // 기존값 유지
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`${room.name}: ${errorData.error || "저장 실패"}`)
        }

        return {
          ...room,
          monthly_rent: costs.monthlyRent,
          monthly_maintenance: costs.monthlyMaintenance,
        }
      })

      const updatedRooms = await Promise.all(updatePromises)

      // rooms 상태 업데이트
      if (rooms) {
        const updatedAllRooms = rooms.map((room) => {
          const updatedRoom = updatedRooms.find((ur) => ur.id === room.id)
          return updatedRoom || room
        })
        setRooms(updatedAllRooms)
      }

      // 패널 닫기
      setBulkApplyPanels((prev) => {
        const newSet = new Set(prev)
        newSet.delete(buildingKey)
        return newSet
      })

      toast({
        title: "일괄 적용 완료",
        description: `${group.rooms.length}개 숙소의 비용 정보가 성공적으로 업데이트되었습니다.`,
      })
    } catch (error: any) {
      toast({
        title: "일괄 적용 실패",
        description: error.message || "비용 정보 일괄 적용 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setBulkApplyLoading((prev) => {
        const newSet = new Set(prev)
        newSet.delete(buildingKey)
        return newSet
      })
    }
  }

  // 상단 스크롤바와 하단 컨텐츠 스크롤 동기화
  const handleTopScroll = useCallback(() => {
    if (isScrolling || !topScrollRef.current || !propertyListRef.current) return

    setIsScrolling(true)
    propertyListRef.current.scrollLeft = topScrollRef.current.scrollLeft

    setTimeout(() => setIsScrolling(false), 10)
  }, [isScrolling])

  const handleContentScroll = useCallback(() => {
    if (isScrolling || !topScrollRef.current || !propertyListRef.current) return

    setIsScrolling(true)
    topScrollRef.current.scrollLeft = propertyListRef.current.scrollLeft

    setTimeout(() => setIsScrolling(false), 10)
  }, [isScrolling])

  // 필터링된 숙소 목록을 메모이제이션하여 성능 최적화
  const filteredRooms = useMemo(() => getFilteredRooms(), [rooms, searchTerm, buildingTypeFilter, sortBy])

  // 건물별로 그룹화된 숙소 목록
  const { singleRooms, buildingGroups } = useMemo(() => groupRoomsByBuilding(filteredRooms), [filteredRooms])

  // 건물 그룹 확장/축소 토글
  const toggleBuildingExpand = (buildingKey: string) => {
    setExpandedBuildings((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(buildingKey)) {
        newSet.delete(buildingKey)
      } else {
        newSet.add(buildingKey)
      }
      return newSet
    })
  }

  // 필터 변경 시 맵 업데이트
  useEffect(() => {
    if (filteredRooms.length > 0) {
      // 필터링된 숙소의 좌표 평균으로 맵 중심 재계산
      calculateMapCenter(filteredRooms)
    }
  }, [buildingTypeFilter, calculateMapCenter, filteredRooms]) // 숙소 유형 필터가 변경될 때만 맵 중심 재계산

  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    return num.toLocaleString("ko-KR")
  }

  // 마커 클릭 시 해당 숙소 카드로 스크롤
  const handleMarkerClick = (roomId: string) => {
    setSelectedRoomId(roomId)

    // 해당 숙소가 속한 건물 그룹 찾기
    let foundInGroup = false

    // 건물 그룹에서 찾기
    for (const group of buildingGroups) {
      const roomInGroup = group.rooms.find((room) => room.id === roomId)
      if (roomInGroup) {
        // 해당 건물 그룹 확장
        const buildingKey = `${group.buildingName}_${buildingGroups.indexOf(group)}`
        if (!expandedBuildings.has(buildingKey)) {
          setExpandedBuildings((prev) => new Set(prev).add(buildingKey))
        }
        foundInGroup = true

        // 약간의 지연 후 스크롤 (그룹 확장 후 DOM이 업데이트되도록)
        setTimeout(() => {
          const roomElement = roomCardRefs.current[roomId]
          if (roomElement && propertyListRef.current) {
            // 스크롤 위치 계산 (카드 위치 - 컨테이너 위치 + 약간의 오프셋)
            const containerRect = propertyListRef.current.getBoundingClientRect()
            const roomRect = roomElement.getBoundingClientRect()
            const scrollLeft = roomRect.left - containerRect.left + propertyListRef.current.scrollLeft - 20

            // 부드러운 스크롤 애니메이션
            propertyListRef.current.scrollTo({
              left: scrollLeft,
              behavior: "smooth",
            })

            // 시각적 강조 효과
            roomElement.classList.add("ring-4", "ring-primary", "ring-opacity-70")
            setTimeout(() => {
              roomElement.classList.remove("ring-4", "ring-primary", "ring-opacity-70")
            }, 2000)
          }
        }, 100)
        break
      }
    }

    // 개별 숙소에서 찾기
    if (!foundInGroup) {
      const roomElement = roomCardRefs.current[roomId]
      if (roomElement && propertyListRef.current) {
        // 스크롤 위치 계산
        const containerRect = propertyListRef.current.getBoundingClientRect()
        const roomRect = roomElement.getBoundingClientRect()
        const scrollLeft = roomRect.left - containerRect.left + propertyListRef.current.scrollLeft - 20

        // 부드러운 스크롤 애니메이션
        propertyListRef.current.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        })

        // 시각적 강조 효과
        roomElement.classList.add("ring-4", "ring-primary", "ring-opacity-70")
        setTimeout(() => {
          roomElement.classList.remove("ring-4", "ring-primary", "ring-opacity-70")
        }, 2000)
      }
    }
  }

  // 컨텐츠 너비 계산을 위한 useEffect 추가:
  useEffect(() => {
    if (topScrollRef.current && propertyListRef.current) {
      // 실제 컨텐츠 너비에 맞춰 상단 스크롤바 너비 조정
      const contentWidth = propertyListRef.current.scrollWidth
      const containerWidth = propertyListRef.current.clientWidth

      if (topScrollRef.current.firstElementChild) {
        ;(topScrollRef.current.firstElementChild as HTMLElement).style.width = `${contentWidth}px`
      }
    }
  }, [filteredRooms, expandedBuildings])

  const [periodMonths, setPeriodMonths] = useState<1 | 2 | 3>(1)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">지역 숙소 확인</h1>

      {loading && cities.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">지역 데이터를 불러오는 중...</span>
        </div>
      ) : cities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">접근 권한이 있는 지역 데이터가 없습니다.</p>
            {isAdmin && (
              <Button asChild className="mt-4">
                <Link href="/analysis">데이터 분석하기</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 지역 선택 (3단계) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 시/도 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>시/도 선택</CardTitle>
                <CardDescription>접근 권한이 있는 시/도 목록입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cities.map((city) => (
                    <Button
                      key={city}
                      variant={selectedCity === city ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 시/군/구 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>시/군/구 선택</CardTitle>
                <CardDescription>
                  {selectedCity ? `${selectedCity}의 시/군/구 목록입니다.` : "시/도를 먼저 선택하세요."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCity && districts.length > 0 ? (
                  <div className="space-y-2">
                    {districts.map((district) => (
                      <Button
                        key={district}
                        variant={selectedDistrict === district ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleDistrictSelect(district)}
                      >
                        {district}
                      </Button>
                    ))}
                  </div>
                ) : selectedCity && districts.length === 0 && !loading ? (
                  <p className="text-sm text-muted-foreground">접근 권한이 있는 시/군/구가 없습니다.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">시/도를 선택하면 시/군/구 목록이 표시됩니다.</p>
                )}
              </CardContent>
            </Card>

            {/* 읍/면/동 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>읍/면/동 선택</CardTitle>
                <CardDescription>
                  {selectedDistrict ? `${selectedDistrict}의 읍/면/동 목록입니다.` : "시/군/구를 먼저 선택하세요."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDistrict && neighborhoods.length > 0 ? (
                  <div className="space-y-2">
                    {neighborhoods.map((neighborhood) => (
                      <Button
                        key={neighborhood.neighborhood_id}
                        variant={
                          selectedNeighborhood?.neighborhood_id === neighborhood.neighborhood_id ? "default" : "outline"
                        }
                        className="w-full justify-start text-left"
                        onClick={() => handleNeighborhoodSelect(neighborhood)}
                      >
                        <div className="truncate">
                          <div className="font-medium">{neighborhood.neighborhood_name}</div>
                          <div className="text-xs text-muted-foreground">{neighborhood.property_count}개 매물</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : selectedDistrict && neighborhoods.length === 0 && !loading ? (
                  <p className="text-sm text-muted-foreground">접근 권한이 있는 읍/면/동이 없습니다.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">시/군/구를 선택하면 읍/면/동 목록이 표시됩니다.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 지도 표시 */}
          {selectedNeighborhood && rooms && rooms.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedNeighborhood.city_name} {selectedNeighborhood.district_name}{" "}
                    {selectedNeighborhood.neighborhood_name} 지역 매물 지도
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">예약률 기간:</span>
                    <Select
                      value={periodMonths.toString()}
                      onValueChange={(value) => setPeriodMonths(Number(value) as 1 | 2 | 3)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1개월</SelectItem>
                        <SelectItem value="2">2개월</SelectItem>
                        <SelectItem value="3">3개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  <div>
                    <div>
                      {filteredRooms.length > 0
                        ? `총 ${filteredRooms.length}개의 매물이 표시됩니다. 마커를 클릭하면 해당 숙소 카드로 이동합니다.`
                        : "필터 조건에 맞는 매물이 없습니다."}
                    </div>
                    {lastUpdated && (
                      <div className="text-xs text-muted-foreground mt-1">최종 업데이트: {lastUpdated}</div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-sm">0-25%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-sm">25-50%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-sm">50-75%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-sm">75-100%</span>
                      </div>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {filteredRooms.length > 0 ? (
                    <MapClientComponent
                      rooms={filteredRooms} // 필터링된 숙소 목록 전달
                      periodMonths={periodMonths}
                      center={mapCenter}
                      mapId={mapId}
                      key={mapId}
                      onMarkerClick={handleMarkerClick} // 마커 클릭 핸들러 전달
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">필터 조건에 맞는 매물이 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 숙소 목록 */}
          <div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">데이터를 불러오는 중...</span>
              </div>
            ) : !selectedCity ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">접근 권한이 있는 시/도가 없습니다.</p>
                </CardContent>
              </Card>
            ) : !selectedDistrict ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">접근 권한이 있는 시/군/구가 없습니다.</p>
                </CardContent>
              </Card>
            ) : neighborhoods.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">접근 권한이 있는 읍/면/동이 없습니다.</p>
                </CardContent>
              </Card>
            ) : !selectedNeighborhood ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">읍/면/동을 선택하세요.</p>
                </CardContent>
              </Card>
            ) : dataLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">매물 데이터를 불러오는 중...</span>
              </div>
            ) : !rooms || rooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">선택한 지역에 매물 정보가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* 필터 및 검색 옵션 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="w-full md:w-auto">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="숙소 이름 또는 주소로 검색"
                            className="pl-10 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground whitespace-nowrap">정렬:</p>
                          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="정렬 기준" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="occupancy">예약률 높은 순</SelectItem>
                              <SelectItem value="price">가격 낮은 순</SelectItem>
                              <SelectItem value="size">평수 넓은 순</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* 필터 상태 표시 */}
                    {(searchTerm || buildingTypeFilter !== "all") && (
                      <div className="flex items-center gap-2 mt-4">
                        <p className="text-sm text-muted-foreground">필터 적용됨:</p>
                        <div className="flex flex-wrap gap-2">
                          {searchTerm && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              검색: {searchTerm}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => setSearchTerm("")}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          )}
                          {buildingTypeFilter !== "all" && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              숙소 유형: {buildingTypeFilter}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => setBuildingTypeFilter("all")}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          )}
                          {(searchTerm || buildingTypeFilter !== "all") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => {
                                setSearchTerm("")
                                setBuildingTypeFilter("all")
                              }}
                            >
                              모든 필터 초기화
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 숙소 유형 필터 */}
                <Card>
                  <CardHeader>
                    <CardTitle>숙소 유형 필터</CardTitle>
                    <CardDescription>보고 싶은 숙소 유형을 선택하세요.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={buildingTypeFilter === "all" ? "default" : "outline"}
                        onClick={() => setBuildingTypeFilter("all")}
                      >
                        모든 유형
                      </Button>
                      {getBuildingTypes().map((type) => (
                        <Button
                          key={type}
                          variant={buildingTypeFilter === type ? "default" : "outline"}
                          onClick={() => setBuildingTypeFilter(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 숙소 목록 */}
                <Card>
                  <CardHeader>
                    <CardTitle>숙소 목록</CardTitle>
                    <CardDescription>
                      {filteredRooms.length}개의 숙소가 있습니다. 가로로 스크롤하여 더 많은 숙소를 확인하세요.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredRooms.length > 0 ? (
                      <div className="relative">
                        {/* 상단 스크롤바 - 실제 스크롤 기능 */}
                        <div ref={topScrollRef} className="overflow-x-auto mb-4 h-4" onScroll={handleTopScroll}>
                          <div
                            style={{
                              height: "1px",
                              width: "200%", // 실제 컨텐츠 너비와 맞춰야 함
                            }}
                          />
                        </div>

                        {/* 실제 컨텐츠 스크롤 영역 */}
                        <div
                          ref={propertyListRef}
                          className="flex overflow-x-auto space-x-4"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                          onScroll={handleContentScroll}
                        >
                          {/* 개별 숙소 카드 */}
                          {singleRooms.map((room) => (
                            <div
                              key={room.id}
                              ref={(el) => (roomCardRefs.current[room.id] = el)}
                              className={`transition-all duration-300 flex-shrink-0 ${selectedRoomId === room.id ? "scale-105" : ""}`}
                            >
                              <PropertyCard
                                room={room}
                                onRoomUpdate={handleRoomUpdate}
                                onClick={() => {
                                  // 숙소 상세 페이지로 이동 또는 상세 정보 표시 (추후 구현)
                                }}
                              />
                            </div>
                          ))}

                          {/* 건물 그룹 카드 */}
                          {buildingGroups.map((group, index) => {
                            const buildingKey = `${group.buildingName}_${index}`
                            const isExpanded = expandedBuildings.has(buildingKey)

                            return (
                              <div key={buildingKey} className="flex-shrink-0">
                                <div className="flex flex-row space-x-4">
                                  {/* 메인 건물 카드 - 항상 고정 크기 유지 */}
                                  <div className="flex-none w-[300px]">
                                    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                                      <div className="aspect-video relative bg-muted">
                                        {group.thumbnail ? (
                                          <img
                                            src={group.thumbnail || "/placeholder.svg"}
                                            alt={group.buildingName}
                                            className="object-cover w-full h-full"
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full">
                                            <Building className="w-12 h-12 text-muted-foreground" />
                                          </div>
                                        )}
                                        <Badge className="absolute top-2 right-2 bg-primary">
                                          평균 예약률 {Math.round(group.averageOccupancy)}%
                                        </Badge>
                                        <Badge className="absolute top-2 left-2 bg-secondary">
                                          {group.totalRooms}개 숙소
                                        </Badge>
                                      </div>
                                      <CardContent className="p-4">
                                        <h3 className="font-semibold truncate">{group.buildingName}</h3>
                                        <p className="text-sm text-muted-foreground truncate flex items-center">
                                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                          {group.address}
                                        </p>

                                        {/* 평수 종류 및 가격 정보 대신 방 개수별 정보 표시 */}
                                        <div className="mt-3 space-y-2">
                                          <h4 className="text-xs font-medium text-muted-foreground">
                                            {group.roomTypeInfo.roomCount}개 방 기준 ({group.roomTypeInfo.count}개 숙소)
                                          </h4>

                                          <div className="text-sm space-y-1 mt-1">
                                            <div className="flex justify-between">
                                              <span>평균 주간 렌트비:</span>
                                              <span className="font-medium">
                                                {formatNumber(Math.round(group.roomTypeInfo.avgWeeklyPrice))}원
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>평균 주간 관리비:</span>
                                              <span className="font-medium">
                                                {formatNumber(Math.round(group.roomTypeInfo.avgWeeklyMaintenance))}원
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>평균 청소비:</span>
                                              <span className="font-medium">
                                                {formatNumber(Math.round(group.roomTypeInfo.avgCleaningFee))}원
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>평균 예약률:</span>
                                              <span className="font-medium">
                                                {Math.round(group.roomTypeInfo.avgOccupancyRate)}%
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>평균 월 순이익(예약률기준):</span>
                                              <span
                                                className={`font-medium ${group.roomTypeInfo.avgProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                                              >
                                                {formatNumber(Math.round(group.roomTypeInfo.avgProfit))}원
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 전체보기 버튼 */}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full mt-4 bg-transparent"
                                          onClick={() => toggleBuildingExpand(buildingKey)}
                                        >
                                          {isExpanded ? (
                                            <>
                                              <ChevronDown className="h-4 w-4 mr-1" />
                                              접기
                                            </>
                                          ) : (
                                            <>
                                              <ChevronRight className="h-4 w-4 mr-1" />
                                              전체보기 ({group.totalRooms}개)
                                            </>
                                          )}
                                        </Button>
                                        {/* 전체적용 버튼 */}
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="w-full mt-2"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleBulkApplyPanel(buildingKey)
                                          }}
                                        >
                                          {bulkApplyPanels.has(buildingKey) ? (
                                            <>
                                              <ChevronUp className="h-4 w-4 mr-1" />
                                              전체적용 닫기
                                            </>
                                          ) : (
                                            <>
                                              <Settings className="h-4 w-4 mr-1" />
                                              전체적용
                                            </>
                                          )}
                                        </Button>

                                        {/* 전체적용 패널 */}
                                        {bulkApplyPanels.has(buildingKey) && (
                                          <div className="mt-4 p-4 border rounded-md bg-gray-50">
                                            <h5 className="text-sm font-medium mb-3">전체 숙소 비용 일괄 적용</h5>
                                            <div className="space-y-3">
                                              <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                  월 임대료
                                                </label>
                                                <div className="relative">
                                                  <Input
                                                    value={formatNumber(
                                                      bulkApplyCosts[buildingKey]?.monthlyRent || 1200000,
                                                    )}
                                                    onChange={(e) =>
                                                      handleBulkCostChange(buildingKey, "monthlyRent", e.target.value)
                                                    }
                                                    className="pl-6"
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                    ₩
                                                  </span>
                                                </div>
                                              </div>
                                              <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                  월 관리비
                                                </label>
                                                <div className="relative">
                                                  <Input
                                                    value={formatNumber(
                                                      bulkApplyCosts[buildingKey]?.monthlyMaintenance || 200000,
                                                    )}
                                                    onChange={(e) =>
                                                      handleBulkCostChange(
                                                        buildingKey,
                                                        "monthlyMaintenance",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="pl-6"
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                    ₩
                                                  </span>
                                                </div>
                                              </div>
                                              <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                  청소비 (1회당)
                                                </label>
                                                <div className="relative">
                                                  <Input
                                                    value={formatNumber(
                                                      bulkApplyCosts[buildingKey]?.cleaningCost || 100000,
                                                    )}
                                                    onChange={(e) =>
                                                      handleBulkCostChange(buildingKey, "cleaningCost", e.target.value)
                                                    }
                                                    className="pl-6"
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                    ₩
                                                  </span>
                                                </div>
                                              </div>
                                              <Button
                                                className="w-full"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleBulkApply(buildingKey, group)
                                                }}
                                                disabled={bulkApplyLoading.has(buildingKey)}
                                              >
                                                {bulkApplyLoading.has(buildingKey) ? (
                                                  <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    적용 중...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    모두 적용 ({group.rooms.length}개 숙소)
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* 확장 시 개별 숙소 카드들 (우측에 나열) */}
                                  {isExpanded && (
                                    <div className="flex space-x-4">
                                      {group.rooms.map((room) => (
                                        <div
                                          key={room.id}
                                          ref={(el) => (roomCardRefs.current[room.id] = el)}
                                          className={`transition-all duration-300 flex-shrink-0 ${selectedRoomId === room.id ? "scale-105" : ""}`}
                                        >
                                          <PropertyCard
                                            key={room.id}
                                            room={room}
                                            onRoomUpdate={handleRoomUpdate}
                                            onClick={() => {
                                              // 숙소 상세 페이지로 이동 또는 상세 정보 표시 (추후 구현)
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* 하단 컨텐츠 스크롤바 숨기기 위한 CSS */}
                        <style jsx>{`
                          div[ref="propertyListRef"]::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                        {(searchTerm || buildingTypeFilter !== "all") && (
                          <Button
                            variant="outline"
                            className="mt-4 bg-transparent"
                            onClick={() => {
                              setSearchTerm("")
                              setBuildingTypeFilter("all")
                            }}
                          >
                            필터 초기화
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
