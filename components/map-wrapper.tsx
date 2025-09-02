"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { Room } from "@/lib/types"

interface MapWrapperProps {
  center: [number, number]
  rooms: Room[]
  periodMonths: number
}

export default function MapWrapper({ center, rooms, periodMonths }: MapWrapperProps) {
  const [mapComponent, setMapComponent] = useState<React.ReactNode | null>(null)

  useEffect(() => {
    // 동적으로 지도 컴포넌트 로드
    const loadMap = async () => {
      try {
        // 클라이언트 사이드에서만 Leaflet 로드
        const L = await import("leaflet")
        const { MapContainer, TileLayer, Marker, Popup } = await import("react-leaflet")

        // Leaflet CSS 로드
        await import("leaflet/dist/leaflet.css")

        // Leaflet 기본 아이콘 문제 해결
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // 예약률에 따른 마커 색상 결정 함수
        const getMarkerColor = (room: Room) => {
          let occupancyRate = room.occupancy_rate

          if (periodMonths === 2) {
            occupancyRate = room.occupancy_2rate
          } else if (periodMonths === 3) {
            occupancyRate = room.occupancy_3rate
          }

          if (occupancyRate < 25) return "red"
          if (occupancyRate < 50) return "yellow"
          if (occupancyRate < 75) return "blue"
          return "green"
        }

        // 지도 컴포넌트 생성
        const map = (
          <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* 위치 그룹화 및 오프셋 계산 함수 추가 */}
            {/* 마커 생성 부분 바로 위에 다음 코드를 추가합니다: */}

            {/* 같은 위치의 마커들을 그룹화하고 오프셋 적용 */}
            {(() => {
              const locationGroups = new Map()
              rooms.forEach((room) => {
                if (room.latitude && room.longitude) {
                  const key = `${room.latitude.toFixed(6)},${room.longitude.toFixed(6)}`
                  if (!locationGroups.has(key)) {
                    locationGroups.set(key, [])
                  }
                  locationGroups.get(key).push(room)
                }
              })

              return Array.from(locationGroups.entries()).flatMap(([, groupRooms]) => {
                return groupRooms.map((room, index) => {
                  if (room.latitude && room.longitude) {
                    // 나선형 오프셋 계산 (그룹 내 인덱스에 따라 오프셋 증가)
                    const angle = index * (Math.PI / 4) // 45도 간격으로 회전
                    const radius = index * 0.0001 // 인덱스에 따라 반경 증가
                    const offsetLat = radius * Math.cos(angle)
                    const offsetLng = radius * Math.sin(angle)

                    const markerColor = getMarkerColor(room)

                    // 현재 선택된 기간의 예약률 표시
                    let currentOccupancy = room.occupancy_rate
                    if (periodMonths === 2) {
                      currentOccupancy = room.occupancy_2rate
                    } else if (periodMonths === 3) {
                      currentOccupancy = room.occupancy_3rate
                    }

                    return (
                      <Marker
                        key={room.id}
                        position={[room.latitude + offsetLat, room.longitude + offsetLng]}
                        icon={L.divIcon({
                          className: "custom-marker",
                          html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                          iconSize: [16, 16],
                          iconAnchor: [8, 8],
                        })}
                      >
                        <Popup>
                          <div style={{ width: "250px" }}>
                            <h3 className="font-semibold">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">{room.address}</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>
                                <span className="font-medium">건물유형:</span> {room.building_type}
                              </p>
                              <p>
                                <span className="font-medium">주간 렌트비:</span> {room.weekly_price.toLocaleString()}원
                              </p>
                              <p>
                                <span className="font-medium">예약률 ({periodMonths}개월):</span>{" "}
                                {currentOccupancy.toFixed(1)}%
                              </p>
                              <p>
                                <span className="font-medium">평수:</span> {room.size_pyeong}평
                              </p>
                            </div>
                            <a
                              href={`https://33m2.co.kr/room/detail/${room.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                            >
                              숙소 상세 보기 →
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  }
                  return null
                })
              })
            })()}
          </MapContainer>
        )

        setMapComponent(map)
      } catch (error) {
        console.error("지도 로딩 중 오류 발생:", error)
        setMapComponent(
          <div className="h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">지도를 불러오는 중 오류가 발생했습니다.</p>
          </div>,
        )
      }
    }

    loadMap()
  }, [center, rooms, periodMonths])

  return (
    <div className="h-full w-full">
      {mapComponent || (
        <div className="h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">지도를 불러오는 중...</p>
        </div>
      )}
    </div>
  )
}
