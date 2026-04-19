'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RecentBookings() {
  const { bookings, getCarById, getClientById } = useData()

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 5)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">Réservations récentes</h3>
        <Link href="/bookings" className="text-sm text-primary hover:underline">
          Voir tout
        </Link>
      </div>

      <div className="space-y-4">
        {recentBookings.map((booking) => {
          const car = getCarById(booking.car)
          const client = getClientById(booking.customer)
          return (
            <div
              key={booking.id}
              className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-medium text-primary">
                    {client?.first_name?.[0]}
                    {client?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {client?.first_name} {client?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {car?.marque_nom} {car?.modele_nom} · {formatDate(booking.start_date)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-card-foreground">
                  {formatCurrency(booking.total_price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reste {formatCurrency(booking.remaining_balance)}
                </p>
              </div>
            </div>
          )
        })}

        {recentBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucune réservation pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
