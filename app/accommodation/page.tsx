"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, MapPin, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Room } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { MapClientComponent } from "@/components/map-client-component"
import Link from "next/link"

interface RegionData {
  neighborhood_id: number
  city_name: string
  district_name: string
  neighborhood_name: string
  created_at: string
  property_count: number
}

export default function AccommodationPage() {
  const [cities, setCities] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [neighborhoods, setNeighborhoods] = useState<RegionData[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<RegionData | null>(null)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [filteredRooms, setFilteredRooms] = useState<Room[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [periodMonths, setPeriodMonths] = useState<1 | 2 | 3>(1)
  const { isAdmin, user } = useAuth()
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const supabase = createClient()

  // 검색 및 필터링 로직
  useEffect(() => {
    if (!rooms) {
      setFilteredRooms(null)
      return
    }

    let filtered = [...rooms]

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((room) => {
        return (
          room.name.toLowerCase().includes(query) ||
          room.address.toLowerCase().includes(query) ||
          room.building_type.toLowerCase().includes(query)
        )
      })
    }

    // 건물 유형 필터링
    if (buildingTypeFilter !== "all") {
      filtered = filtered.filter((room) => room.building_type === buildingTypeFilter)
    }

    setFilteredRooms(filtered)
  }, [rooms, searchQuery, buildingTypeFilter])

  // 시/도 목록 가져오기
  useEffect(() => {
    async function fetchCities() {
      setLoading(true)
      try {
        const response = await fetch("/api/regions?level=provinces")
        const result = await response.json()

        if (result.success) {
          setCities(result.data)
          if (result.data.length > 0 && !selectedCity) {
            setSelectedCity(result.data[0])
            fetchDistrictsByCity(result.data[0])
          } else {
            setLoading(false)
          }
        } else {
          setCities([])
          setLoading(false)
        }
      } catch (error) {
        setCities([])
        setLoading(false)
      }
    }

    fetchCities()
  }, [user])

  // 시/군/구 목록 가져오기
  const fetchDistrictsByCity = async (cityName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/regions?level=districts&province=${encodeURIComponent(cityName)}`)
      const result = await response.json()

      if (result.success) {
        setDistricts(result.data)
        if (result.data.length > 0) {
          setSelectedDistrict(result.data[0])
          fetchNeighborhoodsByDistrict(cityName, result.data[0])
        } else {
          setNeighborhoods([])
          setSelectedDistrict(null)
          setSelectedNeighborhood(null)
          setRooms(null)
          setLoading(false)
        }
      } else {
        setDistricts([])
        setNeighborhoods([])
        setSelectedDistrict(null)
        setSelectedNeighborhood(null)
        setRooms(null)
        setLoading(false)
      }
    } catch (error) {
      setDistricts([])
      setNeighborhoods([])
      setSelectedDistrict(null)
      setSelectedNeighborhood(null)
      setRooms(null)
      setLoading(false)
    }
  }

  // 읍/면/동 목록 가져오기
  const fetchNeighborhoodsByDistrict = async (cityName: string, districtName: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/regions?level=dongs&province=${encodeURIComponent(cityName)}&district=${encodeURIComponent(districtName)}`,
      )
      const result = await response.json()

      if (result.success) {
        const neighborhoodNames = result.data

        const { data: neighborhoodDetails, error } = await supabase
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
          .in("neighborhood_name", neighborhoodNames)
          .order("created_at", { ascending: false })

        if (error) {
          setNeighborhoods([])
          setSelectedNeighborhood(null)
          setRooms(null)
          setLoading(false)
          return
        }

        const neighborhoodData: RegionData[] = neighborhoodDetails.map((item) => ({
          neighborhood_id: item.neighborhood_id,
          city_name: cityName,
          district_name: districtName,
          neighborhood_name: item.neighborhood_name,
          created_at: item.created_at,
          property_count: item.properties?.[0]?.count || 0,
        }))

        setNeighborhoods(neighborhoodData)

        if (neighborhoodData.length > 0) {
          setSelectedNeighborhood(neighborhoodData[0])
          fetchPropertiesByNeighborhood(neighborhoodData[0].neighborhood_id)
        } else {
          setSelectedNeighborhood(null)
          setRooms(null)
          setLoading(false)
        }
      } else {
        setNeighborhoods([])
        setSelectedNeighborhood(null)
        setRooms(null)
        setLoading(false)
      }
    } catch (error) {
      setNeighborhoods([])
      setSelectedNeighborhood(null)
      setRooms(null)
      setLoading(false)
    }
  }

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

        return {
          id: property.id,
          property_id: property.property_id?.toString() || null,
          name: property.name || "",
          address: property.address || "",
          latitude: property.latitude,
          longitude: property.longitude,
          building_type: details?.building_type || property.building_type || property.property_type || "",
          size_pyeong: details?.size_pyeong || property.size_pyeong || 0,
          size_m2: details?.size_m2 || property.size_m2 || null,
          room_type: details?.room_type || property.room_type || null,
          room_count: details?.bedrooms || property.room_count || 1,
          weekly_price: pricing?.weekly_price || property.weekly_price || 0,
          weekly_maintenance: pricing?.weekly_maintenance || property.weekly_maintenance || 0,
          cleaning_fee: pricing?.cleaning_fee || property.cleaning_fee || 0,
          discount_2weeks: pricing?.discount_2weeks || property.discount_2weeks || 0,
          discount_3weeks: pricing?.discount_3weeks || property.discount_3weeks || 0,
          discount_4weeks: pricing?.discount_4weeks || property.discount_4weeks || 0,
          discount_5weeks: pricing?.discount_5weeks || property.discount_5weeks || 0,
          discount_6weeks: pricing?.discount_6weeks || property.discount_6weeks || 0,
          discount_7weeks: pricing?.discount_7weeks || property.discount_7weeks || 0,
          discount_8weeks: pricing?.discount_8weeks || property.discount_8weeks || 0,
          discount_9weeks: pricing?.discount_9weeks || property.discount_9weeks || 0,
          discount_10weeks: pricing?.discount_10weeks || property.discount_10weeks || 0,
          discount_11weeks: pricing?.discount_11weeks || property.discount_11weeks || 0,
          discount_12weeks: pricing?.discount_12weeks || property.discount_12weeks || 0,
          occupancy_rate: occupancy?.occupancy_rate || property.occupancy_rate || 0,
          occupancy_2rate: occupancy?.occupancy_2rate || property.occupancy_2rate || 0,
          occupancy_3rate: occupancy?.occupancy_3rate || property.occupancy_3rate || 0,
          bathroom_count: details?.bathrooms || property.bathroom_count || 0,
          kitchen_count: details?.kitchen_count || property.kitchen_count || 0,
          living_room_count: details?.living_room_count || property.living_room_count || 0,
          has_elevator: details?.has_elevator || property.has_elevator || false,
          parking_info: details?.parking_info || property.parking_info || "",
          images: images.map((img: any) => img.image_url).filter(Boolean),
          is_super_host: details?.is_super_host || property.is_super_host || false,
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
          amenities: details?.amenities || property.amenities || [],
          naver_property_data: property.naver_property_data || null,
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
    } catch (error) {
      console.error("부동산 데이터 처리 오류:", error)
      setRooms(null)
    } finally {
      setDataLoading(false)
      setLoading(false)
    }
  }

  // 예약률 업데이트 처리 함수
  const handleRoomUpdate = (updatedRoom: Room) => {
    if (rooms) {
      const updatedRooms = rooms.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
      setRooms(updatedRooms)
    }
  }

  // 시/도 선택 처리
  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setSearchQuery("")
    fetchDistrictsByCity(city)
  }

  // 시/군/구 선택 처리
  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district)
    setSearchQuery("")
    if (selectedCity) {
      fetchNeighborhoodsByDistrict(selectedCity, district)
    }
  }

  // 읍/면/동 선택 처리
  const handleNeighborhoodSelect = (neighborhood: RegionData) => {
    setSelectedNeighborhood(neighborhood)
    setSearchQuery("")
    fetchPropertiesByNeighborhood(neighborhood.neighborhood_id)
  }

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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">숙소 확인</h1>

      {loading && cities.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">지역 데이터를 불러오는 중...</span>
        </div>
      ) : cities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {user && !isAdmin ? "접근 권한이 있는 지역 데이터가 없습니다." : "아직 분석된 지역 데이터가 없습니다."}
            </p>
            {isAdmin && (
              <Button asChild className="mt-4">
                <Link href="/analysis">데이터 분석하기</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 지역 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 시/도 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>시/도 선택</CardTitle>
                <CardDescription>
                  {user && !isAdmin ? "접근 권한이 있는 시/도 목록입니다." : "분석 데이터가 있는 시/도 목록입니다."}
                </CardDescription>
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
            {selectedCity && districts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>시/군/구 선택</CardTitle>
                  <CardDescription>{selectedCity}의 시/군/구 목록입니다.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* 읍/면/동 선택 */}
            {selectedDistrict && neighborhoods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>읍/면/동 선택</CardTitle>
                  <CardDescription>{selectedDistrict}의 읍/면/동 목록입니다.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* 지도 표시 */}
          {selectedNeighborhood && filteredRooms && filteredRooms.length > 0 && (
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
                        ? `총 ${filteredRooms.length}개의 매물이 표시됩니다.`
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
                  <MapClientComponent
                    rooms={filteredRooms}
                    periodMonths={periodMonths}
                    mapId={`accommodation-map-${selectedNeighborhood.neighborhood_id}-${periodMonths}`}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 필터 및 검색 */}
          {selectedNeighborhood && rooms && rooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>숙소 필터</CardTitle>
                <CardDescription>원하는 조건으로 숙소를 필터링하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 검색 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="숙소명, 주소, 건물 유형으로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* 건물 유형 필터 */}
                  <div>
                    <p className="text-sm font-medium mb-2">건물 유형</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={buildingTypeFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBuildingTypeFilter("all")}
                      >
                        전체
                      </Button>
                      {getBuildingTypes().map((type) => (
                        <Button
                          key={type}
                          variant={buildingTypeFilter === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBuildingTypeFilter(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 필터 상태 */}
                  {(searchQuery || buildingTypeFilter !== "all") && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">적용된 필터:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            검색: {searchQuery}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => setSearchQuery("")}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )}
                        {buildingTypeFilter !== "all" && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            유형: {buildingTypeFilter}
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
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 숙소 목록 */}
          {selectedNeighborhood && (
            <Card>
              <CardHeader>
                <CardTitle>숙소 목록</CardTitle>
                <CardDescription>
                  {dataLoading
                    ? "데이터를 불러오는 중..."
                    : filteredRooms
                      ? `${filteredRooms.length}개의 숙소가 있습니다.`
                      : "숙소 정보가 없습니다."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">매물 데이터를 불러오는 중...</span>
                  </div>
                ) : !filteredRooms || filteredRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {!rooms || rooms.length === 0
                        ? "선택한 지역에 매물 정보가 없습니다."
                        : "검색 조건에 맞는 숙소가 없습니다."}
                    </p>
                    {(searchQuery || buildingTypeFilter !== "all") && (
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => {
                          setSearchQuery("")
                          setBuildingTypeFilter("all")
                        }}
                      >
                        필터 초기화
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map((room) => (
                      <Card key={room.id} className="hover:shadow-md transition-shadow">
                        <div className="aspect-video relative bg-muted">
                          {room.images && room.images.length > 0 ? (
                            <img
                              src={room.images[0] || "/placeholder.svg"}
                              alt={room.name}
                              className="object-cover w-full h-full rounded-t-lg"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <MapPin className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          <Badge className="absolute top-2 right-2 bg-primary">예약률 {room.occupancy_rate}%</Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{room.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{room.address}</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>건물유형:</span>
                              <span>{room.building_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>평수:</span>
                              <span>{room.size_pyeong}평</span>
                            </div>
                            <div className="flex justify-between">
                              <span>주간 렌트비:</span>
                              <span className="font-medium">{room.weekly_price.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                              <span>예약률:</span>
                              <span className="font-medium">{room.occupancy_rate}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
