"use client"

import { useEffect } from "react"
import type { Room } from "@/lib/types"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { Icon } from "leaflet"
import "leaflet/dist/leaflet.css"

// 마커 아이콘 설정을 위한 URL
const ICON_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
const ICON_RETINA_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png"
const SHADOW_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"

interface ClientMapProps {
  center: [number, number]
  rooms: Room[]
  periodMonths: number
}

export default function ClientMapComponent({ center, rooms, periodMonths }: ClientMapProps) {
  // Leaflet 기본 아이콘 문제 해결
  useEffect(() => {
    // Leaflet의 기본 아이콘 관련 문제 해결
    delete (Icon.Default.prototype as any)._getIconUrl

    Icon.Default.mergeOptions({
      iconRetinaUrl: ICON_RETINA_URL,
      iconUrl: ICON_URL,
      shadowUrl: SHADOW_URL,
    })
  }, [])

  // 마커 아이콘 설정
  const markerIcon = new Icon({
    iconUrl: ICON_URL,
    iconRetinaUrl: ICON_RETINA_URL,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })

  // 예약률에 따른 마커 색상 결정 함수
  const getMarkerColor = (room: Room, periodMonths: number) => {
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

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
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

        return Array.from(locationGroups.entries()).flatMap(([key, groupRooms]) => {
          return groupRooms.map((room, index) => {
            if (room.latitude && room.longitude) {
              // 나선형 오프셋 계산 (그룹 내 인덱스에 따라 오프셋 증가)
              const angle = index * (Math.PI / 4) // 45도 간격으로 회전
              const radius = index * 0.0001 // 인덱스에 따라 반경 증가
              const offsetLat = radius * Math.cos(angle)
              const offsetLng = radius * Math.sin(angle)

              const markerColor = getMarkerColor(room, periodMonths)

              return (
                <Marker
                  key={room.id}
                  position={[room.latitude + offsetLat, room.longitude + offsetLng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="w-64">
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
                          <span className="font-medium">예약률:</span> {room.occupancy_rate}%
                        </p>
                        <p>
                          <span className="font-medium">평수:</span> {room.size_pyeong}평
                        </p>
                      </div>
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
}
