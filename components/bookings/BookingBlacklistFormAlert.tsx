'use client'

import { AlertTriangle, Shield } from 'lucide-react'
import type { GlobalBlacklistStatus } from '@/types'

interface BookingBlacklistFormAlertProps {
  status: GlobalBlacklistStatus | null | undefined
  riskConfirmed: boolean
  onRiskConfirmedChange: (checked: boolean) => void
}

export default function BookingBlacklistFormAlert({
  status,
  riskConfirmed,
  onRiskConfirmedChange,
}: BookingBlacklistFormAlertProps) {
  if (!status?.is_blacklisted) return null

  return (
    <div className="space-y-3" role="alert">
      <div className="flex gap-3 rounded-lg border-2 border-destructive/90 bg-destructive px-4 py-3 text-sm text-destructive-foreground shadow-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold flex flex-wrap items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" aria-hidden />
            Client sur la liste noire globale — location à haut risque
          </p>
          {status.reason ? (
            <p className="mt-2 opacity-95">
              <span className="font-medium">Motif :</span> {status.reason}
            </p>
          ) : null}
          {status.reporting_agency ? (
            <p className="mt-1 opacity-95">
              <span className="font-medium">Organisme signalant :</span> {status.reporting_agency}
            </p>
          ) : null}
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
            Cochez cette case pour valider la réservation malgré le signal central.
          </span>
        </span>
      </label>
    </div>
  )
}
