import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { city, district, neighborhood, data } = await request.json()

    console.log("받은 데이터:", { city, district, neighborhood, dataLength: data?.length })

    if (!city || !district || !neighborhood || !data) {
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

    const properties = Array.isArray(data) ? data : [data]
    console.log(`처리할 부동산 수: ${properties.length}개`)

    // 1. 지역 정보 처리 (병렬로 최적화)
    console.log("1. 지역 정보 처리 시작...")

    // 시/도 확인 및 생성
    let { data: cityData, error: cityError } = await supabase
      .from("cities")
      .select("city_id")
      .eq("city_name", city)
      .maybeSingle()

    if (!cityData && (!cityError || cityError.code === "PGRST116")) {
      console.log(`시/도 '${city}' 생성 중...`)
      const { data: newCity, error: createCityError } = await supabase
        .from("cities")
        .insert({ city_name: city })
        .select("city_id")
        .single()

      if (createCityError) {
        console.error("시/도 생성 실패:", createCityError)
        return NextResponse.json(
          {
            success: false,
            error: `시/도 생성 실패: ${createCityError.message}`,
          },
          { status: 500 },
        )
      }
      cityData = newCity
    } else if (cityError) {
      console.error("시/도 조회 실패:", cityError)
      return NextResponse.json(
        {
          success: false,
          error: `시/도 조회 실패: ${cityError.message}`,
        },
        { status: 500 },
      )
    }

    // 구/군 확인 및 생성
    let { data: districtData, error: districtError } = await supabase
      .from("districts")
      .select("district_id")
      .eq("city_id", cityData.city_id)
      .eq("district_name", district)
      .maybeSingle()

    if (!districtData && (!districtError || districtError.code === "PGRST116")) {
      console.log(`구/군 '${district}' 생성 중...`)
      const { data: newDistrict, error: createDistrictError } = await supabase
        .from("districts")
        .insert({
          city_id: cityData.city_id,
          district_name: district,
        })
        .select("district_id")
        .single()

      if (createDistrictError) {
        console.error("구/군 생성 실패:", createDistrictError)
        return NextResponse.json(
          {
            success: false,
            error: `구/군 생성 실패: ${createDistrictError.message}`,
          },
          { status: 500 },
        )
      }
      districtData = newDistrict
    } else if (districtError) {
      console.error("구/군 조회 실패:", districtError)
      return NextResponse.json(
        {
          success: false,
          error: `구/군 조회 실패: ${districtError.message}`,
        },
        { status: 500 },
      )
    }

    // 동/읍/면 확인 및 생성
    let { data: neighborhoodData, error: neighborhoodError } = await supabase
      .from("neighborhoods")
      .select("neighborhood_id")
      .eq("district_id", districtData.district_id)
      .eq("neighborhood_name", neighborhood)
      .maybeSingle()

    if (!neighborhoodData && (!neighborhoodError || neighborhoodError.code === "PGRST116")) {
      console.log(`동/읍/면 '${neighborhood}' 생성 중...`)
      const { data: newNeighborhood, error: createNeighborhoodError } = await supabase
        .from("neighborhoods")
        .insert({
          district_id: districtData.district_id,
          neighborhood_name: neighborhood,
          last_crawled_at: new Date().toISOString(),
          property_count: properties.length,
        })
        .select("neighborhood_id")
        .single()

      if (createNeighborhoodError) {
        console.error("동/읍/면 생성 실패:", createNeighborhoodError)
        return NextResponse.json(
          {
            success: false,
            error: `동/읍/면 생성 실패: ${createNeighborhoodError.message}`,
          },
          { status: 500 },
        )
      }
      neighborhoodData = newNeighborhood
    } else if (neighborhoodError) {
      console.error("동/읍/면 조회 실패:", neighborhoodError)
      return NextResponse.json(
        {
          success: false,
          error: `동/읍/면 조회 실패: ${neighborhoodError.message}`,
        },
        { status: 500 },
      )
    } else {
      // 기존 동이 있으면 업데이트
      console.log(`기존 동 '${neighborhood}' 정보 업데이트 중...`)
      await supabase
        .from("neighborhoods")
        .update({
          last_crawled_at: new Date().toISOString(),
          property_count: properties.length,
        })
        .eq("neighborhood_id", neighborhoodData.neighborhood_id)
    }

    console.log("지역 정보 처리 완료")

    // 2. 기존 부동산 데이터 조회 (배치로 최적화)
    console.log("2. 기존 부동산 데이터 조회 중...")
    const propertyIds = properties.map((p) => p.id)

    // 청크 단위로 처리 (PostgreSQL IN 절 제한 고려)
    const chunkSize = 1000
    const chunks = []
    for (let i = 0; i < propertyIds.length; i += chunkSize) {
      chunks.push(propertyIds.slice(i, i + chunkSize))
    }

    const existingProperties = []
    for (const chunk of chunks) {
      const { data: chunkData, error } = await supabase
        .from("properties")
        .select("id, property_id")
        .in("property_id", chunk)

      if (error) {
        console.error("기존 부동산 조회 오류:", error)
        throw error
      }

      if (chunkData) {
        existingProperties.push(...chunkData)
      }
    }

    const existingPropertyMap = new Map()
    existingProperties.forEach((p) => {
      existingPropertyMap.set(p.property_id, p.id)
    })

    console.log(
      `기존 부동산: ${existingProperties.length}개, 새 부동산: ${properties.length - existingProperties.length}개`,
    )

    // 3. 부동산 데이터 분류 및 처리
    console.log("3. 부동산 데이터 처리 중...")
    const propertiesToInsert = []
    const propertiesToUpdate = []
    let savedCount = 0
    let updatedCount = 0

    for (const propertyData of properties) {
      const existingId = existingPropertyMap.get(propertyData.id)

      if (existingId) {
        propertiesToUpdate.push({
          id: existingId,
          name: propertyData.name,
          address: propertyData.address,
          building_type: propertyData.building_type,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          crawled_at: propertyData.crawled_at,
          updated_at: new Date().toISOString(),
        })
        updatedCount++
      } else {
        propertiesToInsert.push({
          neighborhood_id: neighborhoodData.neighborhood_id,
          property_id: propertyData.id,
          name: propertyData.name,
          address: propertyData.address,
          building_type: propertyData.building_type,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          crawled_at: propertyData.crawled_at,
        })
        savedCount++
      }
    }

    // 4. 배치 삽입/업데이트 (청크 단위로 처리)
    console.log("4. 부동산 기본 정보 저장 중...")
    const insertedProperties = []

    if (propertiesToInsert.length > 0) {
      console.log(`새 부동산 ${propertiesToInsert.length}개 삽입 중...`)

      // 청크 단위로 삽입
      const insertChunks = []
      for (let i = 0; i < propertiesToInsert.length; i += chunkSize) {
        insertChunks.push(propertiesToInsert.slice(i, i + chunkSize))
      }

      for (const chunk of insertChunks) {
        const { data: inserted, error: insertError } = await supabase
          .from("properties")
          .insert(chunk)
          .select("id, property_id")

        if (insertError) {
          console.error("properties 배치 삽입 오류:", insertError)
          throw insertError
        }

        if (inserted) {
          insertedProperties.push(...inserted)
        }
      }
    }

    if (propertiesToUpdate.length > 0) {
      console.log(`기존 부동산 ${propertiesToUpdate.length}개 업데이트 중...`)

      // 청크 단위로 업데이트
      const updateChunks = []
      for (let i = 0; i < propertiesToUpdate.length; i += chunkSize) {
        updateChunks.push(propertiesToUpdate.slice(i, i + chunkSize))
      }

      for (const chunk of updateChunks) {
        const updatePromises = chunk.map((updateData) =>
          supabase.from("properties").update(updateData).eq("id", updateData.id),
        )
        await Promise.all(updatePromises)
      }
    }

    // 5. 새로운 숙소에 대한 하위 데이터만 처리
    console.log("5. 새 숙소 하위 데이터 처리 중...")
    const newPropertyIds = insertedProperties.map((p) => p.id)
    const newPropertyMap = new Map()
    insertedProperties.forEach((p) => {
      newPropertyMap.set(p.property_id, p.id)
    })

    if (newPropertyIds.length > 0) {
      const detailsToInsert = []
      const pricingToInsert = []
      const occupancyToInsert = []
      const imagesToInsert = []
      const reviewsToInsert = []
      const reviewSummariesToInsert = []

      for (const propertyData of properties) {
        const propertyId = newPropertyMap.get(propertyData.id)
        if (!propertyId) continue

        // Details
        detailsToInsert.push({
          property_id: propertyId,
          room_count: propertyData.room_count || 0,
          bathroom_count: propertyData.bathroom_count || 0,
          kitchen_count: propertyData.kitchen_count || 0,
          living_room_count: propertyData.living_room_count || 0,
          size_pyeong: propertyData.size_pyeong || 0,
          has_elevator: propertyData.has_elevator || false,
          parking_info: propertyData.parking_info || "",
          is_super_host: propertyData.is_super_host || false,
        })

        // Pricing
        pricingToInsert.push({
          property_id: propertyId,
          weekly_price: propertyData.weekly_price || 0,
          weekly_maintenance: propertyData.weekly_maintenance || 0,
          cleaning_fee: propertyData.cleaning_fee || 0,
          discount_2weeks: propertyData.discount_2weeks || 0,
          discount_3weeks: propertyData.discount_3weeks || 0,
          discount_4weeks: propertyData.discount_4weeks || 0,
          discount_5weeks: propertyData.discount_5weeks || 0,
          discount_6weeks: propertyData.discount_6weeks || 0,
          discount_7weeks: propertyData.discount_7weeks || 0,
          discount_8weeks: propertyData.discount_8weeks || 0,
          discount_9weeks: propertyData.discount_9weeks || 0,
          discount_10weeks: propertyData.discount_10weeks || 0,
          discount_11weeks: propertyData.discount_11weeks || 0,
          discount_12weeks: propertyData.discount_12weeks || 0,
        })

        // Occupancy
        occupancyToInsert.push({
          property_id: propertyId,
          occupancy_rate: propertyData.occupancy_rate || 0,
          occupancy_2rate: propertyData.occupancy_2rate || 0,
          occupancy_3rate: propertyData.occupancy_3rate || 0,
        })

        // Images - 대표 이미지만 저장 (첫 번째 이미지)
        if (propertyData.images && propertyData.images.length > 0) {
          // 첫 번째 이미지만 대표 이미지로 저장
          const primaryImageUrl = propertyData.images[0]
          imagesToInsert.push({
            property_id: propertyId,
            image_url: primaryImageUrl,
            is_primary: true,
            display_order: 0,
          })
        }

        // Reviews
        if (propertyData.review_info) {
          if (propertyData.review_info.review_details && propertyData.review_info.review_details.length > 0) {
            propertyData.review_info.review_details.forEach((review: any) => {
              reviewsToInsert.push({
                property_id: propertyId,
                user_name: review.user_name,
                review_date: review.review_date,
                score: review.score,
                review_text: review.text,
              })
            })
          }

          // Review Summary
          reviewSummariesToInsert.push({
            property_id: propertyId,
            review_count: propertyData.review_info.review_count || 0,
            average_score: propertyData.review_info.review_score || 0,
            latest_review_date: propertyData.review_info.latest_review_date || null,
          })
        }
      }

      // 6. 하위 데이터 배치 삽입 (병렬 처리)
      console.log("6. 하위 데이터 배치 삽입 중...")
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

      // 실패한 삽입 확인
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`하위 데이터 삽입 실패 (인덱스 ${index}):`, result.reason)
        }
      })
    }

    const endTime = Date.now()
    const processingTime = (endTime - startTime) / 1000

    console.log(`데이터 처리 완료 - 소요시간: ${processingTime}초`)

    return NextResponse.json({
      success: true,
      message: `데이터 처리 완료: 신규 숙소 ${savedCount}개 추가, 기존 숙소 ${updatedCount}개 정보 업데이트 (하위 데이터 보존)`,
      neighborhood_id: neighborhoodData.neighborhood_id,
      total_properties: savedCount + updatedCount,
      new_properties: savedCount,
      updated_properties: updatedCount,
      processing_time_seconds: processingTime,
    })
  } catch (error: any) {
    const endTime = Date.now()
    const processingTime = (endTime - startTime) / 1000

    console.error("데이터 저장 중 오류:", error)
    console.error("처리 시간:", processingTime, "초")

    return NextResponse.json(
      {
        success: false,
        error: `데이터 저장 중 오류가 발생했습니다: ${error.message}`,
        processing_time_seconds: processingTime,
      },
      { status: 500 },
    )
  }
}
