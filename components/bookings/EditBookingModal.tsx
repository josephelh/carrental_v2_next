'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'
import BookingBlacklistFormAlert from '@/components/bookings/BookingBlacklistFormAlert'
import type { Booking, BookingStatus } from '@/types'

interface EditBookingModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
}

function toInputDate(iso: string) {
  if (!iso) return ''
  return iso.includes('T') ? iso.split('T')[0]! : iso.slice(0, 10)
}

type FormState = {
  car: string
  customer: string
  start_date: string
  end_date: string
  total_price: number
  status: BookingStatus
  pickup_location: string
  return_location: string
}

function bookingToForm(b: Booking): FormState {
  return {
    car: b.car,
    customer: b.customer,
    start_date: toInputDate(b.start_date),
    end_date: toInputDate(b.end_date),
    total_price: b.total_price,
    status: b.status,
    pickup_location: b.pickup_location,
    return_location: b.return_location,
  }
}

export default function EditBookingModal({ booking, isOpen, onClose }: EditBookingModalProps) {
  const { updateBooking, cars, clients } = useData()
  const [formData, setFormData] = useState<FormState>(() => bookingToForm(booking))
  const [riskConfirmed, setRiskConfirmed] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(bookingToForm(booking))
      setRiskConfirmed(false)
    }
  }, [booking, isOpen])

  useEffect(() => {
    setRiskConfirmed(false)
  }, [formData.customer])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formData.customer),
    [clients, formData.customer]
  )
  const riskyClient =
    selectedClient?.reputation?.status === 'DANGER' ||
    selectedClient?.reputation?.status === 'CAUTION'

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateBooking(booking.id, {
        car: formData.car,
        customer: formData.customer,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_price: formData.total_price,
        status: formData.status,
        pickup_location: formData.pickup_location,
        return_location: formData.return_location,
      })
      toast.success('La réservation a été mise à jour')
      onClose()
    } catch {
      /* DataContext */
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">Modifier la réservation</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <BookingBlacklistFormAlert
            reputation={selectedClient?.reputation}
            riskConfirmed={riskConfirmed}
            onRiskConfirmedChange={setRiskConfirmed}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Véhicule</label>
              <select
                name="car"
                value={formData.car}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.marque_nom} {car.modele_nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Client</label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="checked_out">Sortie véhicule</option>
                <option value="checked_in">Retour véhicule</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Prix total</label>
              <input
                type="number"
                name="total_price"
                value={formData.total_price}
                onChange={handleChange}
                min={0}
                step="0.01"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Début</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Fin</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                min={formData.start_date || undefined}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Prise en charge</label>
              <select
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option>Agence principale</option>
                <option>Terminal aéroport</option>
                <option>Agence centre-ville</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Restitution</label>
              <select
                name="return_location"
                value={formData.return_location}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option>Agence principale</option>
                <option>Terminal aéroport</option>
                <option>Agence centre-ville</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={riskyClient && !riskConfirmed}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
