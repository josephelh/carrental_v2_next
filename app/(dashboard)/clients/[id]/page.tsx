'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react'
import { api } from '@/lib/api'
import { mapApiBooking, mapApiClient, unwrapList } from '@/lib/djangoDataMappers'
import { cn, formatCurrency, formatDate, formatPhoneForWhatsApp } from '@/lib/utils'
import { WHATSAPP_TEMPLATES } from '@/lib/whatsappTemplates'
import { useData } from '@/context/DataContext'
import type { Booking, Client } from '@/types'

const TEMPLATE_LABELS: Record<keyof typeof WHATSAPP_TEMPLATES, string> = {
  Confirmation: 'Confirmation',
  'Rappel de paiement': 'Rappel de paiement',
  Retard: 'Retard',
}

function fillWhatsAppPlaceholders(
  template: string,
  ctx: { nom: string; montant: string; date: string }
): string {
  return template
    .split('[Nom]').join(ctx.nom)
    .split('[Montant]').join(ctx.montant)
    .split('[Date]').join(ctx.date)
}

function bookingStatusLabel(status: Booking['status']): string {
  const m: Record<Booking['status'], string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    checked_out: 'En cours',
    checked_in: 'Terminée',
    cancelled: 'Annulée',
  }
  return m[status] ?? status
}

export default function ClientDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const { getCarById } = useData()

  const [client, setClient] = useState<Client | null>(null)
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [waOpen, setWaOpen] = useState(false)
  const waRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [customerRes, bookingsRes] = await Promise.all([
        api.get(`admin/customers/${id}/`),
        api.get('admin/rentals/bookings/'),
      ])
      const mapped = mapApiClient(customerRes.data)
      setClient(mapped)
      const allBookings = unwrapList<unknown>(bookingsRes.data).map(mapApiBooking)
      setCustomerBookings(allBookings.filter((b) => b.customer === id))
    } catch {
      setClient(null)
      setCustomerBookings([])
      setError('Impossible de charger ce client ou ses réservations.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!waOpen) return
    const onDoc = (e: MouseEvent) => {
      if (waRef.current && !waRef.current.contains(e.target as Node)) setWaOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [waOpen])

  const sortedBookings = useMemo(
    () =>
      [...customerBookings].sort(
        (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
      ),
    [customerBookings]
  )

  const revenueTotal = useMemo(() => {
    if (client?.stats != null && typeof client.stats.total_revenue === 'number') {
      return client.stats.total_revenue
    }
    return customerBookings.reduce((s, b) => s + b.total_price, 0)
  }, [client?.stats, customerBookings])

  const locationsCount = useMemo(() => {
    if (client?.stats != null && typeof client.stats.booking_count === 'number') {
      return client.stats.booking_count
    }
    return customerBookings.length
  }, [client?.stats, customerBookings])

  const lastVisitLabel = useMemo(() => {
    if (client?.stats?.last_visit) return formatDate(client.stats.last_visit)
    if (customerBookings.length === 0) return '—'
    const latest = customerBookings.reduce((best, b) =>
      new Date(b.end_date) > new Date(best.end_date) ? b : best
    )
    return formatDate(latest.end_date)
  }, [client?.stats?.last_visit, customerBookings])

  const whatsappContext = useMemo(() => {
    const nom = client ? `${client.first_name} ${client.last_name}`.trim() : ''
    const totalRemaining = customerBookings.reduce((s, b) => s + b.remaining_balance, 0)
    const montant = formatCurrency(totalRemaining)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pastOrAll = customerBookings.filter((b) => new Date(b.end_date) <= today)
    const pool = pastOrAll.length > 0 ? pastOrAll : customerBookings
    const pick =
      pool.length > 0
        ? pool.reduce((best, b) => (new Date(b.end_date) > new Date(best.end_date) ? b : best))
        : null
    const date = pick ? formatDate(pick.end_date) : '—'
    return { nom, montant, date }
  }, [client, customerBookings])

  const openWhatsApp = (templateBody: string) => {
    if (!client?.phone) return
    const text = fillWhatsAppPlaceholders(templateBody, whatsappContext)
    const phone = formatPhoneForWhatsApp(client.phone)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setWaOpen(false)
  }

  if (!id) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">Identifiant client manquant.</div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground text-sm">Chargement…</div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-foreground">Client introuvable</h2>
        <p className="text-muted-foreground mt-1">{error ?? 'Ce client n&apos;existe pas.'}</p>
        <Link href="/clients" className="mt-4 text-primary hover:underline">
          Retour aux clients
        </Link>
      </div>
    )
  }

  const initials = `${client.first_name[0] ?? ''}${client.last_name[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/clients"
            className="mt-1 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-muted-foreground text-sm flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {client.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {client.phone}
              </span>
            </p>
          </div>
        </div>

        <div className="relative shrink-0" ref={waRef}>
          <button
            type="button"
            disabled={!client.phone?.trim()}
            onClick={() => setWaOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              client.phone?.trim()
                ? 'bg-emerald-600 text-white hover:bg-emerald-600/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
            <ChevronDown className={cn('h-4 w-4 transition-transform', waOpen && 'rotate-180')} />
          </button>
          {waOpen && client.phone?.trim() && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-border bg-popover py-1 shadow-lg">
              {(Object.keys(WHATSAPP_TEMPLATES) as (keyof typeof WHATSAPP_TEMPLATES)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => openWhatsApp(WHATSAPP_TEMPLATES[key])}
                  className="flex w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
                >
                  {TEMPLATE_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Chiffre d&apos;affaires total
          </p>
          <p className="mt-2 text-2xl font-semibold text-primary">{formatCurrency(revenueTotal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nombre de locations
          </p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">{locationsCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dernière visite
          </p>
          <p className="mt-2 text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            {lastVisitLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-primary" />
              Informations personnelles
            </h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">CIN</dt>
                <dd className="font-medium text-card-foreground mt-0.5">{client.cin ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Permis</dt>
                <dd className="font-medium text-card-foreground mt-0.5">{client.license_number ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Adresse
                </dt>
                <dd className="font-medium text-card-foreground mt-0.5 whitespace-pre-wrap">
                  {client.address ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nationalité</dt>
                <dd className="font-medium text-card-foreground mt-0.5">{client.nationality ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date de naissance</dt>
                <dd className="font-medium text-card-foreground mt-0.5">
                  {client.date_of_birth ? formatDate(client.date_of_birth) : '—'}
                </dd>
              </div>
              {client.notes ? (
                <div>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium text-card-foreground mt-0.5 whitespace-pre-wrap">{client.notes}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-card-foreground">Historique des réservations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sortedBookings.length} location{sortedBookings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Véhicule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Début
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Fin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Solde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedBookings.map((b) => {
                    const car = getCarById(b.car)
                    const carLabel = car ? `${car.marque_nom} ${car.modele_nom}` : `ID ${b.car}`
                    return (
                      <tr key={b.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-card-foreground whitespace-nowrap">
                          {carLabel}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(b.start_date)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(b.end_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                            {bookingStatusLabel(b.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(b.total_price)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCurrency(b.remaining_balance)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {sortedBookings.length === 0 && (
              <div className="px-5 py-12 text-center text-muted-foreground text-sm">
                Aucune réservation pour ce client.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
