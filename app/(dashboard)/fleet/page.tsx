'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { formatCurrency, cn } from '@/lib/utils'
import { mediaUrl } from '@/lib/api'
import AddCarModal from '@/components/fleet/AddCarModal'
import { toast } from 'sonner'
import type { CarCategorie, CarStatut } from '@/types'

const statusStyles: Record<CarStatut, string> = {
  disponible: 'bg-success/10 text-success',
  louée: 'bg-primary/10 text-primary',
  réservée: 'bg-warning/10 text-warning',
  maintenance: 'bg-destructive/10 text-destructive',
}

const CATEGORIES: CarCategorie[] = ['Citadine', 'Berline', 'SUV', 'Luxe', 'Utilitaire']

export default function FleetPage() {
  const { cars, deleteCar } = useData()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filteredCars = cars.filter((car) => {
    const label = `${car.marque_nom} ${car.modele_nom}`.toLowerCase()
    const matchesSearch =
      label.includes(searchQuery.toLowerCase()) ||
      car.immatriculation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || car.statut === statusFilter
    const matchesCategory = categoryFilter === 'all' || car.categorie === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteCar(id)
      toast.success(`${name} a été retiré de la flotte`)
      setOpenDropdown(null)
    } catch {
      /* toast DataContext */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion de flotte</h2>
          <p className="text-muted-foreground">Gérer votre parc de véhicules</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un véhicule
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par marque, modèle ou immatriculation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Tous les statuts</option>
            <option value="disponible">Disponible</option>
            <option value="louée">Louée</option>
            <option value="réservée">Réservée</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCars.map((car) => {
          const thumb = car.images[0] ? mediaUrl(car.images[0].image) : ''
          return (
            <div
              key={car.id}
              className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="relative h-40 overflow-hidden bg-muted">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={`${car.marque_nom} ${car.modele_nom}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Pas d&apos;image
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      statusStyles[car.statut]
                    )}
                  >
                    {car.statut}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === car.id ? null : car.id)}
                    className="rounded-lg bg-background/80 backdrop-blur-sm p-1.5 text-foreground hover:bg-background transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openDropdown === car.id && (
                    <div className="absolute right-0 top-10 z-10 w-36 rounded-lg border border-border bg-popover shadow-lg">
                      <Link
                        href={`/fleet/${car.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                      >
                        <Eye className="h-4 w-4" />
                        Voir détails
                      </Link>
                      <Link
                        href={`/fleet/${car.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
                      >
                        <Edit className="h-4 w-4" />
                        Modifier
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(car.id, `${car.marque_nom} ${car.modele_nom}`)
                        }
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-card-foreground">
                      {car.marque_nom} {car.modele_nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">{car.annee}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                    {car.categorie}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{car.immatriculation}</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(car.prix_journalier)}/jour
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{car.transmission}</span>
                  <span>{car.carburant}</span>
                  <span>{car.nb_places} places</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredCars.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Aucun véhicule trouvé</h3>
          <p className="text-muted-foreground mt-1">Essayez d&apos;ajuster votre recherche ou vos filtres</p>
        </div>
      )}

      <AddCarModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  )
}
