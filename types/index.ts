/** Django user / profile; extend fields to match your serializers. */
export interface AuthUser {
  id: number | string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  role: 'ADMIN' | 'AGENT'
}

/** Fleet.Car choices (values as stored in DB). */
export type CarStatut = 'disponible' | 'louée' | 'maintenance' | 'réservée'

export type CarCategorie = 'Citadine' | 'Berline' | 'SUV' | 'Luxe' | 'Utilitaire'

export type CarTransmission = 'Manuelle' | 'Automatique'

export type CarCarburant = 'Diesel' | 'Essence' | 'Electrique' | 'Hybride'

export interface CarImage {
  id: string
  /** Absolute or relative URL from the API */
  image: string
}

/** Admin fleet car — matches `CarSerializer` / `Car` model. */
export interface Car {
  id: string
  marque: number
  modele: number
  marque_nom: string
  modele_nom: string
  annee: number
  immatriculation: string
  categorie: CarCategorie
  transmission: CarTransmission
  carburant: CarCarburant
  nb_places: number
  prix_journalier: number
  caution: number
  statut: CarStatut
  kilometrage: number
  vignette_expiration: string | null
  assurance_expiration: string | null
  visite_technique_expiration: string | null
  current_fuel_level: number
  last_oil_change_km: number | null
  next_oil_change_km: number | null
  created_at: string
  images: CarImage[]
}

/** Payload for POST/PATCH car (omit read-only list fields if not needed on create). */
export type CarCreateInput = Omit<Car, 'id' | 'marque_nom' | 'modele_nom' | 'created_at' | 'images'>

export type ClientReputationStatus = 'TRUSTED' | 'NEUTRAL' | 'CAUTION' | 'DANGER'

export interface ClientReputation {
    average_rating: number;
    total_reports: number;
    status: 'TRUSTED' | 'NEUTRAL' | 'CAUTION' | 'DANGER';
    recent_reasons: string[];
}

/** Row from GET /api/blacklist/check_identity/ (local BlacklistEntry). */
export interface BlacklistLocalHit {
  id: number
  identity_hash: string
  reason: string
  created_at: string
}

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS'

/** Optional aggregates from customer detail / analytics API. */
export interface ClientStats {
  total_revenue?: number
  booking_count?: number
  /** ISO date of last visit / last rental activity when provided by API. */
  last_visit?: string
}

/** Customer as returned by `CustomerSerializer` (staff). */
export interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  cin: string | null
  license_number: string | null
  customer_type: CustomerType
  business_name: string | null
  ice: string | null
  rc: string | null
  if_number: string | null
  user: number | null
  reputation: ClientReputation | null
  nationality: string | null
  address: string | null
  notes: string | null
  date_of_birth: string | null
  stats?: ClientStats
}

/** POST /admin/customers/ — fields persisted by `CustomerSerializer.create`. */
export interface ClientCreateInput {
  first_name: string
  last_name: string
  email: string
  phone: string
  cin: string
  license_number: string
  customer_type: CustomerType
  business_name: string
  ice: string
  rc: string
  if_number: string
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_out'
  | 'checked_in'
  | 'cancelled'

/** Admin booking — matches `BookingSerializer`. */
export interface Booking {
  id: string
  car: string
  customer: string
  start_date: string
  end_date: string
  total_price: number
  status: BookingStatus
  remaining_balance: number
  departure_mileage: number | null
  return_mileage: number | null
  pickup_location: string
  return_location: string
}

/** POST /admin/rentals/bookings/ */
export type BookingCreateInput = Omit<Booking, 'id' | 'remaining_balance'>

/** Maintenance row — matches `Maintenance` model / serializer `fields = "__all__"`. */
export interface MaintenanceRecord {
  id: string
  car: string
  description: string
  cost: number
  date: string
}

export interface Marque {
  id: number
  nom: string
}

export interface Modele {
  id: number
  nom: string
  marque: number
}
