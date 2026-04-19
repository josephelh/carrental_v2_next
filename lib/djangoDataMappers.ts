import type {
  Booking,
  BookingCreateInput,
  BookingStatus,
  Car,
  CarCarburant,
  CarCategorie,
  CarCreateInput,
  CarImage,
  CarStatut,
  CarTransmission,
  Client,
  ClientCreateInput,
  GlobalBlacklistStatus,
  MaintenanceRecord,
} from '@/types'

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const r = asRecord(data)
  if (Array.isArray(r.results)) return r.results as T[]
  return []
}

function str(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k]
    if (v !== undefined && v !== null) return String(v)
  }
  return ''
}

function num(r: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return 0
}

function nullableStr(r: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k]
    if (v === null || v === undefined) continue
    if (v === '') return null
    return String(v)
  }
  return null
}

const CAR_STATUTS: CarStatut[] = ['disponible', 'louée', 'maintenance', 'réservée']
const CAR_CATEGORIES: CarCategorie[] = ['Citadine', 'Berline', 'SUV', 'Luxe', 'Utilitaire']
const CAR_CARBURANTS: CarCarburant[] = ['Diesel', 'Essence', 'Electrique', 'Hybride']
const CAR_TRANSMISSIONS: CarTransmission[] = ['Manuelle', 'Automatique']

function pickCarStatut(v: unknown): CarStatut {
  const s = String(v ?? 'disponible')
  return CAR_STATUTS.includes(s as CarStatut) ? (s as CarStatut) : 'disponible'
}

function pickCarCategorie(v: unknown): CarCategorie {
  const s = String(v ?? 'Berline')
  return CAR_CATEGORIES.includes(s as CarCategorie) ? (s as CarCategorie) : 'Berline'
}

function pickCarCarburant(v: unknown): CarCarburant {
  const s = String(v ?? 'Essence')
  return CAR_CARBURANTS.includes(s as CarCarburant) ? (s as CarCarburant) : 'Essence'
}

function pickCarTransmission(v: unknown): CarTransmission {
  const s = String(v ?? 'Manuelle')
  return CAR_TRANSMISSIONS.includes(s as CarTransmission) ? (s as CarTransmission) : 'Manuelle'
}

function mapApiCarImage(raw: unknown): CarImage {
  const r = asRecord(raw)
  const img = r.image
  let imageUrl = ''
  if (typeof img === 'string') imageUrl = img
  else if (img && typeof img === 'object' && 'url' in (img as object)) {
    imageUrl = String((img as { url?: string }).url ?? '')
  }
  return { id: str(r, 'id'), image: imageUrl }
}

export function mapApiCar(raw: unknown): Car {
  const r = asRecord(raw)
  const imagesRaw = r.images
  const images = Array.isArray(imagesRaw) ? imagesRaw.map(mapApiCarImage) : []

  return {
    id: str(r, 'id'),
    marque: num(r, 'marque'),
    modele: num(r, 'modele'),
    marque_nom: str(r, 'marque_nom'),
    modele_nom: str(r, 'modele_nom'),
    annee: num(r, 'annee', 'year') || new Date().getFullYear(),
    immatriculation: str(r, 'immatriculation', 'license_plate', 'licensePlate'),
    categorie: pickCarCategorie(r.categorie ?? r.category),
    transmission: pickCarTransmission(r.transmission),
    carburant: pickCarCarburant(r.carburant ?? r.fuel_type ?? r.fuelType),
    nb_places: num(r, 'nb_places', 'seats') || 5,
    prix_journalier: num(r, 'prix_journalier', 'daily_rate', 'dailyRate'),
    caution: num(r, 'caution'),
    statut: pickCarStatut(r.statut ?? r.status),
    kilometrage: num(r, 'kilometrage', 'mileage'),
    vignette_expiration: nullableStr(r, 'vignette_expiration'),
    assurance_expiration: nullableStr(r, 'assurance_expiration'),
    visite_technique_expiration: nullableStr(r, 'visite_technique_expiration'),
    current_fuel_level: num(r, 'current_fuel_level'),
    last_oil_change_km:
      r.last_oil_change_km === null || r.last_oil_change_km === undefined || r.last_oil_change_km === ''
        ? null
        : num(r, 'last_oil_change_km'),
    next_oil_change_km:
      r.next_oil_change_km === null || r.next_oil_change_km === undefined || r.next_oil_change_km === ''
        ? null
        : num(r, 'next_oil_change_km'),
    created_at: str(r, 'created_at', 'createdAt') || new Date().toISOString(),
    images,
  }
}

function mapGlobalBlacklistStatus(raw: unknown): GlobalBlacklistStatus {
  const r = asRecord(raw ?? {})
  const reason = r.reason ?? r.detail
  const agency = r.reporting_agency ?? r.reportingAgency
  const detail = r.detail
  return {
    is_blacklisted: Boolean(r.is_blacklisted ?? r.isBlacklisted),
    reason: reason === undefined || reason === null ? null : String(reason),
    reporting_agency: agency === undefined || agency === null ? null : String(agency),
    detail: detail === undefined || detail === null ? null : String(detail),
  }
}

export function mapApiClient(raw: unknown): Client {
  const r = asRecord(raw)
  const gbsRaw = r.global_blacklist_status ?? r.globalBlacklistStatus
  const userVal = r.user
  let user: number | null = null
  if (typeof userVal === 'number') user = userVal
  else if (userVal !== null && userVal !== undefined && userVal !== '') {
    const n = Number(userVal)
    if (!Number.isNaN(n)) user = n
  }

  const global_blacklist_status =
    gbsRaw !== undefined && gbsRaw !== null ? mapGlobalBlacklistStatus(gbsRaw) : null

  const cinVal = r.cin
  const licVal = r.license_number ?? r.licenseNumber

  return {
    id: str(r, 'id'),
    first_name: str(r, 'first_name', 'firstName'),
    last_name: str(r, 'last_name', 'lastName'),
    email: str(r, 'email'),
    phone: str(r, 'phone'),
    cin: cinVal === null || cinVal === undefined ? null : String(cinVal),
    license_number: licVal === null || licVal === undefined ? null : String(licVal),
    user,
    global_blacklist_status,
  }
}

const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'checked_out',
  'checked_in',
  'cancelled',
]

function pickBookingStatus(v: unknown): BookingStatus {
  const s = String(v ?? 'pending').toLowerCase()
  return BOOKING_STATUSES.includes(s as BookingStatus) ? (s as BookingStatus) : 'pending'
}

function fkIdFromNested(r: Record<string, unknown>, key: string): string {
  const v = r[key]
  if (v === null || v === undefined) return ''
  if (typeof v === 'number' || typeof v === 'string') return String(v)
  if (typeof v === 'object' && !Array.isArray(v)) {
    return str(asRecord(v), 'id')
  }
  return ''
}

export function mapApiBooking(raw: unknown): Booking {
  const r = asRecord(raw)
  const carId = fkIdFromNested(r, 'car')
  const customerId = fkIdFromNested(r, 'customer') || fkIdFromNested(r, 'client')
  return {
    id: str(r, 'id'),
    car: carId,
    customer: customerId,
    start_date: str(r, 'start_date', 'startDate'),
    end_date: str(r, 'end_date', 'endDate'),
    status: pickBookingStatus(r.status),
    total_price: num(r, 'total_price', 'total_amount', 'totalAmount'),
    remaining_balance: num(r, 'remaining_balance'),
    departure_mileage:
      r.departure_mileage === null || r.departure_mileage === undefined || r.departure_mileage === ''
        ? null
        : num(r, 'departure_mileage'),
    return_mileage:
      r.return_mileage === null || r.return_mileage === undefined || r.return_mileage === ''
        ? null
        : num(r, 'return_mileage'),
    pickup_location: str(r, 'pickup_location', 'pickupLocation'),
    return_location: str(r, 'return_location', 'dropoff_location', 'dropoffLocation'),
  }
}

/** Writable car fields for POST (matches CarSerializer, excluding read-only). */
function emptyDateToNull(v: string | null | undefined): string | null {
  if (v === undefined || v === null || String(v).trim() === '') return null
  return String(v)
}

export function serializeCarForCreate(input: CarCreateInput): Record<string, unknown> {
  return {
    marque: input.marque,
    modele: input.modele,
    annee: input.annee,
    immatriculation: input.immatriculation,
    categorie: input.categorie,
    transmission: input.transmission,
    carburant: input.carburant,
    nb_places: input.nb_places,
    prix_journalier: input.prix_journalier,
    caution: input.caution,
    statut: input.statut,
    kilometrage: input.kilometrage,
    vignette_expiration: emptyDateToNull(input.vignette_expiration),
    assurance_expiration: emptyDateToNull(input.assurance_expiration),
    visite_technique_expiration: emptyDateToNull(input.visite_technique_expiration),
    current_fuel_level: input.current_fuel_level,
    last_oil_change_km: input.last_oil_change_km,
    next_oil_change_km: input.next_oil_change_km,
  }
}

const PATCHABLE_CAR_KEYS = [
  'marque',
  'modele',
  'annee',
  'immatriculation',
  'categorie',
  'transmission',
  'carburant',
  'nb_places',
  'prix_journalier',
  'caution',
  'statut',
  'kilometrage',
  'vignette_expiration',
  'assurance_expiration',
  'visite_technique_expiration',
  'current_fuel_level',
  'last_oil_change_km',
  'next_oil_change_km',
] as const

type PatchableCarKey = (typeof PATCHABLE_CAR_KEYS)[number]

export function serializeCarForPatch(updates: Partial<Car>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const k of PATCHABLE_CAR_KEYS) {
    if (k in updates && (updates as Partial<Record<PatchableCarKey, unknown>>)[k] !== undefined) {
      let v = (updates as Record<string, unknown>)[k]
      if (
        (k === 'vignette_expiration' ||
          k === 'assurance_expiration' ||
          k === 'visite_technique_expiration') &&
        (v === '' || v === undefined)
      ) {
        v = null
      }
      body[k] = v
    }
  }
  return body
}

export function serializeClientForCreate(input: ClientCreateInput): Record<string, unknown> {
  return {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    cin: input.cin,
    license_number: input.license_number,
  }
}

/** Normalize date-only strings to noon UTC ISO for Django DateTimeField. */
function toDateTimeIso(value: string): string {
  const v = value.trim()
  if (!v) return v
  if (v.includes('T')) return v
  return `${v}T12:00:00`
}

export function serializeBookingForCreate(input: BookingCreateInput): Record<string, unknown> {
  return {
    car: Number(input.car),
    customer: Number(input.customer),
    start_date: toDateTimeIso(input.start_date),
    end_date: toDateTimeIso(input.end_date),
    total_price: input.total_price,
    status: input.status,
    departure_mileage: input.departure_mileage,
    return_mileage: input.return_mileage,
    pickup_location: input.pickup_location,
    return_location: input.return_location,
  }
}

export function serializeBookingForPatch(updates: Partial<Booking>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (updates.car !== undefined) body.car = Number(updates.car)
  if (updates.customer !== undefined) body.customer = Number(updates.customer)
  if (updates.start_date !== undefined) body.start_date = toDateTimeIso(updates.start_date)
  if (updates.end_date !== undefined) body.end_date = toDateTimeIso(updates.end_date)
  if (updates.total_price !== undefined) body.total_price = updates.total_price
  if (updates.status !== undefined) body.status = updates.status
  if (updates.departure_mileage !== undefined) body.departure_mileage = updates.departure_mileage
  if (updates.return_mileage !== undefined) body.return_mileage = updates.return_mileage
  if (updates.pickup_location !== undefined) body.pickup_location = updates.pickup_location
  if (updates.return_location !== undefined) body.return_location = updates.return_location
  return body
}

export function mapApiMaintenance(raw: unknown): MaintenanceRecord {
  const r = asRecord(raw)
  return {
    id: str(r, 'id'),
    car: str(r, 'car'),
    description: str(r, 'description'),
    cost: num(r, 'cost'),
    date: str(r, 'date'),
  }
}

export function serializeMaintenanceForCreate(
  input: Omit<MaintenanceRecord, 'id'>
): Record<string, unknown> {
  return {
    car: Number(input.car),
    description: input.description,
    cost: input.cost,
    date: input.date,
  }
}

/** Best-effort message from Django REST error payloads. */
export function extractBackendMessage(data: unknown): string {
  if (typeof data === 'string' && data.trim()) return data
  const d = asRecord(data)
  if (typeof d.detail === 'string' && d.detail.trim()) return d.detail
  if (Array.isArray(d.detail) && d.detail.length) return String(d.detail[0])
  const nfe = d.non_field_errors
  if (Array.isArray(nfe) && nfe.length) return String(nfe[0])
  const allErr = d.__all__
  if (Array.isArray(allErr) && allErr.length) return String(allErr[0])
  for (const v of Object.values(d)) {
    if (Array.isArray(v) && v.length) return String(v[0])
    if (typeof v === 'string' && v.trim()) return v
  }
  return ''
}
