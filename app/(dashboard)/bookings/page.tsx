'use client'

import { useState } from 'react'
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Calendar } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { mediaUrl } from '@/lib/api'
import AddBookingModal from '@/components/bookings/AddBookingModal'
import EditBookingModal from '@/components/bookings/EditBookingModal'
import ViewBookingModal from '@/components/bookings/ViewBookingModal'
import { toast } from 'sonner'
import type { Booking, BookingStatus } from '@/types'

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  checked_out: 'bg-success/10 text-success',
  checked_in: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}

function balanceBadgeClass(remaining: number) {
  if (remaining <= 0) return 'bg-success/10 text-success'
  return 'bg-warning/10 text-warning'
}

export default function Bookings() {
  const { bookings, deleteBooking, getCarById, getClientById } = useData()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filteredBookings = bookings.filter((booking) => {
    const car = getCarById(booking.car)
    const client = getClientById(booking.customer)
    const carName = `${car?.marque_nom} ${car?.modele_nom}`.toLowerCase()
    const clientName = `${client?.first_name} ${client?.last_name}`.toLowerCase()

    const matchesSearch =
      carName.includes(searchQuery.toLowerCase()) ||
      clientName.includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteBooking(id)
      toast.success('La réservation a été supprimée')
      setOpenDropdown(null)
    } catch {
      /* toast DataContext */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Réservations</h2>
          <p className="text-muted-foreground">Gérer les réservations de location</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmée</option>
          <option value="checked_out">En cours (sortie)</option>
          <option value="checked_in">Retournée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Réservation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedBookings.map((booking) => {
                const car = getCarById(booking.car)
                const client = getClientById(booking.customer)
                const thumb = car?.images[0] ? mediaUrl(car.images[0].image) : ''

                return (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          #{String(booking.id).slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={`${car?.marque_nom} ${car?.modele_nom}`}
                            className="h-10 w-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-muted" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {car?.marque_nom} {car?.modele_nom}
                          </p>
                          <p className="text-xs text-muted-foreground">{car?.immatriculation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-card-foreground">
                        {client?.first_name} {client?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{client?.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-card-foreground">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(booking.start_date)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        au {formatDate(booking.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-card-foreground">
                        {formatCurrency(booking.total_price)}
                      </p>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          balanceBadgeClass(booking.remaining_balance)
                        )}
                      >
                        Reste {formatCurrency(booking.remaining_balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          statusStyles[booking.status]
                        )}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === booking.id ? null : booking.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openDropdown === booking.id && (
                          <div className="absolute right-0 top-10 z-10 w-32 rounded-lg border border-border bg-popover shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingBooking(booking)
                                setOpenDropdown(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                            >
                              <Eye className="h-4 w-4" />
                              Voir
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBooking(booking)
                                setOpenDropdown(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                            >
                              <Edit className="h-4 w-4" />
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(booking.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {sortedBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">Aucune réservation trouvée</h3>
            <p className="text-muted-foreground mt-1">Essayez d&apos;ajuster votre recherche ou vos filtres</p>
          </div>
        )}
      </div>

      <AddBookingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {editingBooking && (
        <EditBookingModal
          key={editingBooking.id}
          booking={editingBooking}
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {viewingBooking && (
        <ViewBookingModal
          booking={viewingBooking}
          isOpen={!!viewingBooking}
          onClose={() => setViewingBooking(null)}
        />
      )}
    </div>
  )
}
