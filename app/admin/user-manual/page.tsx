"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  BarChart,
  Map,
  Building,
  FileText,
  Users,
  Upload,
  Search,
  Eye,
  Save,
  Settings,
  CheckCircle,
  TrendingUp,
  MapPin,
  Bot,
  Edit,
  ExternalLink,
  Play,
  PieChart,
  Star,
  Shield,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react"

export default function UserManualPage() {
  const { isAdmin, isLoggedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    if (!isAdmin) {
      router.push("/")
      return
    }
  }, [isLoggedIn, isAdmin, router])

  if (!isLoggedIn || !isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HostLab 사용자 매뉴얼</h1>
          <p className="text-gray-600">숙박업소 투자 분석 플랫폼 완전 가이드</p>
        </div>

        <div className="grid gap-6">
          {/* 서비스 소개 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                서비스 소개
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">HostLab이란?</h3>
                <p className="text-blue-800">
                  HostLab은 숙박업소 투자와 운영을 위한 데이터 기반 분석 플랫폼입니다. 실제 숙박 플랫폼 데이터를
                  분석하여 투자 수익성을 예측하고, 지역별 시장 동향을 제공합니다.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    주요 특징
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• 실제 데이터 기반 정확한 분석</li>
                    <li>• 지역별 세밀한 시장 분석</li>
                    <li>• 예약률, 가격 동향 분석</li>
                    <li>• 건물유형별 투자 가이드</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    분석 범위
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-6">
                    <li>• 시/도/구/동 단위 분석</li>
                    <li>• 아파트, 오피스텔, 빌라 등</li>
                    <li>• 가격대별 수익성 분석</li>
                    <li>• 예약률 패턴 분석</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 시작하기 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                시작하기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">메뉴 구성</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>홈: 메인 대시보드</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4" />
                    <span>지역분석: 새 데이터 분석 (관리자)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    <span>지역데이터 확인: 기존 분석 결과</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>지역 숙소 확인: 매물 상세 정보</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>상담일지: 고객 상담 관리 (관리자)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>사용자 권한: 권한 관리 (관리자)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 데이터 분석 기능 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                데이터 분석 기능 (관리자 전용)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      1. 데이터 업로드
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• "지역분석" 메뉴 클릭</p>
                      <p>• "데이터 파일 선택" 버튼으로 JSON 파일 업로드</p>
                      <p>• 파일 크기 제한: 최대 50MB</p>
                      <p>• "데이터 분석 시작" 클릭하여 분석 실행</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      2. 분석 결과 확인
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">기본 통계</p>
                        <p>• 총 매물 수, 평균 주간 렌트비</p>
                        <p>• 평균 예약률, 지역 분포</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">상세 분석</p>
                        <p>• 가격 분석: 가격대별 분포, 이상치 제거</p>
                        <p>• 시장 분석: 건물유형별 분포</p>
                        <p>• 예약률 분석: 구간별 매물 분포</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      3. 지역 데이터 저장
                    </h4>
                    <div className="ml-6 space-y-3 text-sm">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-medium text-blue-900 mb-2">저장 과정 (3단계)</p>
                        <div className="space-y-3 text-blue-800">
                          <div>
                            <p className="font-medium">1단계: 모드 선택</p>
                            <div className="ml-4 space-y-1">
                              <p>
                                • <strong>자동 매칭 모드:</strong> 업로드된 데이터의 주소를 자동으로 분석하여 지역 정보
                                추출
                              </p>
                              <p>
                                • <strong>수동 입력 모드:</strong> 관리자가 직접 지역 정보를 입력하여 설정
                              </p>
                              <p>• 데이터 품질과 정확도에 따라 적절한 모드 선택</p>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium">2단계: 지역 설정</p>
                            <div className="ml-4 space-y-2">
                              <div>
                                <p className="font-medium text-sm">자동 매칭 모드:</p>
                                <div className="ml-3 space-y-1">
                                  <p>• 시스템이 매물 주소를 분석하여 시/도, 시/군/구, 읍/면/동 자동 추출</p>
                                  <p>• 매칭 결과 확인 및 오류 수정 가능</p>
                                  <p>• 매칭률과 정확도 표시</p>
                                  <p>• 매칭되지 않은 매물은 수동으로 지역 설정</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm">수동 입력 모드:</p>
                                <div className="ml-3 space-y-1">
                                  <p>• 시/도 선택 (예: 서울특별시)</p>
                                  <p>• 시/군/구 선택 (예: 강남구)</p>
                                  <p>• 읍/면/동 선택 (예: 역삼동)</p>
                                  <p>• 각 단계별로 하위 지역이 자동으로 로드</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium">3단계: 확인 및 저장</p>
                            <div className="ml-4 space-y-1">
                              <p>• 설정된 지역 정보 최종 확인</p>
                              <p>• 매물 수와 지역별 분포 검토</p>
                              <p>• 오류가 있는 경우 이전 단계로 돌아가서 수정</p>
                              <p>• 데이터 품질 점검 (중복, 누락 등)</p>
                              <p>• "저장 시작" 버튼 클릭하면 즉시 저장되고 창이 닫힘</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded">
                        <p className="font-medium text-green-900 mb-2">모드별 사용 가이드</p>
                        <div className="space-y-2 text-green-800">
                          <div>
                            <p className="font-medium text-sm">자동 매칭 모드 권장 상황:</p>
                            <div className="ml-3 space-y-1">
                              <p>• 매물 주소가 정확하고 표준화된 경우</p>
                              <p>• 대량의 데이터를 빠르게 처리해야 하는 경우</p>
                              <p>• 주소 형식이 일관성 있게 작성된 경우</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm">수동 입력 모드 권장 상황:</p>
                            <div className="ml-3 space-y-1">
                              <p>• 주소 정보가 불완전하거나 비표준인 경우</p>
                              <p>• 특정 지역에 집중된 소량의 데이터인 경우</p>
                              <p>• 자동 매칭 결과의 정확도가 낮은 경우</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="font-medium text-yellow-900 mb-2">주의사항</p>
                        <div className="space-y-1 text-yellow-800">
                          <p>• 자동 매칭 후에도 반드시 결과를 검토하여 정확성 확인</p>
                          <p>• 지역 설정이 잘못되면 분석 결과의 신뢰성이 떨어짐</p>
                          <p>• 동일한 지역에 중복 저장하지 않도록 기존 데이터 확인</p>
                          <p>• 저장 후에는 지역 정보 수정이 어려우므로 신중하게 진행</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium text-gray-900 mb-2">저장 후 활용</p>
                        <div className="space-y-1 text-gray-700">
                          <p>• 저장된 데이터는 "지역데이터 확인" 메뉴에서 조회 가능</p>
                          <p>• 고객별로 데이터 접근 권한 설정 가능</p>
                          <p>• 상담 시 해당 데이터를 기반으로 분석 결과 제공</p>
                          <p>• 데이터 수정 및 삭제는 관리자 권한 필요</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 지역데이터 확인 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                지역데이터 확인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      지역 선택 방법
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 왼쪽 패널에서 순차적으로 선택</p>
                      <p>
                        • 시/도 {"→"} 시/군/구 {"→"} 읍/면/동 순서
                      </p>
                      <p>• 각 단계별로 하위 지역이 자동 로드</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart className="w-4 h-4" />
                      분석 결과 확인 방법
                    </h4>

                    <div className="space-y-4">
                      {/* 시장 분석 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <PieChart className="w-4 h-4" />
                          1. 시장 분석
                        </h5>
                        <div className="text-sm text-blue-800 space-y-2">
                          <p>
                            <strong>건물유형별 분포:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 파이차트로 아파트, 오피스텔, 빌라 등의 비율 표시</p>
                            <p>• 각 유형별 매물 수와 비율(%) 확인</p>
                            <p>• 클릭 시 해당 유형만 필터링하여 상세 정보 확인</p>
                          </div>
                          <p>
                            <strong>활용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 지역별 주요 건물유형 파악으로 투자 방향 설정</p>
                            <p>• 경쟁이 적은 건물유형 발굴</p>
                            <p>• 고객 선호도와 시장 공급량 비교 분석</p>
                          </div>
                        </div>
                      </div>

                      {/* 가격 분석 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          2. 가격 분석
                        </h5>
                        <div className="text-sm text-green-800 space-y-2">
                          <p>
                            <strong>주간 렌트비 분포:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 점 그래프로 주간 렌트비와 예약률의 관계 표시</p>
                            <p>• 각 매물의 가격과 예약률을 한눈에 비교 가능</p>
                            <p>• 평균 가격, 최고/최저가 정보 제공</p>
                            <p>• 이상치 제거된 정제된 데이터로 정확한 시장 가격 파악</p>
                          </div>
                          <p>
                            <strong>평형별 분포:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 점 그래프로 평형(평수)과 예약률의 관계 표시</p>
                            <p>• 평형대별 수익성과 시장 선호도 분석</p>
                            <p>• 평균 평형, 최소/최대 평형 정보 제공</p>
                            <p>• 투자 적정 평수 결정에 도움</p>
                          </div>
                          <p>
                            <strong>장기 계약 할인율:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 막대 그래프로 2주, 4주, 8주, 12주별 평균 할인율 표시</p>
                            <p>• 장기 계약 시 수익성 변화 분석</p>
                            <p>• 할인 정책 수립 시 참고 자료</p>
                          </div>
                          <p>
                            <strong>활용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 적정 투자 가격대 설정</p>
                            <p>• 가격 경쟁력 있는 매물 발굴</p>
                            <p>• 고가/저가 매물의 특성 분석</p>
                            <p>• 투자 예산에 맞는 매물 범위 설정</p>
                            <p>• 최적 평수와 가격대 조합 발견</p>
                            <p>• 장기 계약 할인 전략 수립</p>
                          </div>
                        </div>
                      </div>

                      {/* 예약률 분석 */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                          <BarChart className="w-4 h-4" />
                          3. 예약률 분석
                        </h5>
                        <div className="text-sm text-purple-800 space-y-2">
                          <p>
                            <strong>예약률 구간별 분포:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 0-25%, 25-50%, 50-75%, 75-100% 구간별 매물 수</p>
                            <p>• 각 구간별 평균 가격과 특성 분석</p>
                            <p>• 고예약률 매물의 공통점 파악</p>
                          </div>
                          <p>
                            <strong>활용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 안정적 수익 창출 가능한 매물 선별 (75% 이상 권장)</p>
                            <p>• 저예약률 매물의 원인 분석 및 개선점 도출</p>
                            <p>• 예약률과 가격의 상관관계 분석</p>
                            <p>• 투자 위험도 평가 기준 설정</p>
                          </div>
                        </div>
                      </div>

                      {/* 추천 매물 */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          4. 추천 매물
                        </h5>
                        <div className="text-sm text-yellow-800 space-y-2">
                          <p>
                            <strong>추천 기준:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 예약률 75% 이상의 고수익 매물</p>
                            <p>• 가격 대비 수익성이 우수한 매물</p>
                            <p>• 지역 평균 대비 경쟁력 있는 매물</p>
                          </div>
                          <p>
                            <strong>표시 정보:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 매물명, 주소, 건물유형</p>
                            <p>• 예약률, 주간 렌트비, 평수</p>
                            <p>• 추천 이유 및 투자 포인트</p>
                          </div>
                          <p>
                            <strong>활용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 우선 검토 대상 매물로 활용</p>
                            <p>• 고객 상담 시 추천 매물로 제시</p>
                            <p>• 투자 성공 확률이 높은 매물 위주로 포트폴리오 구성</p>
                          </div>
                        </div>
                      </div>

                      {/* AI 요약 */}
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h5 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          5. AI 요약
                        </h5>
                        <div className="text-sm text-indigo-800 space-y-2">
                          <p>
                            <strong>기본 AI 분석:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• "AI 분석 요약" 버튼 클릭으로 기본 분석 생성</p>
                            <p>• 지역 시장의 전반적인 특성 요약</p>
                            <p>• 투자 기회와 위험 요소 분석</p>
                            <p>• 건물유형별 투자 전략 제안</p>
                            <p>• 가격대별 수익성 평가</p>
                          </div>
                          <p>
                            <strong>상황분석추가 기능:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• "상황분석추가" 버튼으로 맞춤형 분석 가능</p>
                            <p>• 호스트 연령대 (20대~60대이상) 선택</p>
                            <p>• 성별 (남성/여성) 선택</p>
                            <p>• 투자 예산 (500만원 이하~2000만원 이상) 선택</p>
                            <p>• 선택한 조건에 맞는 개인화된 투자 전략 제공</p>
                            <p>• 연령대별 특성과 예산에 맞는 구체적 조언</p>
                          </div>
                          <p>
                            <strong>AI 분석 내용:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 해당 지역의 실제 특성 조사 (관광지, 교통, 문화 등)</p>
                            <p>• 시장 데이터 기반 종합 분석</p>
                            <p>• 5가지 숙소 컨셉 추천 (기본 2개 + 지역특색 3개)</p>
                            <p>• 타겟 고객, 인테리어, 마케팅 전략 제시</p>
                            <p>• 투자 수익성과 성공 가능성 평가</p>
                          </div>
                          <p>
                            <strong>활용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 고객 상담 시 전문적인 시장 분석 자료로 활용</p>
                            <p>• 투자 의사결정 시 참고 자료로 활용</p>
                            <p>• 복잡한 데이터를 쉽게 이해할 수 있는 요약 정보 제공</p>
                            <p>• 개인 상황에 맞는 맞춤형 투자 전략 수립</p>
                            <p>• 지역 특성을 활용한 차별화된 사업 아이디어 도출</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      검색 및 필터링
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 검색: 매물명, 주소, 건물유형으로 검색</p>
                      <p>• 정렬: 예약률, 가격, 평수 기준 정렬</p>
                      <p>• 필터: 건물유형별 필터링</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 지역 숙소 확인 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                지역 숙소 확인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">숙소 카드 기능 상세 가이드</h4>

                    <div className="space-y-4">
                      {/* 시뮬레이션 기능 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          1. 시뮬레이션 기능
                        </h5>
                        <div className="text-sm text-blue-800 space-y-2">
                          <p>
                            <strong>기능 개요:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 선택한 매물의 투자 수익성을 시뮬레이션</p>
                            <p>• 실제 비용을 입력하여 정확한 수익률 계산</p>
                            <p>• 다양한 시나리오별 수익 예측</p>
                          </div>
                          <p>
                            <strong>사용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>1. 매물 카드에서 "시뮬레이션" 버튼 클릭</p>
                            <p>2. 비용 정보 입력:</p>
                            <div className="ml-4 space-y-1">
                              <p>• 월 임대료: 해당 지역 평균 월세 (네이버 부동산 참고)</p>
                              <p>• 월 관리비: 일반적으로 10-20만원</p>
                              <p>• 회당 청소비: 평수에 따라 3-5만원</p>
                              <p>• 초기 셋업 비용: 가구, 인테리어 비용 (300-1000만원)</p>
                              <p>• 보증금: 임대 계약 시 보증금</p>
                            </div>
                            <p>3. "시뮬레이션 실행" 클릭</p>
                            <p>4. 결과 분석:</p>
                            <div className="ml-4 space-y-1">
                              <p>• 월 예상 순수익</p>
                              <p>• 연간 투자수익률</p>
                              <p>• 투자금 회수 기간</p>
                              <p>• 예약률별 수익 시나리오</p>
                            </div>
                          </div>
                          <p>
                            <strong>활용 팁:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 여러 매물을 비교하여 최적 투자 대상 선정</p>
                            <p>• 보수적/낙관적 시나리오 모두 검토</p>
                            <p>• 투자 회수 기간을 고려한 투자 계획 수립</p>
                          </div>
                        </div>
                      </div>

                      {/* 예약률 수정 기능 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          2. 예약률 수정 기능 (관리자 전용)
                        </h5>
                        <div className="text-sm text-green-800 space-y-2">
                          <p>
                            <strong>기능 개요:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 실시간 시장 변화를 반영하여 예약률 업데이트</p>
                            <p>• 계절성, 이벤트 등을 고려한 예약률 조정</p>
                            <p>• 더 정확한 투자 분석을 위한 데이터 보정</p>
                          </div>
                          <p>
                            <strong>사용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>1. 매물 카드에서 "예약률 수정" 버튼 클릭</p>
                            <p>2. 현재 예약률과 수정할 예약률 확인</p>
                            <p>3. 새로운 예약률 입력 (0-100% 범위)</p>
                            <p>4. 수정 사유 입력 (선택사항)</p>
                            <p>5. "수정 완료" 버튼 클릭</p>
                          </div>
                          <p>
                            <strong>수정 기준:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 최근 3개월 실제 예약 데이터 기반</p>
                            <p>• 계절적 요인 (성수기/비수기) 반영</p>
                            <p>• 지역 이벤트나 개발 계획 고려</p>
                            <p>• 경쟁 매물 증가/감소 상황 반영</p>
                          </div>
                          <p>
                            <strong>주의사항:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 수정 내역은 로그로 기록되어 추적 가능</p>
                            <p>• 과도한 수정은 데이터 신뢰성을 해칠 수 있음</p>
                            <p>• 정기적인 데이터 검증 필요</p>
                          </div>
                        </div>
                      </div>

                      {/* 네이버 매물 연동 */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          3. 네이버 매물 연동
                        </h5>
                        <div className="text-sm text-orange-800 space-y-2">
                          <p>
                            <strong>기능 개요:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 네이버 부동산의 실제 매물 정보와 연동</p>
                            <p>• 임대료, 관리비 등 실제 비용 정보 제공</p>
                            <p>• 매물 상세 정보 및 사진 확인 가능</p>
                          </div>
                          <p>
                            <strong>사용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>1. 매물 카드에서 "네이버 매물" 버튼 클릭</p>
                            <p>2. 새 창에서 네이버 부동산 페이지 열림</p>
                            <p>3. 해당 지역의 유사 매물 목록 확인</p>
                            <p>4. 임대료, 보증금, 관리비 정보 수집</p>
                            <p>5. 매물 상세 정보 및 사진 검토</p>
                          </div>
                          <p>
                            <strong>활용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 시뮬레이션 시 실제 비용 데이터로 활용</p>
                            <p>• 투자 대상 매물의 시장 가격 검증</p>
                            <p>• 고객에게 실제 매물 정보 제공</p>
                            <p>• 투자 후 매물 구입 시 참고 자료로 활용</p>
                          </div>
                          <p>
                            <strong>주의사항:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 네이버 부동산 데이터는 실시간으로 변동</p>
                            <p>• 정확한 정보는 직접 확인 필요</p>
                            <p>• 지역별로 매물 정보의 정확도 차이 존재</p>
                          </div>
                        </div>
                      </div>

                      {/* 33M2 연동 */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          4. 33M2 플랫폼 연동
                        </h5>
                        <div className="text-sm text-purple-800 space-y-2">
                          <p>
                            <strong>연동 기능:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 해당 매물의 33M2 등록 정보 확인</p>
                            <p>• 실제 예약률 및 수익 데이터 조회</p>
                            <p>• 고객 리뷰 및 평점 정보 확인</p>
                          </div>
                          <p>
                            <strong>사용 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>1. 매물 카드에서 "33M2" 버튼 클릭</p>
                            <p>2. 33M2 플랫폼 페이지로 이동</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">지도 기반 분석</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>• 🔴 빨강: 0-25% (저조한 예약률)</p>
                      <p>• 🟡 노랑: 25-50% (보통 예약률)</p>
                      <p>• 🔵 파랑: 50-75% (양호한 예약률)</p>
                      <p>• 🟢 초록: 75-100% (높은 예약률)</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 상담일지 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                상담일지 관리 (관리자 전용)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      기능 개요
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 고객별 상담 내용을 체계적으로 관리</p>
                      <p>• 상담 이력 추적 및 후속 관리</p>
                      <p>• 고객 맞춤형 서비스 제공을 위한 정보 축적</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      사용자 관리
                    </h4>

                    <div className="space-y-4">
                      {/* 사용자 목록 확인 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          1. 사용자 목록 확인
                        </h5>
                        <div className="text-sm text-blue-800 space-y-2">
                          <p>
                            <strong>표시 정보:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 사용자명 (username) 또는 "이름 없음"</p>
                            <p>• 이메일 주소</p>
                            <p>• 사용자 ID (고유 식별자)</p>
                            <p>• 가입일 정보</p>
                          </div>
                          <p>
                            <strong>정렬 방식:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 1차: 사용자명 알파벳 순</p>
                            <p>• 2차: 이메일 알파벳 순 (사용자명이 없는 경우)</p>
                          </div>
                          <p>
                            <strong>새로고침 기능:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 우측 상단 새로고침 버튼 클릭</p>
                            <p>• 신규 가입 사용자 즉시 반영</p>
                            <p>• 사용자 정보 변경사항 업데이트</p>
                          </div>
                        </div>
                      </div>

                      {/* 사용자 선택 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          2. 사용자 선택 및 상담일지 조회
                        </h5>
                        <div className="text-sm text-green-800 space-y-2">
                          <p>
                            <strong>선택 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 왼쪽 사용자 목록에서 원하는 사용자 클릭</p>
                            <p>• 선택된 사용자는 파란색 배경으로 표시</p>
                            <p>• 동일한 사용자 재클릭 시 아무 변화 없음</p>
                          </div>
                          <p>
                            <strong>자동 로드:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 사용자 선택 시 해당 사용자의 상담일지 자동 로드</p>
                            <p>• 최신 작성일 순으로 정렬</p>
                            <p>• 로딩 중 스피너 표시</p>
                          </div>
                          <p>
                            <strong>사용자 변경 시:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 이전에 선택된 상담일지 자동 해제</p>
                            <p>• 새로운 사용자의 상담일지 목록으로 교체</p>
                            <p>• 작성 중인 내용은 유지됨</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      상담일지 관리
                    </h4>

                    <div className="space-y-4">
                      {/* 상담일지 목록 */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          3. 상담일지 목록 확인
                        </h5>
                        <div className="text-sm text-purple-800 space-y-2">
                          <p>
                            <strong>목록 표시:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 상담일지 제목 (첫 번째 줄 내용)</p>
                            <p>• 작성일시 (년월일 시분 형식)</p>
                            <p>• 선택된 일지는 파란색 테두리로 강조</p>
                          </div>
                          <p>
                            <strong>정렬 및 스크롤:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 최신 작성일 순으로 정렬</p>
                            <p>• 스크롤 영역으로 많은 일지 확인 가능</p>
                            <p>• 높이 제한으로 화면 효율성 확보</p>
                          </div>
                          <p>
                            <strong>빈 목록 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 상담일지가 없는 경우 안내 메시지 표시</p>
                            <p>• "저장된 상담일지가 없습니다" 메시지</p>
                            <p>• 회색 배경으로 구분</p>
                          </div>
                        </div>
                      </div>

                      {/* 상담일지 상세보기 */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          4. 상담일지 상세보기
                        </h5>
                        <div className="text-sm text-yellow-800 space-y-2">
                          <p>
                            <strong>선택 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 상담일지 목록에서 원하는 일지 클릭</p>
                            <p>• 선택된 일지는 파란색 테두리로 표시</p>
                            <p>• 하단에 상세 내용 자동 표시</p>
                          </div>
                          <p>
                            <strong>표시 내용:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 제목: 첫 번째 줄 내용</p>
                            <p>• 작성일시: 상세한 날짜와 시간</p>
                            <p>• 본문: 제목을 제외한 나머지 내용</p>
                            <p>• 줄바꿈 형태 그대로 표시</p>
                          </div>
                          <p>
                            <strong>구분선:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 제목과 본문 사이 구분선 표시</p>
                            <p>• 가독성 향상을 위한 시각적 구분</p>
                          </div>
                        </div>
                      </div>

                      {/* 새 상담일지 작성 */}
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h5 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          5. 새 상담일지 작성
                        </h5>
                        <div className="text-sm text-indigo-800 space-y-2">
                          <p>
                            <strong>작성 폼:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 제목 입력란: 상담일지 제목 (선택사항)</p>
                            <p>• 내용 입력란: 상담 내용 (필수)</p>
                            <p>• 10줄 높이의 텍스트 영역</p>
                            <p>• 플레이스홀더: "상담 내용을 입력하세요..."</p>
                          </div>
                          <p>
                            <strong>저장 과정:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>1. 사용자 선택 확인 (필수)</p>
                            <p>2. 내용 입력 확인 (필수)</p>
                            <p>3. "상담일지 저장" 버튼 클릭</p>
                            <p>4. 저장 중 "저장 중..." 표시</p>
                            <p>5. 성공 시 토스트 메시지 표시</p>
                          </div>
                          <p>
                            <strong>저장 후 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 제목과 내용 입력란 자동 초기화</p>
                            <p>• 상담일지 목록 자동 새로고침</p>
                            <p>• 새로 작성된 일지가 목록 최상단에 표시</p>
                          </div>
                          <p>
                            <strong>데이터 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 제목이 있는 경우: "제목\n\n내용" 형태로 저장</p>
                            <p>• 제목이 없는 경우: 내용만 저장</p>
                            <p>• 현재 시간으로 작성일시 자동 설정</p>
                          </div>
                        </div>
                      </div>

                      {/* 상담일지 삭제 */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          6. 상담일지 삭제
                        </h5>
                        <div className="text-sm text-red-800 space-y-2">
                          <p>
                            <strong>삭제 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 상담일지 목록에서 휴지통 아이콘 클릭</p>
                            <p>• 각 일지 우측에 삭제 버튼 위치</p>
                            <p>• 클릭 시 이벤트 전파 방지 (상세보기 방지)</p>
                          </div>
                          <p>
                            <strong>확인 과정:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• "정말로 이 상담일지를 삭제하시겠습니까?" 확인창</p>
                            <p>• 확인 클릭 시에만 삭제 진행</p>
                            <p>• 취소 시 아무 작업 없음</p>
                          </div>
                          <p>
                            <strong>삭제 후 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 삭제 성공 토스트 메시지 표시</p>
                            <p>• 선택된 일지가 삭제된 경우 상세보기 해제</p>
                            <p>• 상담일지 목록 자동 새로고침</p>
                            <p>• 삭제된 일지는 목록에서 즉시 제거</p>
                          </div>
                          <p>
                            <strong>오류 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 삭제 실패 시 오류 토스트 메시지</p>
                            <p>• "삭제 중 오류가 발생했습니다" 안내</p>
                            <p>• 목록 상태는 변경되지 않음</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      활용 팁
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 상담 전 고객의 이전 상담 이력 미리 확인</p>
                      <p>• 상담 중 중요한 내용은 실시간으로 메모</p>
                      <p>• 고객별 특성과 선호도 파악하여 맞춤 서비스 제공</p>
                      <p>• 정기적인 상담일지 검토로 서비스 품질 향상</p>
                      <p>• 후속 상담 시 이전 내용 연계하여 연속성 확보</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 사용자 권한 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                사용자 권한 관리 (관리자 전용)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      기능 개요
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 사용자별로 접근 가능한 지역 데이터 제한</p>
                      <p>• 세밀한 지역 단위 권한 설정 (시/도/구/동)</p>
                      <p>• 관리자는 모든 지역 접근 가능</p>
                      <p>• 일반 사용자는 권한 부여된 지역만 접근</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      권한 현황 관리
                    </h4>

                    <div className="space-y-4">
                      {/* 사용자별 권한 현황 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          1. 사용자별 권한 현황 확인
                        </h5>
                        <div className="text-sm text-blue-800 space-y-2">
                          <p>
                            <strong>표시 정보:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 사용자명과 이메일</p>
                            <p>• 가입일 정보</p>
                            <p>• 관리자 여부 (방패 아이콘으로 표시)</p>
                            <p>• 접근 가능한 지역 목록</p>
                          </div>
                          <p>
                            <strong>권한 상태 표시:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 관리자: "모든 지역 접근 가능" (파란색 배지)</p>
                            <p>• 권한 있는 사용자: 지역별 배지로 표시</p>
                            <p>• 권한 없는 사용자: "모든 지역 접근 불가능" (빨간색 배지)</p>
                          </div>
                          <p>
                            <strong>지역 표시 형식:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 시/도만: "서울특별시"</p>
                            <p>• 시/군/구까지: "서울특별시 {">"} 강남구"</p>
                            <p>
                              • 읍/면/동까지: "서울특별시 {">"} 강남구 {">"} 역삼동"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 권한 추가 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          2. 새 권한 추가
                        </h5>
                        <div className="text-sm text-green-800 space-y-2">
                          <p>
                            <strong>권한 추가 버튼:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 우측 상단 "권한 추가" 버튼 클릭</p>
                            <p>• 팝업 창으로 권한 설정 화면 열림</p>
                            <p>• 단계별 선택 방식으로 직관적 설정</p>
                          </div>
                          <p>
                            <strong>사용자 선택:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 드롭다운에서 대상 사용자 선택</p>
                            <p>• 관리자는 목록에서 제외</p>
                            <p>• 사용자명과 이메일 함께 표시</p>
                            <p>• 필수 선택 항목</p>
                          </div>
                          <p>
                            <strong>지역 선택 과정:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>1. 시/도 선택 (필수)</p>
                            <p>2. 시/군/구 선택 (선택사항)</p>
                            <p>3. 읍/면/동 선택 (선택사항)</p>
                            <p>• 상위 지역 선택 시 하위 지역 자동 로드</p>
                            <p>• 하위 지역 미선택 시 상위 지역 전체 권한 부여</p>
                          </div>
                          <p>
                            <strong>권한 범위 안내:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 시/도만 선택: 해당 시/도 전체 접근 가능</p>
                            <p>• 시/군/구까지 선택: 해당 시/군/구 전체 접근 가능</p>
                            <p>• 읍/면/동까지 선택: 해당 읍/면/동만 접근 가능</p>
                          </div>
                          <p>
                            <strong>저장 과정:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• "권한 추가" 버튼 클릭</p>
                            <p>• 필수 항목 검증 (사용자, 시/도)</p>
                            <p>• 저장 중 "추가 중..." 표시</p>
                            <p>• 성공 시 팝업 자동 닫힘</p>
                            <p>• 권한 현황 자동 새로고침</p>
                          </div>
                        </div>
                      </div>

                      {/* 개별 권한 삭제 */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          3. 개별 권한 삭제
                        </h5>
                        <div className="text-sm text-orange-800 space-y-2">
                          <p>
                            <strong>삭제 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 각 권한 배지 옆 휴지통 아이콘 클릭</p>
                            <p>• 개별 권한별로 삭제 가능</p>
                            <p>• 관리자 권한은 삭제 불가</p>
                          </div>
                          <p>
                            <strong>확인 과정:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• "정말로 이 권한을 삭제하시겠습니까?" 확인창</p>
                            <p>• 확인 후에만 삭제 진행</p>
                            <p>• 취소 시 아무 작업 없음</p>
                          </div>
                          <p>
                            <strong>삭제 후 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 해당 권한 즉시 제거</p>
                            <p>• 권한 현황 자동 업데이트</p>
                            <p>• 사용자의 다른 권한은 유지</p>
                          </div>
                        </div>
                      </div>

                      {/* 사용자별 전체 권한 삭제 */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          4. 사용자별 전체 권한 삭제
                        </h5>
                        <div className="text-sm text-red-800 space-y-2">
                          <p>
                            <strong>삭제 방법:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 사용자 카드 우측 상단 "모든 권한 삭제" 버튼</p>
                            <p>• 해당 사용자의 모든 지역 권한 일괄 삭제</p>
                            <p>• 관리자에게는 버튼 표시되지 않음</p>
                            <p>• 권한이 없는 사용자에게도 버튼 표시되지 않음</p>
                          </div>
                          <p>
                            <strong>확인 과정:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• "정말로 [사용자명] 사용자의 모든 권한을 삭제하시겠습니까?"</p>
                            <p>• 사용자명이 포함된 구체적 확인 메시지</p>
                            <p>• 실수 방지를 위한 명확한 안내</p>
                          </div>
                          <p>
                            <strong>삭제 후 처리:</strong>
                          </p>
                          <div className="ml-4 space-y-1">
                            <p>• 해당 사용자의 모든 지역 권한 제거</p>
                            <p>• "모든 지역 접근 불가능" 상태로 변경</p>
                            <p>• 권한 현황 즉시 업데이트</p>
                            <p>• "모든 권한 삭제" 버튼 숨김</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      권한 관리 전략
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 지역별 담당자 배정 시 해당 지역만 권한 부여</p>
                      <p>• 신규 사용자는 기본적으로 권한 없음 상태</p>
                      <p>• 정기적인 권한 검토로 불필요한 권한 정리</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      오류 처리 및 주의사항
                    </h4>
                    <div className="ml-6 space-y-2 text-sm">
                      <p>• 권한 추가/삭제 실패 시 오류 메시지 표시</p>
                      <p>• 네트워크 오류 시 재시도 안내</p>
                      <p>• 중복 권한 추가 시 자동 방지</p>
                      <p>• 관리자 권한은 시스템에서 자동 관리</p>
                      <p>• 권한 변경 사항은 즉시 반영됨</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
