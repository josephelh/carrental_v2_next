'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'
import { fetchMarques, fetchModeles } from '@/lib/fleetMeta'
import type { Car, CarCarburant, CarCategorie, CarStatut, CarTransmission, Marque, Modele } from '@/types'

interface EditCarModalProps {
  car: Car
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES: CarCategorie[] = ['Citadine', 'Berline', 'SUV', 'Luxe', 'Utilitaire']
const STATUTS: CarStatut[] = ['disponible', 'louée', 'maintenance', 'réservée']
const CARBURANTS: CarCarburant[] = ['Diesel', 'Essence', 'Electrique', 'Hybride']
const TRANSMISSIONS: CarTransmission[] = ['Manuelle', 'Automatique']

export default function EditCarModal({ car, isOpen, onClose }: EditCarModalProps) {
  const { updateCar } = useData()
  const [marques, setMarques] = useState<Marque[]>([])
  const [modeles, setModeles] = useState<Modele[]>([])
  const [formData, setFormData] = useState<Car>(car)

  useEffect(() => {
    if (isOpen) setFormData(car)
  }, [car, isOpen])

  useEffect(() => {
    if (!isOpen) return
    void fetchMarques().then(setMarques).catch(() => toast.error('Impossible de charger les marques.'))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !formData.marque) return
    void fetchModeles(formData.marque)
      .then(setModeles)
      .catch(() => setModeles([]))
  }, [isOpen, formData.marque])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id: _i, marque_nom: _mn, modele_nom: _mon, images: _img, created_at: _ca, ...patch } = formData
    try {
      await updateCar(car.id, patch)
      toast.success(`${car.marque_nom} ${car.modele_nom} a été mis à jour`)
      onClose()
    } catch {
      /* toast DataContext */
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'number' ? Number(value) : value } as Car
      if (name === 'marque') next.modele = 0
      return next
    })
  }

  const dateField = (key: keyof Car, label: string) => (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      <input
        type="date"
        name={key}
        value={(formData[key] as string | null) ?? ''}
        onChange={(e) =>
          setFormData((p) => ({
            ...p,
            [key]: e.target.value === '' ? null : e.target.value,
          }))
        }
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">
            Modifier — {car.marque_nom} {car.modele_nom}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Marque</label>
              <select
                name="marque"
                value={formData.marque}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {marques.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Modèle</label>
              <select
                name="modele"
                value={formData.modele}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {modeles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Année</label>
              <input
                type="number"
                name="annee"
                value={formData.annee}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Immatriculation</label>
              <input
                type="text"
                name="immatriculation"
                value={formData.immatriculation}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Catégorie</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Carburant</label>
              <select
                name="carburant"
                value={formData.carburant}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CARBURANTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Transmission</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TRANSMISSIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Places</label>
              <input
                type="number"
                name="nb_places"
                value={formData.nb_places}
                onChange={handleChange}
                min={2}
                max={9}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Kilométrage</label>
              <input
                type="number"
                name="kilometrage"
                value={formData.kilometrage}
                onChange={handleChange}
                min={0}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {STATUTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Prix journalier (DH)</label>
              <input
                type="number"
                name="prix_journalier"
                value={formData.prix_journalier}
                onChange={handleChange}
                min={0}
                step="0.01"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Caution (DH)</label>
              <input
                type="number"
                name="caution"
                value={formData.caution}
                onChange={handleChange}
                min={0}
                step="0.01"
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Niveau carburant (%)</label>
              <input
                type="number"
                name="current_fuel_level"
                value={formData.current_fuel_level}
                onChange={handleChange}
                min={0}
                max={100}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dateField('vignette_expiration', 'Expiration vignette')}
            {dateField('assurance_expiration', 'Expiration assurance')}
            {dateField('visite_technique_expiration', 'Expiration visite technique')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Dernière vidange (km)</label>
              <input
                type="number"
                name="last_oil_change_km"
                value={formData.last_oil_change_km ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    last_oil_change_km: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                min={0}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Prochaine vidange (km)</label>
              <input
                type="number"
                name="next_oil_change_km"
                value={formData.next_oil_change_km ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    next_oil_change_km: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                min={0}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
