import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

/** Base URL for Django API; override with NEXT_PUBLIC_API_URL in .env.local */
export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')) ||
  'http://127.0.0.1:8000/api'

export const STORAGE_KEYS = {
    access: 'access_token',
    refresh: 'refresh_token',
    user: 'auth_user',
  } as const
  

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

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []


function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
  })
  failedQueue = []
}


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_KEYS.access)
    if (token && !config.url?.includes('auth/login')) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 403) {
      const data = error.response.data as any
      const message = data.detail || ""
      
      // Look for license-related keywords sent by the backend HasActiveLicense permission
      if (message.includes("abonnement") || message.includes("License") || message.includes("expiré")) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/expired') {
          window.location.href = '/expired'
          return Promise.reject(error)
        }
      }
    }


    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    const refresh = localStorage.getItem(STORAGE_KEYS.refresh)
    if (!refresh) {
      isRefreshing = false
      window.dispatchEvent(new Event('auth-failure')) // NEW: Trigger logout
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })
      const newAccess = data.access
      localStorage.setItem(STORAGE_KEYS.access, newAccess)
      processQueue(null, newAccess)
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.clear() // Wipe storage on failure
      window.dispatchEvent(new Event('auth-failure')) // NEW: Trigger logout
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }

  }
)


export function clearStoredTokens() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.access)
  localStorage.removeItem(STORAGE_KEYS.refresh)
  localStorage.removeItem(STORAGE_KEYS.user)
}


