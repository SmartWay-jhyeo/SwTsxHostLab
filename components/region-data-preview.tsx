"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Save, X, MapPin, Building, Users } from "lucide-react"
import type { RegionGroup } from "@/lib/address-parser"

interface RegionDataPreviewProps {
  regionGroups: RegionGroup[]
  selectedCity: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

interface EditingRegion {
  index: number
  city: string
  district: string
  neighborhood: string
}

export function RegionDataPreview({
  regionGroups,
  selectedCity,
  onConfirm,
  onCancel,
  isLoading,
}: RegionDataPreviewProps) {
  const [editingRegion, setEditingRegion] = useState<EditingRegion | null>(null)
  const [editedGroups, setEditedGroups] = useState<RegionGroup[]>(regionGroups)

  // 시/도 목록
  const cities = [
    "서울특별시",
    "부산광역시",
    "대구광역시",
    "인천광역시",
    "광주광역시",
    "대전광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "강원도",
    "충청북도",
    "충청남도",
    "전라북도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주특별자치도",
  ]

  // 편집 시작
  const handleEditStart = (index: number) => {
    const group = editedGroups[index]
    setEditingRegion({
      index,
      city: group.city,
      district: group.district,
      neighborhood: group.neighborhood,
    })
  }

  // 편집 저장
  const handleEditSave = () => {
    if (!editingRegion) return

    const newGroups = [...editedGroups]
    newGroups[editingRegion.index] = {
      ...newGroups[editingRegion.index],
      city: editingRegion.city,
      district: editingRegion.district,
      neighborhood: editingRegion.neighborhood,
    }

    setEditedGroups(newGroups)
    setEditingRegion(null)
  }

  // 편집 취소
  const handleEditCancel = () => {
    setEditingRegion(null)
  }

  // 총 통계 계산
  const totalProperties = editedGroups.reduce((sum, group) => sum + group.properties.length, 0)
  const totalNew = editedGroups.reduce((sum, group) => sum + group.newCount, 0)
  const totalUpdate = editedGroups.reduce((sum, group) => sum + group.updateCount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          지역별 데이터 미리보기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 통계 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{editedGroups.length}</div>
            <div className="text-sm text-blue-600">개 지역</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalProperties}</div>
            <div className="text-sm text-green-600">총 매물</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalNew}</div>
            <div className="text-sm text-purple-600">신규</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{totalUpdate}</div>
            <div className="text-sm text-orange-600">업데이트</div>
          </div>
        </div>

        <Separator />

        {/* 지역별 상세 정보 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">지역별 상세 정보</h3>
            <div className="text-sm text-muted-foreground">
              잘못 분류된 지역이 있다면 편집 버튼을 클릭하여 수정하세요
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {editedGroups.map((group, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {group.city} {group.district} {group.neighborhood}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        매물 예시: {group.properties[0]?.address || "주소 없음"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{group.properties.length}개</span>
                    </div>
                    <div className="flex gap-1">
                      {group.newCount > 0 && <Badge variant="secondary">신규 {group.newCount}</Badge>}
                      {group.updateCount > 0 && <Badge variant="outline">업데이트 {group.updateCount}</Badge>}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditStart(index)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>지역 정보 수정</DialogTitle>
                        </DialogHeader>
                        {editingRegion && editingRegion.index === index && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>시/도</Label>
                              <Select
                                value={editingRegion.city}
                                onValueChange={(value) =>
                                  setEditingRegion((prev) => (prev ? { ...prev, city: value } : null))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {cities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>구/군</Label>
                              <Input
                                value={editingRegion.district}
                                onChange={(e) =>
                                  setEditingRegion((prev) => (prev ? { ...prev, district: e.target.value } : null))
                                }
                                placeholder="예: 중구, 강남구"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>동/읍/면</Label>
                              <Input
                                value={editingRegion.neighborhood}
                                onChange={(e) =>
                                  setEditingRegion((prev) => (prev ? { ...prev, neighborhood: e.target.value } : null))
                                }
                                placeholder="예: 명동, 역삼동"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>매물 예시</Label>
                              <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded">
                                {group.properties.slice(0, 3).map((property, idx) => (
                                  <div key={idx}>{property.address}</div>
                                ))}
                                {group.properties.length > 3 && <div>... 외 {group.properties.length - 3}개</div>}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={handleEditCancel}>
                                <X className="w-4 h-4 mr-2" />
                                취소
                              </Button>
                              <Button onClick={handleEditSave}>
                                <Save className="w-4 h-4 mr-2" />
                                저장
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 확인/취소 버튼 */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            이전
          </Button>
          <Button onClick={() => onConfirm()} disabled={isLoading}>
            {isLoading ? "저장 중..." : "저장 시작"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
