'use client'

import { X, Calendar, MapPin, CreditCard, User, Car, AlertTriangle } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { mediaUrl } from '@/lib/api'
import type { Booking, BookingStatus } from '@/types'

interface ViewBookingModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
}

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  checked_out: 'bg-success/10 text-success',
  checked_in: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}

export default function ViewBookingModal({ booking, isOpen, onClose }: ViewBookingModalProps) {
  const { getCarById, getClientById } = useData()

  const car = getCarById(booking.car)
  const client = getClientById(booking.customer)
  const thumb = car?.images[0] ? mediaUrl(car.images[0].image) : ''

  if (!isOpen) return null

  const reputation = client?.reputation
  const isRisky = reputation?.status === 'DANGER' || reputation?.status === 'CAUTION'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Réservation #{String(booking.id).slice(0, 8).toUpperCase()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <span
            className={cn(
              'inline-flex px-3 py-1.5 rounded-full text-sm font-medium',
              statusStyles[booking.status]
            )}
          >
            {booking.status}
          </span>

          {isRisky && (
            <div
              className="flex gap-3 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {reputation?.status === 'DANGER' ? 'Client à risque élevé' : 'Client à surveiller'}
                </p>
                {reputation?.recent_reasons && reputation.recent_reasons.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive/95">
                    {reputation.recent_reasons.map((reason, idx) => (
                      <li key={`${client?.id ?? 'client'}-reason-${idx}`}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-destructive/90">
                    Ce client est signalé dans le système de réputation. Vérifiez les procédures internes avant de
                    poursuivre.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-card-foreground">Véhicule</h3>
            </div>
            <div className="flex gap-4">
              {thumb ? (
                <img
                  src={thumb}
                  alt={`${car?.marque_nom} ${car?.modele_nom}`}
                  className="h-20 w-28 rounded-lg object-cover"
                />
              ) : (
                <div className="h-20 w-28 rounded-lg bg-muted shrink-0" />
              )}
              <div>
                <p className="font-medium text-card-foreground">
                  {car?.marque_nom} {car?.modele_nom} ({car?.annee})
                </p>
                <p className="text-sm text-muted-foreground">{car?.immatriculation}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {car?.transmission} · {car?.carburant} · {car?.nb_places} places
                </p>
                <p className="text-sm font-medium text-primary mt-1">
                  {formatCurrency(car?.prix_journalier || 0)}/jour
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-card-foreground">Client</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium text-card-foreground">
                  {client?.first_name} {client?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-card-foreground">{client?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium text-card-foreground">{client?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CIN</p>
                <p className="font-medium text-card-foreground">{client?.cin ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Permis</p>
                <p className="font-medium text-card-foreground">{client?.license_number ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-card-foreground">Période de location</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date de début</p>
                <p className="font-medium text-card-foreground">{formatDate(booking.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de fin</p>
                <p className="font-medium text-card-foreground">{formatDate(booking.end_date)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-card-foreground">Lieux</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prise en charge</p>
                <p className="font-medium text-card-foreground">{booking.pickup_location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restitution</p>
                <p className="font-medium text-card-foreground">{booking.return_location}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-card-foreground">Montants</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant total</span>
                <span className="font-medium text-card-foreground">{formatCurrency(booking.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Solde restant</span>
                <span className="font-medium text-destructive">
                  {formatCurrency(booking.remaining_balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
