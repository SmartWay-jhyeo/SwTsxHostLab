"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calculator, TrendingUp, MapPin, FileText } from "lucide-react"

export default function InvestmentToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">투자 도구</h1>
          <p className="text-gray-600">숙박업소 투자를 위한 다양한 분석 도구를 활용해보세요</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 지역 분석 도구 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                지역 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">특정 지역의 숙박업소 시장 동향과 투자 기회를 분석합니다.</p>
              <Link href="/region-data">
                <Button className="w-full">지역 분석 시작</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 매물 비교 도구 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                매물 비교
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">여러 매물의 수익성을 비교하여 최적의 투자 대상을 찾아보세요.</p>
              <Link href="/region-properties">
                <Button className="w-full">매물 비교하기</Button>
              </Link>
            </CardContent>
          </Card>

          {/* 수익률 계산기 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-500" />
                수익률 계산
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">예상 수익률과 투자 회수 기간을 계산해보세요.</p>
              <Button className="w-full" disabled>
                준비 중
              </Button>
            </CardContent>
          </Card>

          {/* 시장 동향 분석 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                시장 동향
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">숙박업소 시장의 최신 동향과 예측을 확인하세요.</p>
              <Button className="w-full" disabled>
                준비 중
              </Button>
            </CardContent>
          </Card>

          {/* 저장된 분석 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                저장된 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">이전에 분석한 결과를 다시 확인하고 비교해보세요.</p>
              <Link href="/saved-results">
                <Button className="w-full">분석 결과 보기</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
