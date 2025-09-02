import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { RegionGroup } from "@/lib/address-parser"

// 요청 제한을 위한 지연 함수
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { selectedCity, regionGroups, replaceExisting = true } = await request.json()

    const totalPropertiesReceived = regionGroups.reduce((sum, group) => sum + group.properties.length, 0)
    console.log(`일괄 저장 시작. 총 ${regionGroups.length}개 지역, ${totalPropertiesReceived}개 매물 수신.`)

    if (!selectedCity || !regionGroups || !Array.isArray(regionGroups)) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 정보가 누락되었습니다.",
        },
        { status: 400 },
      )
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("인증 오류:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "인증이 필요합니다. 다시 로그인해주세요.",
        },
        { status: 401 },
      )
    }

    console.log("인증된 사용자:", user.email)

    let totalSaved = 0
    let totalUpdated = 0
    let totalMoved = 0
    let totalErrors = 0
    const processingResults: any[] = []

    // DB 조회 최적화를 위한 캐시
    const cityCache = new Map<string, number>()
    const districtCache = new Map<string, number>()

    for (const regionGroup of regionGroups as RegionGroup[]) {
      try {
        console.log(
          `처리 중: ${regionGroup.district} ${regionGroup.neighborhood} (${regionGroup.properties.length}개 매물)`,
        )
        await delay(100) // 지연 시간 조정

        // 1. 지역 정보 처리 (캐시 전달)
        const regionResult = await processRegionHierarchy(
          supabase,
          selectedCity,
          regionGroup.district,
          regionGroup.neighborhood,
          cityCache,
          districtCache,
        )

        if (!regionResult.success) {
          throw new Error(regionResult.error)
        }

        // 2. 기존 매물 데이터 조회 (neighborhood_id 포함)
        const propertyIds = regionGroup.properties.map((p) => p.id || p.property_id).filter(Boolean)
        const existingProperties = await getExistingProperties(supabase, propertyIds)
        const existingPropertyMap = new Map(
          existingProperties.map((p) => [p.property_id, { id: p.id, neighborhood_id: p.neighborhood_id }]),
        )

        // 3. 데이터 분류 (신규, 업데이트, 위치 이전)
        const { newProperties, updateProperties, moveProperties } = classifyProperties(
          regionGroup.properties,
          existingPropertyMap,
          regionResult.neighborhoodId,
        )
        console.log(
          `분류 결과: 신규 ${newProperties.length}, 업데이트 ${updateProperties.length}, 위치이전 ${moveProperties.length}`,
        )

        // 4. 기존 데이터 삭제 (교체 모드인 경우, 업데이트 및 위치 이전 매물 대상)
        const propertiesToClearSubData = [...updateProperties, ...moveProperties]
        if (replaceExisting && propertiesToClearSubData.length > 0) {
          const dbIdsToClear = propertiesToClearSubData
            .map((p) => existingPropertyMap.get(p.id || p.property_id)?.id)
            .filter((id): id is number => id !== undefined)

          if (dbIdsToClear.length > 0) {
            await deleteExistingSubData(supabase, dbIdsToClear)
          }
        }

        // 5. 새 매물 삽입
        let insertedProperties: any[] = []
        if (newProperties.length > 0) {
          insertedProperties = await insertNewProperties(supabase, newProperties, regionResult.neighborhoodId)
        }

        // 6. 기존 매물 업데이트 (정보만)
        if (updateProperties.length > 0) {
          await updateExistingProperties(supabase, updateProperties, existingPropertyMap)
        }

        // 6.5. 위치 이전 매물 처리 (neighborhood_id 업데이트 포함)
        if (moveProperties.length > 0) {
          await moveExistingProperties(supabase, moveProperties, existingPropertyMap, regionResult.neighborhoodId)
        }

        // 7. 하위 데이터 삽입 (신규 + 업데이트 + 위치 이전 매물)
        const allPropertiesToProcess = [
          ...(Array.isArray(insertedProperties) ? insertedProperties : []).map((p) => ({
            ...newProperties.find((np) => (np.id || np.property_id) === p.property_id),
            dbId: p.id,
          })),
          ...updateProperties.map((p) => ({ ...p, dbId: existingPropertyMap.get(p.id || p.property_id)?.id })),
          ...moveProperties.map((p) => ({ ...p, dbId: existingPropertyMap.get(p.id || p.property_id)?.id })),
        ].filter((p) => p.dbId)

        if (allPropertiesToProcess.length > 0) {
          await insertSubData(supabase, allPropertiesToProcess)
        }

        // 8. 동 정보 업데이트
        await updateNeighborhoodStats(supabase, regionResult.neighborhoodId, regionGroup.properties.length)

        processingResults.push({
          region: `${regionGroup.district} ${regionGroup.neighborhood}`,
          success: true,
          newCount: newProperties.length,
          updateCount: updateProperties.length,
          moveCount: moveProperties.length,
          total: regionGroup.properties.length,
        })

        totalSaved += newProperties.length
        totalUpdated += updateProperties.length
        totalMoved += moveProperties.length
      } catch (error) {
        const failedPropertiesCount = regionGroup.properties.length
        console.error(
          `지역 처리 실패: ${regionGroup.district} ${regionGroup.neighborhood}. 이 지역의 매물 ${failedPropertiesCount}개가 스킵됩니다.`,
          error,
        )
        totalErrors++
        processingResults.push({
          region: `${regionGroup.district} ${regionGroup.neighborhood}`,
          success: false,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        })
      }
    }

    const endTime = Date.now()
    const processingTime = (endTime - startTime) / 1000
    const totalProcessed = totalSaved + totalUpdated + totalMoved
    const totalFailedProperties = totalPropertiesReceived - totalProcessed

    console.log(`--- 최종 저장 결과 ---`)
    console.log(`- 총 수신 매물: ${totalPropertiesReceived}개`)
    console.log(`- 성공적으로 처리된 매물: ${totalProcessed}개`)
    console.log(`  - 신규: ${totalSaved}개`)
    console.log(`  - 정보 업데이트: ${totalUpdated}개`)
    console.log(`  - 위치 이전: ${totalMoved}개`)
    console.log(`- 처리 실패 매물: ${totalFailedProperties}개 (오류 발생 지역: ${totalErrors}개)`)
    console.log(`- 소요 시간: ${processingTime}초`)

    return NextResponse.json({
      success: true,
      message: `일괄 저장 완료: 총 ${totalProcessed}/${totalPropertiesReceived}개 매물 처리 완료.`,
      total_received: totalPropertiesReceived,
      total_processed: totalProcessed,
      new_properties: totalSaved,
      updated_properties: totalUpdated,
      moved_properties: totalMoved,
      failed_properties: totalFailedProperties,
      error_regions: totalErrors,
      processing_time_seconds: processingTime,
      processing_results: processingResults,
    })
  } catch (error: any) {
    const endTime = Date.now()
    const processingTime = (endTime - startTime) / 1000

    console.error("일괄 저장 중 치명적 오류:", error)

    return NextResponse.json(
      {
        success: false,
        error: `일괄 저장 중 치명적 오류가 발생했습니다: ${error?.message || "알 수 없는 오류"}`,
        processing_time_seconds: processingTime,
      },
      { status: 500 },
    )
  }
}

// 지역 계층 구조 처리 (캐시 사용)
async function processRegionHierarchy(
  supabase: any,
  city: string,
  district: string,
  neighborhood: string,
  cityCache: Map<string, number>,
  districtCache: Map<string, number>,
) {
  try {
    // 1. 시/도 처리 (캐시 우선 확인)
    let cityId: number
    if (cityCache.has(city)) {
      cityId = cityCache.get(city)!
      console.log(`[Cache] 시/도 사용: ${city} (ID: ${cityId})`)
    } else {
      const { data, error } = await supabase.from("cities").select("city_id").eq("city_name", city).maybeSingle()
      if (error) throw new Error(`시/도 조회 실패: ${error.message}`)

      if (data) {
        cityId = data.city_id
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("cities")
          .insert({ city_name: city })
          .select("city_id")
          .single()
        if (insertError) throw new Error(`시/도 생성 실패: ${insertError.message}`)
        cityId = newData.city_id
      }
      cityCache.set(city, cityId)
      console.log(`시/도 조회/생성 완료: ${city} (ID: ${cityId})`)
    }

    // 2. 구/군 처리 (캐시 우선 확인)
    let districtId: number
    const districtKey = `${cityId}_${district}`
    if (districtCache.has(districtKey)) {
      districtId = districtCache.get(districtKey)!
      console.log(`[Cache] 구/군 사용: ${district} (ID: ${districtId})`)
    } else {
      const { data, error } = await supabase
        .from("districts")
        .select("district_id")
        .eq("city_id", cityId)
        .eq("district_name", district)
        .maybeSingle()
      if (error) throw new Error(`구/군 조회 실패: ${error.message}`)

      if (data) {
        districtId = data.district_id
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("districts")
          .insert({ city_id: cityId, district_name: district })
          .select("district_id")
          .single()
        if (insertError) throw new Error(`구/군 생성 실패: ${insertError.message}`)
        districtId = newData.district_id
      }
      districtCache.set(districtKey, districtId)
      console.log(`구/군 조회/생성 완료: ${district} (ID: ${districtId})`)
    }

    // 3. 동/읍/면 처리 (캐시 없음)
    let neighborhoodId: number
    const { data, error } = await supabase
      .from("neighborhoods")
      .select("neighborhood_id")
      .eq("district_id", districtId)
      .eq("neighborhood_name", neighborhood)
      .maybeSingle()
    if (error) throw new Error(`동/읍/면 조회 실패: ${error.message}`)

    if (data) {
      neighborhoodId = data.neighborhood_id
    } else {
      const { data: newData, error: insertError } = await supabase
        .from("neighborhoods")
        .insert({
          district_id: districtId,
          neighborhood_name: neighborhood,
          last_crawled_at: new Date().toISOString(),
          property_count: 0,
        })
        .select("neighborhood_id")
        .single()
      if (insertError) throw new Error(`동/읍/면 생성 실패: ${insertError.message}`)
      neighborhoodId = newData.neighborhood_id
    }
    console.log(`동/읍/면 조회/생성 완료: ${neighborhood} (ID: ${neighborhoodId})`)

    return { success: true, neighborhoodId, cityId, districtId, error: "" }
  } catch (error) {
    return {
      success: false,
      neighborhoodId: -1,
      cityId: -1,
      districtId: -1,
      error: error instanceof Error ? error.message : "알 수 없는 지역 처리 오류",
    }
  }
}

// 기존 매물 조회 (neighborhood_id 포함)
async function getExistingProperties(supabase: any, propertyIds: string[]) {
  if (propertyIds.length === 0) return []

  try {
    const chunkSize = 100
    const allExisting: any[] = []

    for (let i = 0; i < propertyIds.length; i += chunkSize) {
      const chunk = propertyIds.slice(i, i + chunkSize)
      await delay(50) // 지연 시간 조정

      const { data, error } = await supabase
        .from("properties")
        .select("id, property_id, neighborhood_id")
        .in("property_id", chunk)

      if (error) {
        console.error("기존 매물 조회 오류:", error)
        throw error
      }

      if (data) allExisting.push(...data)
    }

    return allExisting
  } catch (error) {
    console.error("기존 매물 조회 실패:", error)
    return []
  }
}

// 매물 분류 (신규, 업데이트, 위치 이전)
function classifyProperties(
  properties: any[],
  existingPropertyMap: Map<string, { id: number; neighborhood_id: number }>,
  currentNeighborhoodId: number,
) {
  const newProperties: any[] = []
  const updateProperties: any[] = []
  const moveProperties: any[] = []

  properties.forEach((property) => {
    const id = property.id || property.property_id
    const existingProperty = existingPropertyMap.get(id)

    if (existingProperty) {
      if (existingProperty.neighborhood_id === currentNeighborhoodId) {
        updateProperties.push(property)
      } else {
        moveProperties.push(property)
      }
    } else {
      newProperties.push(property)
    }
  })

  return { newProperties, updateProperties, moveProperties }
}

// 기존 하위 데이터 삭제
async function deleteExistingSubData(supabase: any, propertyDbIds: number[]) {
  if (propertyDbIds.length === 0) return

  try {
    const deletePromises = [
      supabase.from("property_details").delete().in("property_id", propertyDbIds),
      supabase.from("property_pricing").delete().in("property_id", propertyDbIds),
      supabase.from("property_occupancy").delete().in("property_id", propertyDbIds),
      supabase.from("property_images").delete().in("property_id", propertyDbIds),
      supabase.from("property_reviews").delete().in("property_id", propertyDbIds),
      supabase.from("property_review_summary").delete().in("property_id", propertyDbIds),
    ]

    await Promise.allSettled(deletePromises)
    console.log(`기존 하위 데이터 삭제 완료: ${propertyDbIds.length}개 매물`)
  } catch (error) {
    console.error("기존 하위 데이터 삭제 오류:", error)
  }
}

// 새 매물 삽입
async function insertNewProperties(supabase: any, properties: any[], neighborhoodId: number) {
  try {
    const propertiesToInsert = properties.map((property) => ({
      neighborhood_id: neighborhoodId,
      property_id: property.id || property.property_id,
      name: property.name || property.title || "",
      address: property.address || "",
      building_type: property.building_type || "",
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      crawled_at: property.crawled_at || new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("properties").insert(propertiesToInsert).select("id, property_id")

    if (error) {
      console.error("매물 삽입 오류:", error)
      throw error
    }

    console.log(`새 매물 삽입 완료: ${propertiesToInsert.length}개`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("새 매물 삽입 실패:", error)
    return []
  }
}

// 기존 매물 업데이트
async function updateExistingProperties(
  supabase: any,
  properties: any[],
  existingPropertyMap: Map<string, { id: number; neighborhood_id: number }>,
) {
  try {
    const updatePromises = properties.map((property) => {
      const dbId = existingPropertyMap.get(property.id || property.property_id)?.id
      if (!dbId) return Promise.resolve()
      return supabase
        .from("properties")
        .update({
          name: property.name || property.title || "",
          address: property.address || "",
          building_type: property.building_type || "",
          latitude: property.latitude || null,
          longitude: property.longitude || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbId)
    })

    await Promise.allSettled(updatePromises)
    console.log(`기존 매물 업데이트 완료: ${properties.length}개`)
  } catch (error) {
    console.error("기존 매물 업데이트 오류:", error)
  }
}

// 위치 이전 매물 처리
async function moveExistingProperties(
  supabase: any,
  properties: any[],
  existingPropertyMap: Map<string, { id: number; neighborhood_id: number }>,
  newNeighborhoodId: number,
) {
  try {
    const updatePromises = properties.map((property) => {
      const dbId = existingPropertyMap.get(property.id || property.property_id)?.id
      if (!dbId) return Promise.resolve()
      return supabase
        .from("properties")
        .update({
          neighborhood_id: newNeighborhoodId, // 소속 지역 ID 변경
          name: property.name || property.title || "",
          address: property.address || "",
          building_type: property.building_type || "",
          latitude: property.latitude || null,
          longitude: property.longitude || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbId)
    })

    await Promise.allSettled(updatePromises)
    console.log(`기존 매물 위치 이전 완료: ${properties.length}개`)
  } catch (error) {
    console.error("기존 매물 위치 이전 오류:", error)
  }
}

// 하위 데이터 삽입
async function insertSubData(supabase: any, properties: any[]) {
  try {
    const detailsToInsert: any[] = []
    const pricingToInsert: any[] = []
    const occupancyToInsert: any[] = []
    const imagesToInsert: any[] = []
    const reviewsToInsert: any[] = []
    const reviewSummariesToInsert: any[] = []

    properties.forEach((property) => {
      const propertyId = property.dbId

      if (!propertyId) return

      // Details
      detailsToInsert.push({
        property_id: propertyId,
        room_count: property.room_count || 0,
        bathroom_count: property.bathroom_count || 0,
        kitchen_count: property.kitchen_count || 0,
        living_room_count: property.living_room_count || 0,
        size_pyeong: property.size_pyeong || 0,
        has_elevator: property.has_elevator || false,
        parking_info: property.parking_info || "",
        is_super_host: property.is_super_host || false,
      })

      // Pricing
      pricingToInsert.push({
        property_id: propertyId,
        weekly_price: property.weekly_price || 0,
        weekly_maintenance: property.weekly_maintenance || 0,
        cleaning_fee: property.cleaning_fee || 0,
        discount_2weeks: property.discount_2weeks || 0,
        discount_3weeks: property.discount_3weeks || 0,
        discount_4weeks: property.discount_4weeks || 0,
        discount_5weeks: property.discount_5weeks || 0,
        discount_6weeks: property.discount_6weeks || 0,
        discount_7weeks: property.discount_7weeks || 0,
        discount_8weeks: property.discount_8weeks || 0,
        discount_9weeks: property.discount_9weeks || 0,
        discount_10weeks: property.discount_10weeks || 0,
        discount_11weeks: property.discount_11weeks || 0,
        discount_12weeks: property.discount_12weeks || 0,
      })

      // Occupancy
      occupancyToInsert.push({
        property_id: propertyId,
        occupancy_rate: property.occupancy_rate || 0,
        occupancy_2rate: property.occupancy_2rate || 0,
        occupancy_3rate: property.occupancy_3rate || 0,
      })

      // Images
      if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        imagesToInsert.push({
          property_id: propertyId,
          image_url: property.images[0],
          is_primary: true,
          display_order: 0,
        })
      }

      // Reviews
      if (property.review_info?.review_details && Array.isArray(property.review_info.review_details)) {
        property.review_info.review_details.forEach((review: any) => {
          reviewsToInsert.push({
            property_id: propertyId,
            user_name: review.user_name || "",
            review_date: review.review_date || new Date().toISOString(),
            score: review.score || 0,
            review_text: review.text || "",
          })
        })
      }

      // Review Summary
      if (property.review_info) {
        reviewSummariesToInsert.push({
          property_id: propertyId,
          review_count: property.review_info.review_count || 0,
          average_score: property.review_info.review_score || 0,
          latest_review_date: property.review_info.latest_review_date || null,
        })
      }
    })

    const insertPromises = []

    if (detailsToInsert.length > 0) {
      insertPromises.push(supabase.from("property_details").insert(detailsToInsert))
    }
    if (pricingToInsert.length > 0) {
      insertPromises.push(supabase.from("property_pricing").insert(pricingToInsert))
    }
    if (occupancyToInsert.length > 0) {
      insertPromises.push(supabase.from("property_occupancy").insert(occupancyToInsert))
    }
    if (imagesToInsert.length > 0) {
      insertPromises.push(supabase.from("property_images").insert(imagesToInsert))
    }
    if (reviewsToInsert.length > 0) {
      insertPromises.push(supabase.from("property_reviews").insert(reviewsToInsert))
    }
    if (reviewSummariesToInsert.length > 0) {
      insertPromises.push(supabase.from("property_review_summary").insert(reviewSummariesToInsert))
    }

    const results = await Promise.allSettled(insertPromises)
    console.log(`하위 데이터 삽입 완료: ${properties.length}개 매물`)

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`하위 데이터 삽입 실패 (${index}):`, result.reason)
      }
    })
  } catch (error) {
    console.error("하위 데이터 삽입 오류:", error)
  }
}

// 동 통계 업데이트
async function updateNeighborhoodStats(supabase: any, neighborhoodId: number, propertyCount: number) {
  try {
    await supabase
      .from("neighborhoods")
      .update({
        last_crawled_at: new Date().toISOString(),
        property_count: propertyCount,
      })
      .eq("neighborhood_id", neighborhoodId)

    console.log(`동 통계 업데이트 완료: neighborhood_id ${neighborhoodId}, 매물 수 ${propertyCount}`)
  } catch (error) {
    console.error("동 통계 업데이트 오류:", error)
  }
}
