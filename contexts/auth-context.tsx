"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { loginUser, logoutUser, signupUser, isAuthenticated, getCurrentUser, type User } from "@/lib/auth"

interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ success: boolean; error?: string; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [initialized, setInitialized] = useState(false)

  /* 초기 인증 체크 */
  useEffect(() => {
    const syncAuth = () => {
      const auth = isAuthenticated()
      setIsLoggedIn(auth)
      const currentUser = getCurrentUser()
      setUser(currentUser)
      setIsAdmin(currentUser?.is_admin || false)
      setInitialized(true)
    }
    syncAuth()
    window.addEventListener("storage", syncAuth)
    return () => window.removeEventListener("storage", syncAuth)
  }, [])

  /* 메서드 */
  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password)
    if (res.success) {
      const current = getCurrentUser()
      setIsLoggedIn(true)
      setUser(current)
      setIsAdmin(current?.is_admin || false)
    }
    return res
  }

  const signup = async (email: string, password: string, username: string) => {
    return await signupUser(email, password, username)
  }

  const logout = async () => {
    await logoutUser()
    setIsLoggedIn(false)
    setUser(null)
    setIsAdmin(false)
  }

  if (!initialized && typeof window !== "undefined") {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, isAdmin, login, signup, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
