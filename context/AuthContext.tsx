'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  api,
  clearStoredTokens,
  refreshAccessToken,
  setOnAuthFailure,
  STORAGE_KEYS,
} from '@/lib/api'
import type { AuthUser } from '@/types'

/** Adjust to match your Django routes and JSON field names. */
const AUTH_PATHS = {
  login: 'auth/login/',
  me: 'auth/me/',
} as const

function persistTokens(access: string, refresh: string) {
  localStorage.setItem(STORAGE_KEYS.access, access)
  localStorage.setItem(STORAGE_KEYS.refresh, refresh)
}

function persistUser(u: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u))
}

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (!raw) return null
    return normalizeUser(JSON.parse(raw))
  } catch {
    return null
  }
}

function readTokens() {
  return {
    access: localStorage.getItem(STORAGE_KEYS.access),
    refresh: localStorage.getItem(STORAGE_KEYS.refresh),
  }
}

function extractTokensFromLogin(data: Record<string, unknown>) {
  const access =
    (typeof data.access === 'string' && data.access) ||
    (typeof data.access_token === 'string' && data.access_token) ||
    ''
  const refresh =
    (typeof data.refresh === 'string' && data.refresh) ||
    (typeof data.refresh_token === 'string' && data.refresh_token) ||
    ''
  return { access, refresh }
}

function normalizeUser(raw: unknown): AuthUser {
  const o = raw as Record<string, unknown>
  return {
    id: (o.id as string | number) ?? '',
    username: String(o.username ?? ''),
    email: typeof o.email === 'string' ? o.email : undefined,
    first_name: typeof o.first_name === 'string' ? o.first_name : undefined,
    last_name: typeof o.last_name === 'string' ? o.last_name : undefined,
  }
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredTokens()
    setUser(null)
    router.replace('/login')
  }, [router])

  useEffect(() => {
    setOnAuthFailure(() => logout)
    return () => setOnAuthFailure(null)
  }, [logout])

  useLayoutEffect(() => {
    const stored = readStoredUser()
    if (stored) setUser(stored)
  }, [])

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get(AUTH_PATHS.me)
    const u = normalizeUser(data)
    setUser(u)
    persistUser(u)
    return u
  }, [])

  const checkAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const { access, refresh } = readTokens()

    if (!access && !refresh) {
      clearStoredTokens()
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      if (!access && refresh) {
        await refreshAccessToken()
      }
      await fetchProfile()
    } catch {
      clearStoredTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile])

  useEffect(() => {
    startTransition(() => {
      void checkAuth()
    })
  }, [checkAuth])

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.post<Record<string, unknown>>(
        AUTH_PATHS.login,
        { username, password }
      )

      const { access, refresh } = extractTokensFromLogin(data)
      if (!access || !refresh) {
        throw new Error('Réponse de connexion invalide: jetons manquants.')
      }
      persistTokens(access, refresh)

      const embeddedUser = data.user ?? data.profile
      if (embeddedUser && typeof embeddedUser === 'object') {
        const nextUser = normalizeUser(embeddedUser)
        setUser(nextUser)
        persistUser(nextUser)
      } else {
        await fetchProfile()
      }
      router.replace('/')
    },
    [fetchProfile, router]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      checkAuth,
    }),
    [user, isLoading, login, logout, checkAuth]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
