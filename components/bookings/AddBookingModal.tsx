'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import type { BookingCreateInput, BookingStatus } from '@/types'

interface AddBookingModalProps {
  isOpen: boolean
  onClose: () => void
}

function toInputDate(iso: string) {
  if (!iso) return ''
  return iso.includes('T') ? iso.split('T')[0]! : iso.slice(0, 10)
}

export default function AddBookingModal({ isOpen, onClose }: AddBookingModalProps) {
  const { addBooking, cars, clients } = useData()
  const [formData, setFormData] = useState({
    car: '',
    customer: '',
    start_date: '',
    end_date: '',
    status: 'pending' as BookingStatus,
    pickup_location: 'Agence principale',
    return_location: 'Agence principale',
  })
  const [riskConfirmed, setRiskConfirmed] = useState(false)

  const selectedCar = useMemo(() => cars.find((car) => car.id === formData.car), [cars, formData.car])
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === formData.customer),
    [clients, formData.customer]
  )
  const reputation = selectedClient?.reputation ?? null
  const reputationStatus = reputation?.status
  const showReputationAlert = reputationStatus === 'DANGER' || reputationStatus === 'CAUTION'
  const scoreText = reputation ? `${reputation.average_rating.toFixed(1)}/5` : '—/5'
  const reputationAlertConfig =
    reputationStatus === 'DANGER'
      ? {
          title: `⚠️ CLIENT À RISQUE ÉLEVÉ (Score: ${scoreText})`,
          toneClass: 'border-red-500 bg-red-50 text-red-900 dark:border-red-500/70 dark:bg-red-950/40 dark:text-red-100',
        }
      : {
          title: `⚡ CLIENT À SURVEILLER (Score: ${scoreText})`,
          toneClass: 'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500/70 dark:bg-amber-950/40 dark:text-amber-100',
        }

  const dangerBlocksSubmit = reputationStatus === 'DANGER' && !riskConfirmed

  useEffect(() => {
    setRiskConfirmed(false)
  }, [formData.customer])

  useEffect(() => {
    if (!isOpen) setRiskConfirmed(false)
  }, [isOpen])

  const totalDays = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return 0
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  }, [formData.start_date, formData.end_date])

  const total_price = useMemo(
    () => (selectedCar?.prix_journalier || 0) * totalDays,
    [selectedCar, totalDays]
  )

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.car || !formData.customer) {
      toast.error('Choisissez un véhicule et un client.')
      return
    }
    if (reputationStatus === 'DANGER' && !riskConfirmed) {
      toast.error('Cochez « Confirmer le risque » pour enregistrer cette réservation.')
      return
    }
    const payload: BookingCreateInput = {
      car: formData.car,
      customer: formData.customer,
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_price,
      status: formData.status,
      departure_mileage: null,
      return_mileage: null,
      pickup_location: formData.pickup_location,
      return_location: formData.return_location,
    }
    try {
      await addBooking(payload)
      toast.success('Réservation créée')
      setRiskConfirmed(false)
      setFormData({
        car: '',
        customer: '',
        start_date: '',
        end_date: '',
        status: 'pending',
        pickup_location: 'Agence principale',
        return_location: 'Agence principale',
      })
      onClose()
    } catch {
      /* DataContext */
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">Nouvelle réservation</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {showReputationAlert && selectedClient && reputation && (
            <div
              role="alert"
              className={`rounded-lg border px-4 py-3 text-sm ${reputationAlertConfig.toneClass}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tracking-wide">{reputationAlertConfig.title}</p>
                  {reputation.recent_reasons.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                      {reputation.recent_reasons.map((reason, idx) => (
                        <li key={`${selectedClient.id}-reason-${idx}`}>{reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs opacity-90">Aucune raison récente communiquée.</p>
                  )}
                  {reputationStatus === 'DANGER' && (
                    <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={riskConfirmed}
                        onChange={(e) => setRiskConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
                      />
                      <span>Confirmer le risque</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

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
                <option value="">—</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.marque_nom} {car.modele_nom} — {formatCurrency(car.prix_journalier)}/j
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
                <option value="">—</option>
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
              <label className="block text-sm text-muted-foreground mb-1.5">Début</label>
              <input
                type="date"
                name="start_date"
                value={toInputDate(formData.start_date)}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, start_date: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Fin</label>
              <input
                type="date"
                name="end_date"
                value={toInputDate(formData.end_date)}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, end_date: e.target.value }))
                }
                required
                min={formData.start_date || undefined}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {selectedCar && formData.start_date && formData.end_date && (
            <p className="text-sm text-muted-foreground">
              {totalDays} jour{totalDays > 1 ? 's' : ''} × {formatCurrency(selectedCar.prix_journalier)} ={' '}
              <span className="font-semibold text-primary">{formatCurrency(total_price)}</span>
            </p>
          )}

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
              disabled={dangerBlocksSubmit}
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
