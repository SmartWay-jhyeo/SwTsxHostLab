"use client"
import type { Room } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

export function PropertyDetail({ room }: { room: Room }) {
  return (
    <Tabs defaultValue="info" className="max-h-[70vh] overflow-y-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="info">기본 정보</TabsTrigger>
        <TabsTrigger value="reviews">리뷰 정보</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-4 space-y-4">
        {room.images && room.images.length > 0 && (
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={room.images[0] || "/placeholder.svg?height=300&width=500"}
              alt={room.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{room.name}</h2>
          {room.is_super_host && (
            <Badge variant="outline" className="ml-2">
              슈퍼호스트
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground">{room.address}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">숙소 정보</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">건물유형:</span> {room.building_type}
              </li>
              <li>
                <span className="font-medium">평수:</span> {room.size_pyeong}평
              </li>
              <li>
                <span className="font-medium">방 개수:</span> {room.room_count}개
              </li>
              <li>
                <span className="font-medium">화장실 개수:</span> {room.bathroom_count}개
              </li>
              <li>
                <span className="font-medium">주방 개수:</span> {room.kitchen_count}개
              </li>
              <li>
                <span className="font-medium">거실 개수:</span> {room.living_room_count}개
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">편의 정보</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">엘리베이터:</span> {room.has_elevator ? "있음" : "없음"}
              </li>
              <li>
                <span className="font-medium">주차 정보:</span> {room.parking_info}
              </li>
              <li>
                <span className="font-medium">예약률:</span> {room.occupancy_rate}%
              </li>
              <li>
                <span className="font-medium">2개월 예약률:</span> {room.occupancy_2rate}%
              </li>
              <li>
                <span className="font-medium">3개월 예약률:</span> {room.occupancy_3rate}%
              </li>
            </ul>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(`https://33m2.co.kr/room/detail/${room.id}`, "_blank")}
        >
          33m² 사이트에서 보기
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </TabsContent>

      <TabsContent value="reviews" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>리뷰 정보</CardTitle>
            <CardDescription>
              {room.review_info
                ? `총 ${room.review_info.review_count}개의 리뷰, 평균 평점 ${room.review_info.review_score.toFixed(1)}`
                : "리뷰 정보가 없습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {room.review_info && room.review_info.review_count > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="text-3xl font-bold">{room.review_info.review_score.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">/ 5.0</div>
                </div>

                <div className="space-y-4">
                  {room.review_info.review_details.length > 0 ? (
                    room.review_info.review_details.map((review, index) => (
                      <div key={index} className="border-t pt-4">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{review.user_name}</div>
                          <div className="text-sm text-muted-foreground">{review.review_date}</div>
                        </div>
                        <div className="flex items-center mb-2">
                          <div className="text-sm font-medium">{review.score.toFixed(1)}/5.0</div>
                        </div>
                        <p className="text-sm">{review.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">상세 리뷰 정보가 없습니다.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">아직 리뷰가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
