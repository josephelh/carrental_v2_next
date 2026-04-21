'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { api, STORAGE_KEYS } from '@/lib/api'
import type { AuthUser } from '@/types'

function normalizeUser(raw: any): AuthUser {
  const o = raw || {}
  return {
    id: o.id ?? '',
    username: String(o.username ?? ''),
    email: typeof o.email === 'string' ? o.email : undefined,
    first_name: typeof o.first_name === 'string' ? o.first_name : undefined,
    last_name: typeof o.last_name === 'string' ? o.last_name : undefined,
    role: o.role as 'ADMIN' | 'AGENT' || 'AGENT',
  }
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.access)
      localStorage.removeItem(STORAGE_KEYS.refresh)
      localStorage.removeItem(STORAGE_KEYS.user)
    }
    setUser(null)
    setIsLoading(false)
    router.replace('/login')
  }, [router])

  // Hydration logic
  useEffect(() => {
    const hydrate = () => {
      const access = localStorage.getItem(STORAGE_KEYS.access)
      const storedUser = localStorage.getItem(STORAGE_KEYS.user)

      if (access && storedUser) {
        try {
          setUser(normalizeUser(JSON.parse(storedUser)))
        } catch (e) {
          console.error("Auth hydration error", e)
          logout()
        }
      }
      setIsLoading(false)
    }

    hydrate()

    // Listen for the 'auth-failure' signal from lib/api.ts
    const handleAuthFailure = () => logout()
    window.addEventListener('auth-failure', handleAuthFailure)
    return () => window.removeEventListener('auth-failure', handleAuthFailure)
  }, [logout])

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true)
      try {
        const { data } = await api.post('auth/login/', { username, password })

        const access = data.access || data.access_token
        const refresh = data.refresh || data.refresh_token

        if (!access || !refresh) throw new Error('Login failed: Tokens missing.')

        localStorage.setItem(STORAGE_KEYS.access, access)
        localStorage.setItem(STORAGE_KEYS.refresh, refresh)

        const userData = normalizeUser(data.user || data)
        setUser(userData)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData))

        setIsLoading(false)
        router.replace('/')
      } catch (error) {
        setIsLoading(false)
        throw error
      }
    },
    [router]
  )

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  }), [user, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}