'use client'

import { useMemo } from 'react'
import { Car, Users, CalendarCheck, DollarSign, AlertCircle } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentBookings from '@/components/dashboard/RecentBookings'
import FleetStatus from '@/components/dashboard/FleetStatus'
import UpcomingMaintenance from '@/components/dashboard/UpcomingMaintenance'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 rounded-xl bg-muted" />
        <div className="h-80 rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { cars, clients, bookings, loading } = useData()

  const availableCars = cars.filter((c) => c.statut === 'disponible').length

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === 'checked_out').length,
    [bookings]
  )

  const totalBookedValue = useMemo(
    () => bookings.reduce((sum, b) => sum + b.total_price, 0),
    [bookings]
  )

  const totalOutstanding = useMemo(
    () => bookings.reduce((sum, b) => sum + b.remaining_balance, 0),
    [bookings]
  )

  const stats = [
    {
      title: 'Flotte totale',
      value: cars.length.toString(),
      subtitle: `${availableCars} disponibles`,
      icon: Car,
      trend: '',
      trendUp: true,
    },
    {
      title: 'Clients actifs',
      value: clients.length.toString(),
      subtitle: 'Clients enregistrés',
      icon: Users,
      trend: '',
      trendUp: true,
    },
    {
      title: 'Locations en cours',
      value: activeBookings.toString(),
      subtitle: `${bookings.length} réservations au total`,
      icon: CalendarCheck,
      trend: '',
      trendUp: true,
    },
    {
      title: 'CA réservations',
      value: formatCurrency(totalBookedValue),
      subtitle: `${formatCurrency(totalOutstanding)} solde restant`,
      icon: DollarSign,
      trend: '',
      trendUp: true,
    },
  ]

  if (loading) {
    return <DashboardSkeleton />
  }

  const complianceAlerts = cars.filter((c) => {
    const vt = c.visite_technique_expiration
    if (!vt) return false
    return new Date(vt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentBookings />
        </div>
        <div>
          <FleetStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingMaintenance />

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-card-foreground">Visite technique (30 j.)</h3>
          </div>
          <div className="space-y-3">
            {complianceAlerts.map((car) => (
              <div
                key={car.id}
                className="flex items-center justify-between rounded-lg bg-warning/10 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {car.marque_nom} {car.modele_nom}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Échéance{' '}
                    {car.visite_technique_expiration
                      ? formatDate(car.visite_technique_expiration)
                      : '—'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-warning text-warning-foreground">
                  À planifier
                </span>
              </div>
            ))}
            {complianceAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune alerte pour le moment</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
