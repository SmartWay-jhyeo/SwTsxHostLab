"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/protected-route"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2, Users, MapPin, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  getAllUserPermissions,
  addUserPermission,
  deleteUserPermission,
  deleteAllUserPermissions,
  getRegionData,
  type UserPermission,
  type AuthUser,
} from "@/app/actions/userPermissionActions"

interface RegionStructure {
  [city: string]: {
    [district: string]: string[]
  }
}

export default function UserPermissionsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [regionData, setRegionData] = useState<RegionStructure>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
    }
  }, [isAdmin, router])

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 사용자 및 권한 데이터 로드
        const userPermissionsResult = await getAllUserPermissions()
        if (!userPermissionsResult.success) {
          throw new Error(userPermissionsResult.error)
        }

        setUsers(userPermissionsResult.data.users)
        setPermissions(userPermissionsResult.data.permissions)

        // 지역 데이터 로드
        const regionResult = await getRegionData()
        if (!regionResult.success) {
          throw new Error(regionResult.error)
        }

        setRegionData(regionResult.data)
      } catch (err: any) {
        setError(err.message || "데이터를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  // 권한 추가
  const handleAddPermission = async () => {
    if (!selectedUser || !selectedCity) {
      setError("사용자와 시/도는 필수 선택 항목입니다.")
      return
    }

    setIsAdding(true)
    try {
      const result = await addUserPermission({
        user_id: selectedUser,
        city_name: selectedCity,
        district_name: selectedDistrict || null,
        neighborhood_name: selectedNeighborhood || null,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // 데이터 새로고침
      const userPermissionsResult = await getAllUserPermissions()
      if (userPermissionsResult.success) {
        setPermissions(userPermissionsResult.data.permissions)
      }

      // 폼 초기화
      setSelectedUser("")
      setSelectedCity("")
      setSelectedDistrict("")
      setSelectedNeighborhood("")
      setIsDialogOpen(false)
      setError(null)
    } catch (err: any) {
      setError(err.message || "권한 추가 중 오류가 발생했습니다.")
    } finally {
      setIsAdding(false)
    }
  }

  // 권한 삭제
  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm("정말로 이 권한을 삭제하시겠습니까?")) {
      return
    }

    try {
      const result = await deleteUserPermission(permissionId)
      if (!result.success) {
        throw new Error(result.error)
      }

      // 데이터 새로고침
      const userPermissionsResult = await getAllUserPermissions()
      if (userPermissionsResult.success) {
        setPermissions(userPermissionsResult.data.permissions)
      }
    } catch (err: any) {
      setError(err.message || "권한 삭제 중 오류가 발생했습니다.")
    }
  }

  // 사용자의 모든 권한 삭제
  const handleDeleteAllUserPermissions = async (userId: string, username: string) => {
    if (!confirm(`정말로 ${username} 사용자의 모든 권한을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteAllUserPermissions(userId)
      if (!result.success) {
        throw new Error(result.error)
      }

      // 데이터 새로고침
      const userPermissionsResult = await getAllUserPermissions()
      if (userPermissionsResult.success) {
        setPermissions(userPermissionsResult.data.permissions)
      }
    } catch (err: any) {
      setError(err.message || "권한 삭제 중 오류가 발생했습니다.")
    }
  }

  // 사용자별 권한 그룹화
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.user_id]) {
        acc[permission.user_id] = []
      }
      acc[permission.user_id].push(permission)
      return acc
    },
    {} as { [userId: string]: UserPermission[] },
  )

  // 권한 표시 텍스트 생성
  const getPermissionText = (permission: UserPermission) => {
    let text = permission.city_name || ""
    if (permission.district_name) {
      text += ` > ${permission.district_name}`
    }
    if (permission.neighborhood_name) {
      text += ` > ${permission.neighborhood_name}`
    }
    return text
  }

  // 시/도 선택 시 하위 지역 초기화
  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    setSelectedDistrict("")
    setSelectedNeighborhood("")
  }

  // 시/군/구 선택 시 하위 지역 초기화
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    setSelectedNeighborhood("")
  }

  // 다이얼로그 열기
  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  if (!isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              사용자 지역 권한 관리
            </h1>
            <p className="text-muted-foreground mt-2">사용자별로 접근 가능한 지역을 설정할 수 있습니다.</p>
          </div>

          {/* 권한 추가 버튼 */}
          <Button onClick={handleOpenDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>권한 추가</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dialog 컴포넌트 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 지역 권한 추가</DialogTitle>
              <DialogDescription>사용자에게 특정 지역에 대한 접근 권한을 부여합니다.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">사용자 선택 *</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="사용자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => !user.is_admin)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">시/도 선택 *</label>
                <Select value={selectedCity} onValueChange={handleCityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="시/도를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(regionData).map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCity && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">시/군/구 선택 (선택사항)</label>
                  <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="시/군/구를 선택하세요 (전체 허용시 선택 안함)" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(regionData[selectedCity] || {}).map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCity && selectedDistrict && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">읍/면/동 선택 (선택사항)</label>
                  <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                    <SelectTrigger>
                      <SelectValue placeholder="읍/면/동을 선택하세요 (전체 허용시 선택 안함)" />
                    </SelectTrigger>
                    <SelectContent>
                      {(regionData[selectedCity]?.[selectedDistrict] || []).map((neighborhood) => (
                        <SelectItem key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>권한 설정 안내:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• 시/도만 선택: 해당 시/도 전체 접근 가능</li>
                  <li>• 시/군/구까지 선택: 해당 시/군/구 전체 접근 가능</li>
                  <li>• 읍/면/동까지 선택: 해당 읍/면/동만 접근 가능</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleAddPermission} disabled={isAdding}>
                {isAdding ? "추가 중..." : "권한 추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              사용자별 지역 권한 현황
            </CardTitle>
            <CardDescription>
              각 사용자가 접근할 수 있는 지역 목록입니다. 관리자는 모든 지역에 접근할 수 있으며, 일반 사용자는 권한이
              부여된 지역만 접근할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {users.map((user) => {
                  const userPermissions = groupedPermissions[user.id] || []

                  return (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {user.username}
                            {user.is_admin && <Shield className="h-4 w-4 text-blue-600" />}
                            <span className="text-sm text-muted-foreground">({user.email})</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            가입일: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!user.is_admin && userPermissions.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAllUserPermissions(user.id, user.username)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            모든 권한 삭제
                          </Button>
                        )}
                      </div>

                      {/* 권한 상태 표시 */}
                      {user.is_admin ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          모든 지역 접근 가능
                        </Badge>
                      ) : userPermissions.length === 0 ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          모든 지역 접근 불가능
                        </Badge>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">접근 가능한 지역:</p>
                          <div className="flex flex-wrap gap-2">
                            {userPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {getPermissionText(permission)}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePermission(permission.id!)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {users.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">등록된 사용자가 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
