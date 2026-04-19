'use client'

import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import type { CarStatut } from '@/types'

const statusConfig: Record<CarStatut, { label: string; color: string }> = {
  disponible: { label: 'Disponible', color: 'bg-success' },
  louée: { label: 'Louée', color: 'bg-primary' },
  réservée: { label: 'Réservée', color: 'bg-warning' },
  maintenance: { label: 'Maintenance', color: 'bg-destructive' },
}

export default function FleetStatus() {
  const { cars } = useData()

  const statusCounts = cars.reduce(
    (acc, car) => {
      acc[car.statut] = (acc[car.statut] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const total = cars.length || 1

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-card-foreground mb-4">État de la flotte</h3>

      <div className="h-3 rounded-full bg-secondary overflow-hidden flex mb-6">
        {(Object.keys(statusConfig) as CarStatut[]).map((status) => {
          const count = statusCounts[status] || 0
          const percentage = (count / total) * 100
          return (
            <div
              key={status}
              className={cn('h-full transition-all', statusConfig[status].color)}
              style={{ width: `${percentage}%` }}
            />
          )
        })}
      </div>

      <div className="space-y-3">
        {(Object.keys(statusConfig) as CarStatut[]).map((status) => {
          const config = statusConfig[status]
          const count = statusCounts[status] || 0
          const percentage = Math.round((count / total) * 100)

          return (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('h-2.5 w-2.5 rounded-full', config.color)} />
                <span className="text-sm text-card-foreground">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground">{count}</span>
                <span className="text-xs text-muted-foreground">({percentage}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
