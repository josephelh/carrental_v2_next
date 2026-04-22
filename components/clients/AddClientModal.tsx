'use client'

import { useState } from 'react'
import { X, Shield } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'
import type { ClientCreateInput, CustomerType } from '@/types'

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
}

const empty: ClientCreateInput = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  cin: '',
  license_number: '',
  customer_type: 'INDIVIDUAL',
  business_name: '',
  ice: '',
  rc: '',
  if_number: '',
}

export default function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const { addClient } = useData()
  const [formData, setFormData] = useState<ClientCreateInput>(empty)

  if (!isOpen) return null

  const setCustomerType = (customer_type: CustomerType) => {
    setFormData((prev) => ({
      ...prev,
      customer_type,
      ...(customer_type === 'INDIVIDUAL'
        ? { business_name: '', ice: '', rc: '', if_number: '' }
        : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addClient(formData)
      toast.success(`${formData.first_name} ${formData.last_name} a été ajouté`)
      setFormData(empty)
      onClose()
    } catch {
      /* DataContext */
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const upperFields = ['cin', 'license_number', 'ice', 'rc', 'if_number']
    const next = upperFields.includes(name) ? value.toUpperCase() : value
    setFormData((prev) => ({
      ...prev,
      [name]: next,
    }))
  }

  const isBusiness = formData.customer_type === 'BUSINESS'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">Ajouter un client</h2>
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
            <h3 className="text-sm font-medium text-foreground mb-3">Type de client</h3>
            <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-1 w-fit">
              <button
                type="button"
                onClick={() => setCustomerType('INDIVIDUAL')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  formData.customer_type === 'INDIVIDUAL'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Particulier
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('BUSINESS')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  formData.customer_type === 'BUSINESS'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Entreprise
              </button>
            </div>
          </div>

          {isBusiness && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-4">Entreprise</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-muted-foreground mb-1.5">Raison sociale</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    required={isBusiness}
                    autoComplete="organization"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">ICE</label>
                  <input
                    type="text"
                    name="ice"
                    value={formData.ice}
                    onChange={handleChange}
                    required={isBusiness}
                    autoComplete="off"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">RC</label>
                  <input
                    type="text"
                    name="rc"
                    value={formData.rc}
                    onChange={handleChange}
                    required={isBusiness}
                    autoComplete="off"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-muted-foreground mb-1.5">IF</label>
                  <input
                    type="text"
                    name="if_number"
                    value={formData.if_number}
                    onChange={handleChange}
                    required={isBusiness}
                    autoComplete="off"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Identité</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Prénom</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Nom</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Shield className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">CIN et permis de conduire (données sensibles)</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Obligatoires pour la création. Stockage chiffré côté serveur ; déchiffrement réservé au personnel
                  autorisé.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  CIN (Carte d&apos;identité nationale)
                </label>
                <input
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Permis de conduire</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
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
              Ajouter le client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
