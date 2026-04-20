'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Star, X, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/context/DataContext'
import { api } from '@/lib/api'
import { extractBackendMessage } from '@/lib/djangoDataMappers'
import type { Client } from '@/types'

const REASON_PRESETS = [
  { value: 'non_payment', label: 'Non-paiement', reason: 'Non-paiement' },
  { value: 'theft', label: 'Vol', reason: 'Vol' },
  { value: 'serious_accident', label: 'Accident grave', reason: 'Accident grave' },
  { value: 'other', label: 'Autre (préciser ci-dessous)', reason: '' },
] as const

interface ReportClientToGlobalModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  /** Optional hook after refetch (e.g. analytics). Data is refreshed via DataContext inside the modal. */
  onSuccess?: () => void | Promise<void>
}

export default function ReportClientToGlobalModal({
  client,
  isOpen,
  onClose,
  onSuccess,
}: ReportClientToGlobalModalProps) {
  const { refetchData } = useData()
  const [preset, setPreset] = useState<string>(REASON_PRESETS[0].value)
  const [otherReason, setOtherReason] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !client) return null

  const resolvedReason = (() => {
    const row = REASON_PRESETS.find((p) => p.value === preset)
    if (!row) return ''
    if (row.value === 'other') return otherReason.trim()
    return row.reason
  })()

  const handleClose = () => {
    setPreset(REASON_PRESETS[0].value)
    setOtherReason('')
    setRating(5)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedReason) {
      toast.error('Indiquez une raison du signalement.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/customers/${client.id}/report_to_global/`, {
        reason: resolvedReason,
        rating,
      })
      toast.success('Client signalé avec succès à la base communautaire.')
      await refetchData()
      await onSuccess?.()
      handleClose()
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = extractBackendMessage(err.response?.data)
        toast.error(msg || 'Le signalement a échoué.')
      } else {
        toast.error('Le signalement a échoué.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => !submitting && handleClose()} />

      <div className="relative z-61 w-full max-w-md rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
            <h2 className="text-lg font-semibold text-card-foreground">Signaler au Blacklist Global</h2>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Client :{' '}
            <span className="font-medium text-foreground">
              {client.first_name} {client.last_name}
            </span>
          </p>

          <div>
            <label htmlFor="report-reason-preset" className="block text-sm text-muted-foreground mb-1.5">
              Raison du signalement
            </label>
            <select
              id="report-reason-preset"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {REASON_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {preset === 'other' && (
            <div>
              <label htmlFor="report-reason-other" className="block text-sm text-muted-foreground mb-1.5">
                Précisez la raison
              </label>
              <textarea
                id="report-reason-other"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-20"
                placeholder="Décrivez le motif…"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Rating</label>
            <div className="flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`Noter ${value} étoile${value > 1 ? 's' : ''}`}
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-amber-500"
                >
                  <Star
                    className={`h-5 w-5 ${value <= rating ? 'fill-amber-400 text-amber-500' : 'fill-transparent'}`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !resolvedReason || rating < 1 || rating > 5}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? 'Envoi…' : 'Confirmer le signalement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
