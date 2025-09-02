"use client"

import { useEffect, useState, useCallback, memo } from "react"
import type { Room } from "@/lib/types"

interface MapClientProps {
  rooms: Room[]
  periodMonths?: number
  center?: [number, number]
  mapId?: string
  onMarkerClick?: (roomId: string) => void
}

// 마커 색상 계산을 메모이제이션
const getMarkerColor = (room: Room, periodMonths: number) => {
  let occupancyRate = room.occupancy_rate || 0

  if (periodMonths === 2) {
    occupancyRate = room.occupancy_2rate || 0
  } else if (periodMonths === 3) {
    occupancyRate = room.occupancy_3rate || 0
  }

  if (occupancyRate < 25) return "#FF5252"
  if (occupancyRate < 50) return "#FFD740"
  if (occupancyRate < 75) return "#448AFF"
  return "#4CAF50"
}

// 메모이제이션된 마커 컴포넌트
const MapMarker = memo(
  ({
    room,
    periodMonths,
    position,
    onMarkerClick,
    MapComponents,
  }: {
    room: Room
    periodMonths: number
    position: [number, number]
    onMarkerClick?: (roomId: string) => void
    MapComponents: any
  }) => {
    const { CircleMarker, Popup } = MapComponents
    const markerColor = getMarkerColor(room, periodMonths)

    const handleClick = useCallback(() => {
      if (onMarkerClick) {
        onMarkerClick(room.id)
      }
    }, [room.id, onMarkerClick])

    return (
      <CircleMarker
        center={position}
        radius={8}
        pathOptions={{
          fillColor: markerColor,
          fillOpacity: 0.8,
          weight: 1,
          color: "#fff",
        }}
        eventHandlers={{
          click: handleClick,
        }}
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
      </CircleMarker>
    )
  },
)

MapMarker.displayName = "MapMarker"

export const MapClientComponent = memo(({ rooms, periodMonths = 1, center, mapId, onMarkerClick }: MapClientProps) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 지도의 중심 좌표 계산 (메모이제이션)
  const calculateCenter = useCallback((): [number, number] => {
    if (center) {
      return center
    }

    if (!rooms || rooms.length === 0) {
      return [37.5665, 126.978]
    }

    const validRooms = rooms.filter((room) => room.latitude && room.longitude)

    if (validRooms.length === 0) {
      return [37.5665, 126.978]
    }

    const sumLat = validRooms.reduce((sum, room) => sum + (room.latitude || 0), 0)
    const sumLng = validRooms.reduce((sum, room) => sum + (room.longitude || 0), 0)

    return [sumLat / validRooms.length, sumLng / validRooms.length]
  }, [rooms, center])

  if (!isMounted) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">지도를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <DynamicMap
      center={calculateCenter()}
      rooms={rooms}
      periodMonths={periodMonths}
      mapId={mapId}
      onMarkerClick={onMarkerClick}
    />
  )
})

MapClientComponent.displayName = "MapClientComponent"

// 메모이제이션된 동적 지도 컴포넌트
const DynamicMap = memo(
  ({
    center,
    rooms,
    periodMonths,
    mapId,
    onMarkerClick,
  }: {
    center: [number, number]
    rooms: Room[]
    periodMonths: number
    mapId?: string
    onMarkerClick?: (roomId: string) => void
  }) => {
    const [MapComponents, setMapComponents] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      let isCancelled = false

      async function loadModules() {
        try {
          // CSS 로딩 최적화
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const linkElement = document.createElement("link")
            linkElement.rel = "stylesheet"
            linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            linkElement.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            linkElement.crossOrigin = ""
            document.head.appendChild(linkElement)
          }

          const [leaflet, reactLeaflet] = await Promise.all([import("leaflet"), import("react-leaflet")])

          if (!isCancelled) {
            setMapComponents(reactLeaflet)
            setLoading(false)
          }
        } catch (error) {
          console.error("지도 로딩 중 오류 발생:", error)
          if (!isCancelled) {
            setLoading(false)
          }
        }
      }

      loadModules()

      return () => {
        isCancelled = true
      }
    }, [])

    // 위치별 그룹화 최적화
    const locationGroups = useCallback(() => {
      const groups = new Map()
      rooms.forEach((room) => {
        if (room.latitude && room.longitude) {
          const key = `${room.latitude.toFixed(6)},${room.longitude.toFixed(6)}`
          if (!groups.has(key)) {
            groups.set(key, [])
          }
          groups.get(key).push(room)
        }
      })
      return groups
    }, [rooms])

    if (loading || !MapComponents) {
      return (
        <div className="h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">지도를 불러오는 중...</p>
        </div>
      )
    }

    const { MapContainer, TileLayer } = MapComponents

    return (
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        key={`map-${rooms.length}-${periodMonths}`}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Array.from(locationGroups().entries()).flatMap(([key, groupRooms]) => {
          return groupRooms.map((room: Room, index: number) => {
            if (room.latitude && room.longitude) {
              const angle = index * (Math.PI / 4)
              const radius = index * 0.0001
              const offsetLat = radius * Math.cos(angle)
              const offsetLng = radius * Math.sin(angle)

              return (
                <MapMarker
                  key={`${room.id}-${periodMonths}`}
                  room={room}
                  periodMonths={periodMonths}
                  position={[room.latitude + offsetLat, room.longitude + offsetLng]}
                  onMarkerClick={onMarkerClick}
                  MapComponents={MapComponents}
                />
              )
            }
            return null
          })
        })}
      </MapContainer>
    )
  },
)

DynamicMap.displayName = "DynamicMap"
