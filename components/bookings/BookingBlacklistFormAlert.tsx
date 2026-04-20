'use client'

import { AlertTriangle, Shield } from 'lucide-react'
import type { ClientReputation } from '@/types'

interface BookingBlacklistFormAlertProps {
  reputation: ClientReputation | null | undefined
  riskConfirmed: boolean
  onRiskConfirmedChange: (checked: boolean) => void
}

export default function BookingBlacklistFormAlert({
  reputation,
  riskConfirmed,
  onRiskConfirmedChange,
}: BookingBlacklistFormAlertProps) {
  if (!reputation || (reputation.status !== 'DANGER' && reputation.status !== 'CAUTION')) return null

  const title =
    reputation.status === 'DANGER'
      ? 'Client à risque élevé — vérification requise'
      : 'Client à surveiller — prudence recommandée'

  return (
    <div className="space-y-3" role="alert">
      <div className="flex gap-3 rounded-lg border-2 border-destructive/90 bg-destructive px-4 py-3 text-sm text-destructive-foreground shadow-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold flex flex-wrap items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" aria-hidden />
            {title}
          </p>
          {reputation.recent_reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 opacity-95">
              {reputation.recent_reasons.map((reason, idx) => (
                <li key={`reason-${idx}`}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
          checked={riskConfirmed}
          onChange={(e) => onRiskConfirmedChange(e.target.checked)}
        />
        <span>
          <span className="font-medium text-foreground">Je confirme le risque</span>
          <span className="block text-muted-foreground mt-0.5 text-xs">
            Cochez cette case pour valider la réservation malgré le signal réputation.
          </span>
        </span>
      </label>
    </div>
  )
}
