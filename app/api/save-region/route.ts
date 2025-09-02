import { NextResponse } from "next/server"

// 행정안전부 행정구역 API 사용
const ADMIN_API_BASE = "https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level") // 'provinces', 'districts', 'dongs'
  const province = searchParams.get("province")
  const district = searchParams.get("district")

  try {
    if (level === "provinces") {
      // 시/도 목록 조회
      const response = await fetch(`${ADMIN_API_BASE}?regcode_pattern=*00000000`)
      const data = await response.json()

      if (data.regcodes) {
        const provinces = data.regcodes
          .filter((item: any) => item.code.endsWith("00000000") && !item.code.startsWith("00"))
          .map((item: any) => item.name)
          .sort()

        return NextResponse.json({ success: true, data: provinces })
      }
    }

    if (level === "districts" && province) {
      // 특정 시/도의 시/군/구 목록 조회
      const response = await fetch(`${ADMIN_API_BASE}?regcode_pattern=*00000000`)
      const data = await response.json()

      if (data.regcodes) {
        // 먼저 해당 시/도의 코드 찾기
        const provinceCode = data.regcodes
          .find((item: any) => item.name === province && item.code.endsWith("00000000"))
          ?.code.substring(0, 2)

        if (provinceCode) {
          // 해당 시/도의 시/군/구 조회
          const districtResponse = await fetch(`${ADMIN_API_BASE}?regcode_pattern=${provinceCode}*00000`)
          const districtData = await districtResponse.json()

          if (districtData.regcodes) {
            const districts = districtData.regcodes
              .filter(
                (item: any) =>
                  item.code.startsWith(provinceCode) && item.code.endsWith("00000") && !item.code.endsWith("00000000"),
              )
              .map((item: any) => item.name)
              .sort()

            return NextResponse.json({ success: true, data: districts })
          }
        }
      }
    }

    if (level === "dongs" && province && district) {
      // 특정 시/군/구의 읍/면/동 목록 조회
      const response = await fetch(`${ADMIN_API_BASE}?regcode_pattern=*00000000`)
      const data = await response.json()

      if (data.regcodes) {
        // 시/도 코드 찾기
        const provinceCode = data.regcodes
          .find((item: any) => item.name === province && item.code.endsWith("00000000"))
          ?.code.substring(0, 2)

        if (provinceCode) {
          // 시/군/구 코드 찾기
          const districtResponse = await fetch(`${ADMIN_API_BASE}?regcode_pattern=${provinceCode}*00000`)
          const districtData = await districtResponse.json()

          const districtCode = districtData.regcodes
            ?.find((item: any) => item.name === district && item.code.startsWith(provinceCode))
            ?.code.substring(0, 5)

          if (districtCode) {
            // 읍/면/동 조회
            const dongResponse = await fetch(`${ADMIN_API_BASE}?regcode_pattern=${districtCode}*`)
            const dongData = await dongResponse.json()

            if (dongData.regcodes) {
              const dongs = dongData.regcodes
                .filter(
                  (item: any) =>
                    item.code.startsWith(districtCode) &&
                    !item.code.endsWith("00000") &&
                    !item.code.endsWith("00000000"),
                )
                .map((item: any) => item.name)
                .sort()

              return NextResponse.json({ success: true, data: dongs })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 })
  } catch (error) {
    // API 실패 시 기존 하드코딩 데이터로 폴백
    const { districtData } = await import("@/lib/district-data")

    if (level === "provinces") {
      const provinces = Object.keys(districtData).sort()
      return NextResponse.json({ success: true, data: provinces })
    }

    if (level === "districts" && province) {
      const districts = province in districtData ? Object.keys(districtData[province]).sort() : []
      return NextResponse.json({ success: true, data: districts })
    }

    if (level === "dongs" && province && district) {
      const dongs =
        province in districtData && district in districtData[province] ? districtData[province][district].sort() : []
      return NextResponse.json({ success: true, data: dongs })
    }

    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
