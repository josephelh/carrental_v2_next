'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'
import { fetchMarques, fetchModeles } from '@/lib/fleetMeta'
import type {
  CarCarburant,
  CarCategorie,
  CarCreateInput,
  CarStatut,
  CarTransmission,
  Marque,
  Modele,
} from '@/types'

interface AddCarModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES: CarCategorie[] = ['Citadine', 'Berline', 'SUV', 'Luxe', 'Utilitaire']
const STATUTS: CarStatut[] = ['disponible', 'louée', 'maintenance', 'réservée']
const CARBURANTS: CarCarburant[] = ['Diesel', 'Essence', 'Electrique', 'Hybride']
const TRANSMISSIONS: CarTransmission[] = ['Manuelle', 'Automatique']

function emptyCreateDefaults(): CarCreateInput {
  return {
    marque: 0,
    modele: 0,
    annee: new Date().getFullYear(),
    immatriculation: '',
    categorie: 'Berline',
    transmission: 'Manuelle',
    carburant: 'Essence',
    nb_places: 5,
    prix_journalier: 0,
    caution: 5000,
    statut: 'disponible',
    kilometrage: 0,
    vignette_expiration: null,
    assurance_expiration: null,
    visite_technique_expiration: null,
    current_fuel_level: 0,
    last_oil_change_km: null,
    next_oil_change_km: null,
  }
}

export default function AddCarModal({ isOpen, onClose }: AddCarModalProps) {
  const { addCar } = useData()
  const [marques, setMarques] = useState<Marque[]>([])
  const [modeles, setModeles] = useState<Modele[]>([])
  const [formData, setFormData] = useState<CarCreateInput>(emptyCreateDefaults)

  useEffect(() => {
    if (!isOpen) return
    setFormData(emptyCreateDefaults())
    let cancelled = false
    void (async () => {
      try {
        const m = await fetchMarques()
        if (cancelled) return
        setMarques(m)
        if (m.length) {
          const firstMarque = m[0].id
          const md = await fetchModeles(firstMarque)
          if (cancelled) return
          setModeles(md)
          setFormData({
            ...emptyCreateDefaults(),
            marque: firstMarque,
            modele: md[0]?.id ?? 0,
          })
        }
      } catch {
        toast.error('Impossible de charger marques / modèles.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || formData.marque <= 0) return
    let cancelled = false
    void (async () => {
      try {
        const md = await fetchModeles(formData.marque)
        if (cancelled) return
        setModeles(md)
        setFormData((prev) => ({
          ...prev,
          modele: md.some((x) => x.id === prev.modele) ? prev.modele : md[0]?.id ?? 0,
        }))
      } catch {
        setModeles([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, formData.marque])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.marque || !formData.modele) {
      toast.error('Choisissez une marque et un modèle.')
      return
    }
    try {
      await addCar(formData)
      toast.success(`${formData.immatriculation} a été ajouté à la flotte`)
      setFormData(emptyCreateDefaults())
      onClose()
    } catch {
      /* toast DataContext */
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'number' ? Number(value) : value } as CarCreateInput
      if (name === 'marque') next.modele = 0
      return next
    })
  }

  const dateField = (key: keyof CarCreateInput, label: string) => (
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
          <h2 className="text-lg font-semibold text-card-foreground">Ajouter un véhicule</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Marque & modèle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Marque</label>
                <select
                  name="marque"
                  value={formData.marque || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">—</option>
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
                  value={formData.modele || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">—</option>
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
                  min={1990}
                  max={new Date().getFullYear() + 1}
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
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Caractéristiques</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Tarifs (DH)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Prix journalier</label>
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
                <label className="block text-sm text-muted-foreground mb-1.5">Caution</label>
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
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Échéances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dateField('vignette_expiration', 'Expiration vignette')}
              {dateField('assurance_expiration', 'Expiration assurance')}
              {dateField('visite_technique_expiration', 'Expiration visite technique')}
            </div>
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
              Ajouter le véhicule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
