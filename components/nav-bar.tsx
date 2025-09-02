"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Map, BarChart, LogOut, Menu, X, Home, FileText, Building, Users, BookOpen } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin, isLoggedIn, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "로그아웃 성공",
        description: "성공적으로 로그아웃되었습니다.",
      })
      router.push("/login")
    } catch (error) {
      console.error("로그아웃 오류:", error)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // 홈페이지에서는 네비게이션 바를 숨김
  if (pathname === "/" && !isLoggedIn) {
    return null
  }

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              HostLab
            </Link>
          </div>

          {isLoggedIn && (
            <>
              {/* 데스크톱 메뉴 */}
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  href="/"
                  className={`flex items-center text-sm ${
                    isActive("/") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                  }`}
                >
                  <Home className="w-4 h-4 mr-1" />홈
                </Link>

                {isAdmin && (
                  <Link
                    href="/analysis"
                    className={`flex items-center text-sm ${
                      isActive("/analysis") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                    }`}
                  >
                    <BarChart className="w-4 h-4 mr-1" />
                    지역분석
                  </Link>
                )}

                <Link
                  href="/region-data"
                  className={`flex items-center text-sm ${
                    isActive("/region-data") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                  }`}
                >
                  <Map className="w-4 h-4 mr-1" />
                  지역데이터 확인
                </Link>

                <Link
                  href="/region-properties"
                  className={`flex items-center text-sm ${
                    isActive("/region-properties") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                  }`}
                >
                  <Building className="w-4 h-4 mr-1" />
                  지역 숙소 확인
                </Link>

                {isAdmin && (
                  <Link
                    href="/consultation"
                    className={`flex items-center text-sm ${
                      isActive("/consultation") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    상담일지
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/admin/user-permissions"
                    className={`flex items-center text-sm ${
                      isActive("/admin/user-permissions") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                    }`}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    사용자 권한
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/admin/user-manual"
                    className={`flex items-center text-sm ${
                      isActive("/admin/user-manual") ? "text-black font-medium" : "text-gray-700 hover:text-black"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    사용자 매뉴얼
                  </Link>
                )}

                <button onClick={handleLogout} className="flex items-center text-sm text-gray-700 hover:text-black">
                  <LogOut className="w-4 h-4 mr-1" />
                  로그아웃
                </button>
              </div>

              {/* 모바일 메뉴 버튼 */}
              <div className="md:hidden">
                <button onClick={toggleMobileMenu} className="text-gray-700 hover:text-black">
                  <span className="sr-only">메뉴 {mobileMenuOpen ? "닫기" : "열기"}</span>
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && isLoggedIn && (
          <div className="md:hidden py-2 space-y-2 border-t">
            <Link
              href="/"
              className={`block px-3 py-2 text-sm ${isActive("/") ? "text-black font-medium" : "text-gray-700"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2" />홈
              </div>
            </Link>

            {isAdmin && (
              <Link
                href="/analysis"
                className={`block px-3 py-2 text-sm ${
                  isActive("/analysis") ? "text-black font-medium" : "text-gray-700"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <BarChart className="w-4 h-4 mr-2" />
                  지역분석
                </div>
              </Link>
            )}

            <Link
              href="/region-data"
              className={`block px-3 py-2 text-sm ${
                isActive("/region-data") ? "text-black font-medium" : "text-gray-700"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <Map className="w-4 h-4 mr-2" />
                지역데이터 확인
              </div>
            </Link>

            <Link
              href="/region-properties"
              className={`block px-3 py-2 text-sm ${
                isActive("/region-properties") ? "text-black font-medium" : "text-gray-700"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                지역 숙소 확인
              </div>
            </Link>

            {isAdmin && (
              <Link
                href="/consultation"
                className={`block px-3 py-2 text-sm ${
                  isActive("/consultation") ? "text-black font-medium" : "text-gray-700"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  상담일지
                </div>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin/user-permissions"
                className={`block px-3 py-2 text-sm ${
                  isActive("/admin/user-permissions") ? "text-black font-medium" : "text-gray-700"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  사용자 권한
                </div>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin/user-manual"
                className={`block px-3 py-2 text-sm ${
                  isActive("/admin/user-manual") ? "text-black font-medium" : "text-gray-700"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  사용자 매뉴얼
                </div>
              </Link>
            )}

            <button
              onClick={async () => {
                await handleLogout()
                setMobileMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700"
            >
              <div className="flex items-center">
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </div>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
