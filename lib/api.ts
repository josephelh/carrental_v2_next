import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

/** Base URL for Django API; override with NEXT_PUBLIC_API_URL in .env.local */
export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')) ||
  'http://127.0.0.1:8000/api'

/** Origin without trailing `/api` for resolving Django `ImageField` URLs. */
export function apiOrigin(): string {
  const u = API_BASE_URL.replace(/\/+$/, '')
  if (u.endsWith('/api')) return u.slice(0, -4)
  return u.replace(/\/api\/?$/, '')
}

export function mediaUrl(path: string | null | undefined): string {
  if (path == null || path === '') return ''
  const p = String(path).trim()
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  const base = apiOrigin()
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`
}

export const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  user: 'auth_user',
} as const

let onAuthFailure: (() => void) | null = null

export function setOnAuthFailure(handler: (() => void) | null) {
  onAuthFailure = handler
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.user)
}

/** Plain client for refresh so the main interceptors are not applied. */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function isRefreshRequestUrl(url: string | undefined) {
  if (!url) return false
  return url.includes('auth/refresh/')
}

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function flushQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
    else p.reject(new Error('Refresh failed'))
  })
  failedQueue = []
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const url = config.url ?? ''
    const skipAuth = url.includes('auth/login/')
    if (!skipAuth) {
      const token = localStorage.getItem(STORAGE_KEYS.access)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (!original || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    if (isRefreshRequestUrl(original.url)) {
      clearStoredTokens()
      onAuthFailure?.()
      return Promise.reject(error)
    }

    if (original._retry) {
      clearStoredTokens()
      onAuthFailure?.()
      return Promise.reject(error)
    }

    if (typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const refresh = localStorage.getItem(STORAGE_KEYS.refresh)
    if (!refresh) {
      clearStoredTokens()
      onAuthFailure?.()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${token}`
        original._retry = true
        return api(original)
      })
    }

    isRefreshing = true

    try {
      const { data } = await refreshClient.post<{ access: string }>(
        'auth/refresh/',
        { refresh }
      )
      const newAccess = data.access
      localStorage.setItem(STORAGE_KEYS.access, newAccess)
      flushQueue(null, newAccess)

      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${newAccess}`
      original._retry = true
      return api(original)
    } catch (refreshErr) {
      flushQueue(refreshErr, null)
      clearStoredTokens()
      onAuthFailure?.()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

/** Used on bootstrap when only a refresh token exists in storage. */
export async function refreshAccessToken(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('refreshAccessToken is client-only')
  }
  const refresh = localStorage.getItem(STORAGE_KEYS.refresh)
  if (!refresh) {
    clearStoredTokens()
    throw new Error('No refresh token')
  }
  const { data } = await refreshClient.post<{ access: string }>(
    'auth/refresh/',
    { refresh }
  )
  localStorage.setItem(STORAGE_KEYS.access, data.access)
  return data.access
}
