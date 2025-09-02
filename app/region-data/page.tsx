"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin } from "lucide-react"
import Link from "next/link"
import { DeleteRegionDataButton } from "@/components/delete-region-data-button"
import { useAuth } from "@/contexts/auth-context"
import { MarketAnalysis } from "@/components/market-analysis"
import { PriceAnalysis } from "@/components/price-analysis"
import { OccupancyAnalysis } from "@/components/occupancy-analysis"
import { TopProperties } from "@/components/top-properties"
import { AIAnalysisSummary } from "@/components/ai-analysis-summary"
import type { Room } from "@/lib/types"

interface RegionData {
  neighborhood_id: number
  city_name: string
  district_name: string
  neighborhood_name: string
  created_at: string
  property_count: number
}

export default function RegionDataPage() {
  const [cities, setCities] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [neighborhoods, setNeighborhoods] = useState<RegionData[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<RegionData | null>(null)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const { isAdmin, user } = useAuth()

  // Supabase 클라이언트 생성
  const supabase = createClient()

  // 시/도 목록 가져오기
  useEffect(() => {
    async function fetchCities() {
      setLoading(true)
      try {
        // 데이터베이스에서 직접 시/도 목록 가져오기
        const response = await fetch("/api/regions?level=provinces")
        const result = await response.json()

        if (result.success) {
          setCities(result.data)

          // 첫 번째 시/도 자동 선택
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
  }, [user]) // user가 변경될 때마다 다시 로드

  // 시/군/구 목록 가져오기
  const fetchDistrictsByCity = async (cityName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/regions?level=districts&province=${encodeURIComponent(cityName)}`)
      const result = await response.json()

      if (result.success) {
        setDistricts(result.data)

        // 첫 번째 시/군/구 자동 선택
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
      // 데이터베이스에서 직접 읍/면/동 목록 가져오기
      const response = await fetch(
        `/api/regions?level=dongs&province=${encodeURIComponent(cityName)}&district=${encodeURIComponent(districtName)}`,
      )
      const result = await response.json()

      if (result.success) {
        // 읍/면/동 이름 목록을 가져온 후, 각 읍/면/동의 상세 정보 조회
        const neighborhoodNames = result.data

        // 각 읍/면/동의 상세 정보 조회
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

        // 데이터 변환
        const neighborhoodData: RegionData[] = neighborhoodDetails.map((item) => ({
          neighborhood_id: item.neighborhood_id,
          city_name: cityName,
          district_name: districtName,
          neighborhood_name: item.neighborhood_name,
          created_at: item.created_at,
          property_count: item.properties?.[0]?.count || 0,
        }))

        setNeighborhoods(neighborhoodData)

        // 첫 번째 읍/면/동 자동 선택
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
    } finally {
      setLoading(false)
    }
  }

  // 선택한 읍/면/동의 부동산 데이터 가져오기 - 분석용
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

  // 읍/면/동 선택 처리
  const handleNeighborhoodSelect = (neighborhood: RegionData) => {
    setSelectedNeighborhood(neighborhood)
    fetchPropertiesByNeighborhood(neighborhood.neighborhood_id)
  }

  // 시/도 선택 처리
  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    fetchDistrictsByCity(city)
  }

  // 시/군/구 선택 처리
  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district)
    if (selectedCity) {
      fetchNeighborhoodsByDistrict(selectedCity, district)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">지역별 매물 데이터</h1>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
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
              <Card className="mt-6">
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
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>읍/면/동 선택</CardTitle>
                  <CardDescription>{selectedDistrict}의 읍/면/동 목록입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {neighborhoods.map((neighborhood) => (
                      <div key={neighborhood.neighborhood_id} className="flex items-center gap-2">
                        <Button
                          variant={
                            selectedNeighborhood?.neighborhood_id === neighborhood.neighborhood_id
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-start text-left"
                          onClick={() => handleNeighborhoodSelect(neighborhood)}
                        >
                          <div className="truncate">
                            <div className="font-medium">{neighborhood.neighborhood_name}</div>
                            <div className="text-xs text-muted-foreground">{neighborhood.property_count}개 매물</div>
                          </div>
                        </Button>
                        {isAdmin && (
                          <DeleteRegionDataButton
                            dataId={neighborhood.neighborhood_id}
                            title={neighborhood.neighborhood_name}
                            location={`${neighborhood.city_name} ${neighborhood.district_name} ${neighborhood.neighborhood_name}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">데이터를 불러오는 중...</span>
              </div>
            ) : !selectedCity ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">왼쪽에서 시/도를 선택하세요.</p>
                </CardContent>
              </Card>
            ) : !selectedDistrict ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">왼쪽에서 시/군/구를 선택하세요.</p>
                </CardContent>
              </Card>
            ) : neighborhoods.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {user && !isAdmin ? "접근 권한이 있는 지역이 없습니다." : "선택한 지역에 데이터가 없습니다."}
                  </p>
                </CardContent>
              </Card>
            ) : !selectedNeighborhood ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">왼쪽에서 읍/면/동을 선택하세요.</p>
                </CardContent>
              </Card>
            ) : dataLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">분석 데이터를 불러오는 중...</span>
              </div>
            ) : !rooms || rooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">선택한 지역에 분석할 매물 정보가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* 분석결과 헤더 */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>분석결과</CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {selectedNeighborhood.city_name} {selectedNeighborhood.district_name}{" "}
                            {selectedNeighborhood.neighborhood_name}
                          </div>
                          {lastUpdated && (
                            <div className="text-xs text-muted-foreground">최종 업데이트: {lastUpdated}</div>
                          )}
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <DeleteRegionDataButton
                          dataId={selectedNeighborhood.neighborhood_id}
                          title={selectedNeighborhood.neighborhood_name}
                          location={`${selectedNeighborhood.city_name} ${selectedNeighborhood.district_name} ${selectedNeighborhood.neighborhood_name}`}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <div className="flex items-center justify-between w-full">
                      <div className="text-sm">총 {rooms.length}개의 매물 데이터가 분석되었습니다.</div>
                    </div>
                  </CardFooter>
                </Card>

                {/* 분석 탭 */}
                <Tabs defaultValue="market" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="market">시장 분석</TabsTrigger>
                    <TabsTrigger value="price">가격 분석</TabsTrigger>
                    <TabsTrigger value="occupancy">예약률 분석</TabsTrigger>
                    <TabsTrigger value="top">추천 매물</TabsTrigger>
                    <TabsTrigger value="ai">AI 요약</TabsTrigger>
                  </TabsList>

                  <TabsContent value="market" className="mt-6">
                    <MarketAnalysis rooms={rooms} periodMonths={1} />
                  </TabsContent>

                  <TabsContent value="price" className="mt-6">
                    <PriceAnalysis rooms={rooms} />
                  </TabsContent>

                  <TabsContent value="occupancy" className="mt-6">
                    <OccupancyAnalysis rooms={rooms} periodMonths={1} />
                  </TabsContent>

                  <TabsContent value="top" className="mt-6">
                    <TopProperties
                      rooms={rooms}
                      location={`${selectedNeighborhood.city_name} ${selectedNeighborhood.district_name} ${selectedNeighborhood.neighborhood_name}`}
                    />
                  </TabsContent>

                  <TabsContent value="ai" className="mt-6">
                    <AIAnalysisSummary
                      rooms={rooms}
                      location={`${selectedNeighborhood.city_name} ${selectedNeighborhood.district_name} ${selectedNeighborhood.neighborhood_name}`}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
