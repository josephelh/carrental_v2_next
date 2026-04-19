'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import {
  extractBackendMessage,
  mapApiBooking,
  mapApiCar,
  mapApiClient,
  serializeBookingForCreate,
  serializeBookingForPatch,
  serializeCarForCreate,
  serializeCarForPatch,
  serializeClientForCreate,
  serializeMaintenanceForCreate,
  unwrapList,
} from '@/lib/djangoDataMappers'
import { useAuth } from '@/context/AuthContext'
import type {
  Booking,
  BookingCreateInput,
  Car,
  CarCreateInput,
  Client,
  ClientCreateInput,
  MaintenanceRecord,
} from '@/types'

const ENDPOINTS = {
  cars: 'admin/fleet/cars/',
  maintenance: 'admin/fleet/maintenance/',
  customers: 'admin/customers/',
  bookings: 'admin/rentals/bookings/',
} as const

function toastIfBadRequestOrForbidden(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const status = e.response?.status
    if (status === 400 || status === 403) {
      const msg = extractBackendMessage(e.response?.data)
      toast.error(msg || fallback)
      return
    }
  }
  toast.error(fallback)
}

interface DataContextType {
  cars: Car[]
  clients: Client[]
  bookings: Booking[]
  loading: boolean
  addCar: (car: CarCreateInput) => Promise<void>
  updateCar: (id: string, car: Partial<Car>) => Promise<void>
  deleteCar: (id: string) => Promise<void>
  addMaintenanceRecord: (
    carId: string,
    record: Pick<MaintenanceRecord, 'description' | 'cost' | 'date'>
  ) => Promise<void>
  addClient: (client: ClientCreateInput) => Promise<void>
  updateClient: (id: string, client: Partial<Client>) => void
  deleteClient: (id: string) => void
  addBooking: (booking: BookingCreateInput) => Promise<void>
  updateBooking: (id: string, booking: Partial<Booking>) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
  getCarById: (id: string) => Car | undefined
  getClientById: (id: string) => Client | undefined
  /** Reload cars, clients, and bookings without clearing the UI on failure. */
  refetchData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [cars, setCars] = useState<Car[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) setLoading(true)
    try {
      const [carsRes, clientsRes, bookingsRes] = await Promise.all([
        api.get(ENDPOINTS.cars),
        api.get(ENDPOINTS.customers),
        api.get(ENDPOINTS.bookings),
      ])
      setCars(unwrapList(carsRes.data).map(mapApiCar))
      setClients(unwrapList(clientsRes.data).map(mapApiClient))
      setBookings(unwrapList(bookingsRes.data).map(mapApiBooking))
    } catch (e) {
      if (silent) {
        toast.error(
          isAxiosError(e)
            ? extractBackendMessage(e.response?.data) || 'Impossible de rafraîchir les données.'
            : 'Impossible de rafraîchir les données.'
        )
      } else {
        toastIfBadRequestOrForbidden(
          e,
          'Impossible de charger les données. Vérifiez votre connexion ou vos droits d’accès.'
        )
        setCars([])
        setClients([])
        setBookings([])
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    startTransition(() => {
      if (authLoading) return
      if (!isAuthenticated) {
        setCars([])
        setClients([])
        setBookings([])
        setLoading(false)
        return
      }
      void loadData()
    })
  }, [authLoading, isAuthenticated, loadData])

  const refetchData = useCallback(async () => {
    await loadData({ silent: true })
  }, [loadData])

  const addCar = useCallback(
    async (car: CarCreateInput) => {
      try {
        await api.post(ENDPOINTS.cars, serializeCarForCreate(car))
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(
          e,
          'Impossible d’ajouter le véhicule (limite atteinte ou données invalides).'
        )
        throw e
      }
    },
    [loadData]
  )

  const updateCar = useCallback(
    async (id: string, updates: Partial<Car>) => {
      try {
        const body = serializeCarForPatch(updates)
        if (Object.keys(body).length === 0) return
        await api.patch(`${ENDPOINTS.cars}${id}/`, body)
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible de mettre à jour le véhicule.')
        throw e
      }
    },
    [loadData]
  )

  const deleteCar = useCallback(
    async (id: string) => {
      try {
        await api.delete(`${ENDPOINTS.cars}${id}/`)
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible de supprimer le véhicule.')
        throw e
      }
    },
    [loadData]
  )

  const addMaintenanceRecord = useCallback(
    async (carId: string, record: Pick<MaintenanceRecord, 'description' | 'cost' | 'date'>) => {
      try {
        await api.post(
          ENDPOINTS.maintenance,
          serializeMaintenanceForCreate({ ...record, car: carId })
        )
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible d’enregistrer la maintenance.')
        throw e
      }
    },
    [loadData]
  )

  const addClient = useCallback(
    async (client: ClientCreateInput) => {
      try {
        await api.post(ENDPOINTS.customers, serializeClientForCreate(client))
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible d’ajouter le client.')
        throw e
      }
    },
    [loadData]
  )

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const addBooking = useCallback(
    async (booking: BookingCreateInput) => {
      try {
        await api.post(ENDPOINTS.bookings, serializeBookingForCreate(booking))
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible de créer la réservation.')
        throw e
      }
    },
    [loadData]
  )

  const updateBooking = useCallback(
    async (id: string, updates: Partial<Booking>) => {
      try {
        const body = serializeBookingForPatch(updates)
        if (Object.keys(body).length === 0) return
        await api.patch(`${ENDPOINTS.bookings}${id}/`, body)
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible de mettre à jour la réservation.')
        throw e
      }
    },
    [loadData]
  )

  const deleteBooking = useCallback(
    async (id: string) => {
      try {
        await api.delete(`${ENDPOINTS.bookings}${id}/`)
        await loadData({ silent: true })
      } catch (e) {
        toastIfBadRequestOrForbidden(e, 'Impossible de supprimer la réservation.')
        throw e
      }
    },
    [loadData]
  )

  const getCarById = (id: string) => cars.find((car) => car.id === id)
  const getClientById = (id: string) => clients.find((c) => c.id === id)

  return (
    <DataContext.Provider
      value={{
        cars,
        clients,
        bookings,
        loading,
        addCar,
        updateCar,
        deleteCar,
        addMaintenanceRecord,
        addClient,
        updateClient,
        deleteClient,
        addBooking,
        updateBooking,
        deleteBooking,
        getCarById,
        getClientById,
        refetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
