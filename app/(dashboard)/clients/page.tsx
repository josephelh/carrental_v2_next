'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, MoreVertical, Edit, Trash2, Mail, Phone, ShieldAlert, Star } from 'lucide-react'
import { useData } from '@/context/DataContext'
import AddClientModal from '@/components/clients/AddClientModal'
import EditClientModal from '@/components/clients/EditClientModal'
import ReportClientToGlobalModal from '@/components/clients/ReportClientToGlobalModal'
import { toast } from 'sonner'
import type { Client } from '@/types'

export default function ClientsPage() {
  const { clients, deleteClient, bookings } = useData()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [reportingClient, setReportingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const bookingCountByCustomer = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of bookings) {
      m.set(b.customer, (m.get(b.customer) ?? 0) + 1)
    }
    return m
  }, [bookings])

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    const q = searchQuery.toLowerCase()
    return (
      fullName.includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.phone.includes(searchQuery) ||
      (client.cin ?? '').toLowerCase().includes(q) ||
      (client.license_number ?? '').toLowerCase().includes(q)
    )
  })

  const handleDelete = (id: string, name: string) => {
    deleteClient(id)
    toast.success(`${name} a été supprimé (affichage local)`)
    setOpenDropdown(null)
  }

  const ratingTextClass = (rating: number) => {
    if (rating >= 4) return 'text-emerald-600 dark:text-emerald-400'
    if (rating >= 2.5) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="text-muted-foreground">Gérer votre base clients</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, téléphone, CIN ou permis…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  CIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Permis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Réservations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client) => {
                const initials = `${client.first_name[0] ?? ''}${client.last_name[0] ?? ''}`
                const nBook = bookingCountByCustomer.get(client.id) ?? 0
                const rep = client.reputation
                return (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">
                            {client.first_name} {client.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-card-foreground">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-card-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {client.cin ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {client.license_number ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                        {nBook}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!rep || rep.status === 'NEUTRAL' ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Nouveau
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-semibold ${ratingTextClass(rep.average_rating)}`}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {rep.average_rating.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === client.id ? null : client.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openDropdown === client.id && (
                          <div className="absolute right-0 top-10 z-10 min-w-56 w-56 rounded-lg border border-border bg-popover shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClient(client)
                                setOpenDropdown(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                            >
                              <Edit className="h-4 w-4 shrink-0" />
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReportingClient(client)
                                setOpenDropdown(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                            >
                              <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                              Signaler au Blacklist Global
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  client.id,
                                  `${client.first_name} ${client.last_name}`
                                )
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                            >
                              <Trash2 className="h-4 w-4 shrink-0" />
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

        {filteredClients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">Aucun client trouvé</h3>
            <p className="text-muted-foreground mt-1">Essayez d&apos;ajuster votre recherche</p>
          </div>
        )}
      </div>

      <AddClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {editingClient && (
        <EditClientModal
          key={editingClient.id}
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
        />
      )}

      <ReportClientToGlobalModal
        client={reportingClient}
        isOpen={!!reportingClient}
        onClose={() => setReportingClient(null)}
      />
    </div>
  )
}
