'use client'

import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  GanttChart,
  Car,
  User,
  Clock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn, formatCurrency } from '@/lib/utils'
import { useData } from '@/context/DataContext'
import type { Booking } from '@/types'

type ViewMode = 'month' | 'timeline'

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
]

const STATUS_COLORS: Record<Booking['status'], { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/50' },
  confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/50' },
  checked_out: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500/50' },
  checked_in: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/50' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/50' },
}

export default function CalendarPage() {
  const router = useRouter()
  const { bookings, cars, getCarById, getClientById } = useData()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get days in month
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const days: Date[] = []
    
    // Add padding days from previous month
    const firstDayOfWeek = firstDay.getDay()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, -i)
      days.push(date)
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i))
    }
    
    // Add padding days from next month
    const remainingDays = 42 - days.length // 6 weeks
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i))
    }
    
    return days
  }, [currentMonth, currentYear])

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter((booking) => {
      const startDate = new Date(booking.start_date).toISOString().split('T')[0]
      const endDate = new Date(booking.end_date).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate
    })
  }

  // Get bookings that are visible in the current month for timeline view
  const timelineBookings = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0)
    
    return bookings.filter((booking) => {
      const startDate = new Date(booking.start_date)
      const endDate = new Date(booking.end_date)
      return (startDate <= monthEnd && endDate >= monthStart)
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [bookings, currentMonth, currentYear])

  // Group bookings by car for timeline
  const bookingsByCar = useMemo(() => {
    const grouped: Record<string, Booking[]> = {}
    timelineBookings.forEach((booking) => {
      if (!grouped[booking.car]) {
        grouped[booking.car] = []
      }
      grouped[booking.car].push(booking)
    })
    return grouped
  }, [timelineBookings])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth
  }

  // Calculate position and width for timeline bars
  const getTimelineBarStyle = (booking: Booking) => {
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0)
    const daysInCurrentMonth = monthEnd.getDate()
    
    const startDate = new Date(booking.start_date)
    const endDate = new Date(booking.end_date)
    
    // Clamp dates to current month
    const visibleStart = startDate < monthStart ? monthStart : startDate
    const visibleEnd = endDate > monthEnd ? monthEnd : endDate
    
    const startDay = visibleStart.getDate()
    const endDay = visibleEnd.getDate()
    
    const left = ((startDay - 1) / daysInCurrentMonth) * 100
    const width = ((endDay - startDay + 1) / daysInCurrentMonth) * 100
    
    return { left: `${left}%`, width: `${width}%` }
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-secondary p-1">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'month' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Mois
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'timeline' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GanttChart className="h-4 w-4" />
              Chronologie
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', colors.bg, 'border', colors.border)} />
            <span className="text-muted-foreground capitalize">{status}</span>
          </div>
        ))}
      </div>

      {viewMode === 'month' ? (
        /* Monthly Calendar View */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((day) => (
              <div 
                key={day} 
                className="p-3 text-center text-sm font-medium text-muted-foreground bg-secondary/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {daysInMonth.map((date, index) => {
              const dayBookings = getBookingsForDate(date)
              const isInCurrentMonth = isCurrentMonth(date)
              const isTodayDate = isToday(date)

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[120px] p-2 border-b border-r border-border last:border-r-0 [&:nth-child(7n)]:border-r-0',
                    !isInCurrentMonth && 'bg-secondary/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'flex items-center justify-center h-7 w-7 text-sm font-medium rounded-full',
                        isTodayDate && 'bg-primary text-primary-foreground',
                        !isTodayDate && isInCurrentMonth && 'text-foreground',
                        !isTodayDate && !isInCurrentMonth && 'text-muted-foreground'
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {dayBookings.length} reservation{dayBookings.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => {
                      const car = getCarById(booking.car)
                      const colors = STATUS_COLORS[booking.status]
                      
                      return (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={cn(
                            'w-full text-left px-2 py-1 text-xs font-medium rounded truncate border transition-transform hover:scale-[1.02]',
                            colors.bg,
                            colors.text,
                            colors.border
                          )}
                        >
                          {car ? `${car.marque_nom} ${car.modele_nom}` : 'Véhicule inconnu'}
                        </button>
                      )
                    })}
                    {dayBookings.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayBookings.length - 3} de plus
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Timeline / Gantt View */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Timeline Header */}
          <div className="flex border-b border-border">
            <div className="w-48 flex-shrink-0 p-3 bg-secondary/50 border-r border-border">
              <span className="text-sm font-medium text-muted-foreground">Vehicule</span>
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 p-2 text-center text-xs font-medium border-r border-border last:border-r-0 bg-secondary/50',
                      isToday(new Date(currentYear, currentMonth, i + 1)) && 'bg-primary/10'
                    )}
                  >
                    <div className={cn(
                      'text-muted-foreground',
                      isToday(new Date(currentYear, currentMonth, i + 1)) && 'text-primary font-semibold'
                    )}>
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-border">
            {cars.map((car) => {
              const carBookings = bookingsByCar[car.id] || []
              
              return (
                <div key={car.id} className="flex min-h-[60px]">
                  {/* Car Info */}
                  <div 
                    className="w-48 flex-shrink-0 p-3 border-r border-border flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => router.push(`/fleet/${car.id}`)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-foreground truncate">
                        {car.marque_nom} {car.modele_nom}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {car.immatriculation}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Bars */}
                  <div className="flex-1 relative p-2">
                    {/* Day grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            'flex-1 border-r border-border/30 last:border-r-0',
                            isToday(new Date(currentYear, currentMonth, i + 1)) && 'bg-primary/5'
                          )}
                        />
                      ))}
                    </div>

                    {/* Booking bars */}
                    <div className="relative h-full flex items-center">
                      {carBookings.map((booking) => {
                        const style = getTimelineBarStyle(booking)
                        const colors = STATUS_COLORS[booking.status]
                        const client = getClientById(booking.customer)
                        
                        return (
                          <button
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            style={style}
                            className={cn(
                              'absolute h-8 rounded-md border px-2 flex items-center gap-1 text-xs font-medium transition-all hover:z-10 hover:scale-y-110 hover:shadow-lg',
                              colors.bg,
                              colors.text,
                              colors.border
                            )}
                          >
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {client ? `${client.first_name} ${client.last_name}` : 'Inconnu'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}

            {cars.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucun vehicule dans la flotte
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="w-full max-w-md mx-4 rounded-xl bg-card border border-border p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Details de reservation</h3>
                <p className="text-sm text-muted-foreground">#{selectedBooking.id.slice(0, 8)}</p>
              </div>
              <div className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border',
                STATUS_COLORS[selectedBooking.status].bg,
                STATUS_COLORS[selectedBooking.status].text,
                STATUS_COLORS[selectedBooking.status].border
              )}>
                {selectedBooking.status}
              </div>
            </div>

            <div className="space-y-4">
              {/* Car Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(() => {
                      const car = getCarById(selectedBooking.car)
                      return car ? `${car.marque_nom} ${car.modele_nom}` : 'Véhicule inconnu'
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCarById(selectedBooking.car)?.immatriculation || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(() => {
                      const client = getClientById(selectedBooking.customer)
                      return client ? `${client.first_name} ${client.last_name}` : 'Client inconnu'
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getClientById(selectedBooking.customer)?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil((new Date(selectedBooking.end_date).getTime() - new Date(selectedBooking.start_date).getTime()) / (1000 * 60 * 60 * 24))} jours
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-muted-foreground">Montant total</span>
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(selectedBooking.total_price)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setSelectedBooking(null)
                  router.push('/bookings')
                }}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Voir dans les reservations
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
