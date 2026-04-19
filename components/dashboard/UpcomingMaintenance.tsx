'use client'

import Link from 'next/link'
import { Wrench, Calendar } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatDate } from '@/lib/utils'
import { mediaUrl } from '@/lib/api'

/** Cars with soonest administrative deadlines (vignette / assurance / visite). */
export default function UpcomingMaintenance() {
  const { cars } = useData()

  const withNextDate = cars
    .map((car) => {
      const dates = [
        car.vignette_expiration,
        car.assurance_expiration,
        car.visite_technique_expiration,
      ].filter((d): d is string => Boolean(d))
      const next = dates.length ? dates.sort()[0] : null
      return { car, next }
    })
    .filter((x) => x.next)
    .sort((a, b) => new Date(a.next!).getTime() - new Date(b.next!).getTime())
    .slice(0, 4)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-card-foreground">Échéances à venir</h3>
      </div>

      <div className="space-y-3">
        {withNextDate.map(({ car, next }) => {
          const thumb = car.images[0] ? mediaUrl(car.images[0].image) : ''
          return (
            <Link
              key={car.id}
              href={`/fleet/${car.id}`}
              className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`${car.marque_nom} ${car.modele_nom}`}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                )}
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {car.marque_nom} {car.modele_nom}
                  </p>
                  <p className="text-xs text-muted-foreground">{car.immatriculation}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(next!)}
                </div>
              </div>
            </Link>
          )
        })}

        {withNextDate.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune échéance renseignée</p>
        )}
      </div>
    </div>
  )
}
