'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileCheck,
  Wrench,
  Plus,
  Calendar,
  Fuel,
  Settings,
  Gauge,
} from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { api, mediaUrl } from '@/lib/api'
import { mapApiMaintenance, unwrapList } from '@/lib/djangoDataMappers'
import EditCarModal from '@/components/fleet/EditCarModal'
import AddMaintenanceModal from '@/components/fleet/AddMaintenanceModal'
import { toast } from 'sonner'
import type { CarStatut, MaintenanceRecord } from '@/types'

const statusStyles: Record<CarStatut, string> = {
  disponible: 'bg-success/10 text-success',
  louée: 'bg-primary/10 text-primary',
  réservée: 'bg-warning/10 text-warning',
  maintenance: 'bg-destructive/10 text-destructive',
}

export default function CarDetailsPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const { getCarById, deleteCar, updateCar, loading } = useData()

  const car = getCarById(id)
  const [maintenanceRows, setMaintenanceRows] = useState<MaintenanceRecord[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'compliance' | 'maintenance'>('details')

  const loadMaintenance = useCallback(async () => {
    if (!id) return
    try {
      const { data } = await api.get('admin/fleet/maintenance/')
      const list = unwrapList<unknown>(data).map(mapApiMaintenance)
      setMaintenanceRows(list.filter((m) => m.car === id))
    } catch {
      setMaintenanceRows([])
    }
  }, [id])

  useEffect(() => {
    void loadMaintenance()
  }, [loadMaintenance, loading])

  if (!car && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold text-foreground">Véhicule introuvable</h2>
        <p className="text-muted-foreground mt-1">Le véhicule recherché n&apos;existe pas.</p>
        <Link href="/fleet" className="mt-4 text-primary hover:underline">
          Retour à la flotte
        </Link>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground text-sm">Chargement…</div>
    )
  }

  const thumb = car.images[0] ? mediaUrl(car.images[0].image) : ''

  const handleDelete = async () => {
    try {
      await deleteCar(car.id)
      toast.success(`${car.marque_nom} ${car.modele_nom} a été supprimé`)
      router.push('/fleet')
    } catch {
      /* toast DataContext */
    }
  }

  const handleStatusChange = async (newStatus: CarStatut) => {
    try {
      await updateCar(car.id, { statut: newStatus })
      toast.success(`Statut mis à jour : ${newStatus}`)
    } catch {
      /* toast */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/fleet"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {car.marque_nom} {car.modele_nom}
          </h1>
          <p className="text-muted-foreground">
            {car.immatriculation} · {car.annee}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border overflow-hidden bg-muted">
            {thumb ? (
              <img
                src={thumb}
                alt={`${car.marque_nom} ${car.modele_nom}`}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Pas d&apos;image
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Statut</span>
            </div>
            <select
              value={car.statut}
              onChange={(e) => void handleStatusChange(e.target.value as CarStatut)}
              className={cn(
                'w-full rounded-lg px-3 py-1.5 text-sm font-medium border-0 cursor-pointer',
                statusStyles[car.statut]
              )}
            >
              <option value="disponible">Disponible</option>
              <option value="louée">Louée</option>
              <option value="réservée">Réservée</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Kilométrage</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{car.kilometrage.toLocaleString()} km</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Fuel className="h-4 w-4" />
              <span className="text-xs">Carburant</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{car.carburant}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Tarif journalier</span>
            </div>
            <p className="text-lg font-semibold text-primary">{formatCurrency(car.prix_journalier)}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Transmission</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{car.transmission}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-xs">Places</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{car.nb_places}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-xs">Caution</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{formatCurrency(car.caution)}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-xs">Catégorie</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{car.categorie}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6">
          {[
            { id: 'details' as const, label: 'Détails', icon: Settings },
            { id: 'compliance' as const, label: 'Échéances', icon: FileCheck },
            { id: 'maintenance' as const, label: 'Maintenance', icon: Wrench },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'details' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-card-foreground mb-4">Détails du véhicule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Marque</p>
                <p className="font-medium text-card-foreground">{car.marque_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modèle</p>
                <p className="font-medium text-card-foreground">{car.modele_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Année</p>
                <p className="font-medium text-card-foreground">{car.annee}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Immatriculation</p>
                <p className="font-medium text-card-foreground">{car.immatriculation}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Niveau carburant</p>
                <p className="font-medium text-card-foreground">{car.current_fuel_level} %</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créé le</p>
                <p className="font-medium text-card-foreground">{formatDate(car.created_at)}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-card-foreground mb-4">Échéances administratives</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Vignette</p>
                <p className="font-medium text-card-foreground">
                  {car.vignette_expiration ? formatDate(car.vignette_expiration) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assurance</p>
                <p className="font-medium text-card-foreground">
                  {car.assurance_expiration ? formatDate(car.assurance_expiration) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visite technique</p>
                <p className="font-medium text-card-foreground">
                  {car.visite_technique_expiration
                    ? formatDate(car.visite_technique_expiration)
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-card-foreground">Historique de maintenance</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            {maintenanceRows.length > 0 ? (
              <div className="divide-y divide-border">
                {maintenanceRows.map((record) => (
                  <div key={record.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.date)}
                          </span>
                        </div>
                      </div>
                      <p className="font-medium text-card-foreground">{formatCurrency(record.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune entrée de maintenance</p>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="mt-4 text-primary hover:underline text-sm"
                >
                  Ajouter la première entrée
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditCarModal
          key={car.id}
          car={car}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      <AddMaintenanceModal
        carId={car.id}
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false)
          void loadMaintenance()
        }}
      />
    </div>
  )
}
