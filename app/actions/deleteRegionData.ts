"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteRegionData(neighborhoodId: number) {
  try {
    const supabase = createClient()

    // 트랜잭션으로 모든 관련 데이터 삭제
    // 1. 해당 neighborhood의 모든 properties 가져오기
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id")
      .eq("neighborhood_id", neighborhoodId)

    if (propertiesError) {
      console.error("Properties 조회 오류:", propertiesError)
      return { success: false, error: `Properties 조회 중 오류가 발생했습니다: ${propertiesError.message}` }
    }

    const propertyIds = properties?.map((p) => p.id) || []

    // 2. Properties와 관련된 모든 하위 테이블 데이터 삭제
    if (propertyIds.length > 0) {
      // property_details 삭제
      const { error: detailsError } = await supabase.from("property_details").delete().in("property_id", propertyIds)

      if (detailsError) {
        console.error("Property details 삭제 오류:", detailsError)
        return { success: false, error: `Property details 삭제 중 오류가 발생했습니다: ${detailsError.message}` }
      }

      // property_pricing 삭제
      const { error: pricingError } = await supabase.from("property_pricing").delete().in("property_id", propertyIds)

      if (pricingError) {
        console.error("Property pricing 삭제 오류:", pricingError)
        return { success: false, error: `Property pricing 삭제 중 오류가 발생했습니다: ${pricingError.message}` }
      }

      // property_occupancy 삭제
      const { error: occupancyError } = await supabase
        .from("property_occupancy")
        .delete()
        .in("property_id", propertyIds)

      if (occupancyError) {
        console.error("Property occupancy 삭제 오류:", occupancyError)
        return { success: false, error: `Property occupancy 삭제 중 오류가 발생했습니다: ${occupancyError.message}` }
      }

      // property_images 삭제
      const { error: imagesError } = await supabase.from("property_images").delete().in("property_id", propertyIds)

      if (imagesError) {
        console.error("Property images 삭제 오류:", imagesError)
        return { success: false, error: `Property images 삭제 중 오류가 발생했습니다: ${imagesError.message}` }
      }

      // property_reviews 삭제
      const { error: reviewsError } = await supabase.from("property_reviews").delete().in("property_id", propertyIds)

      if (reviewsError) {
        console.error("Property reviews 삭제 오류:", reviewsError)
        return { success: false, error: `Property reviews 삭제 중 오류가 발생했습니다: ${reviewsError.message}` }
      }

      // property_review_summary 삭제
      const { error: reviewSummaryError } = await supabase
        .from("property_review_summary")
        .delete()
        .in("property_id", propertyIds)

      if (reviewSummaryError) {
        console.error("Property review summary 삭제 오류:", reviewSummaryError)
        return {
          success: false,
          error: `Property review summary 삭제 중 오류가 발생했습니다: ${reviewSummaryError.message}`,
        }
      }
    }

    // 3. Properties 삭제
    const { error: propertiesDeleteError } = await supabase
      .from("properties")
      .delete()
      .eq("neighborhood_id", neighborhoodId)

    if (propertiesDeleteError) {
      console.error("Properties 삭제 오류:", propertiesDeleteError)
      return { success: false, error: `Properties 삭제 중 오류가 발생했습니다: ${propertiesDeleteError.message}` }
    }

    // 4. 해당 neighborhood와 관련된 analysis_results 삭제 (있다면)
    const { error: analysisError } = await supabase
      .from("analysis_results")
      .delete()
      .eq("neighborhood_id", neighborhoodId)

    // analysis_results 삭제 오류는 무시 (해당 테이블에 데이터가 없을 수 있음)
    if (analysisError) {
      console.warn("Analysis results 삭제 경고:", analysisError)
    }

    // 5. Neighborhood 삭제
    const { error: neighborhoodError } = await supabase
      .from("neighborhoods")
      .delete()
      .eq("neighborhood_id", neighborhoodId)

    if (neighborhoodError) {
      console.error("Neighborhood 삭제 오류:", neighborhoodError)
      return { success: false, error: `Neighborhood 삭제 중 오류가 발생했습니다: ${neighborhoodError.message}` }
    }

    // 캐시 갱신
    revalidatePath("/region-data")
    revalidatePath("/host-simulation")
    revalidatePath("/analysis")

    return { success: true }
  } catch (error: any) {
    console.error("삭제 처리 오류:", error)
    return { success: false, error: `삭제 처리 중 오류가 발생했습니다: ${error.message || error}` }
  }
}
