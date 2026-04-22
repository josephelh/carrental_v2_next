'use client'

import { startTransition, useEffect, useState } from 'react'
import { X, AlertTriangle, Shield } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'
import type { Client, CustomerType } from '@/types'

interface EditClientModalProps {
  client: Client
  isOpen: boolean
  onClose: () => void
}

export default function EditClientModal({ client, isOpen, onClose }: EditClientModalProps) {
  const { updateClient } = useData()
  const [formData, setFormData] = useState(client)

  useEffect(() => {
    startTransition(() => {
      setFormData(client)
    })
  }, [client])

  if (!isOpen) return null

  const setCustomerType = (customer_type: CustomerType) => {
    setFormData((prev) => ({
      ...prev,
      customer_type,
      ...(customer_type === 'INDIVIDUAL'
        ? {
            business_name: null,
            ice: null,
            rc: null,
            if_number: null,
          }
        : {}),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateClient(client.id, formData)
    toast.success(`${formData.first_name} ${formData.last_name} a été mis à jour (affichage local)`)
    onClose()
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

  const rep = client.reputation
  const isRisky = rep?.status === 'DANGER' || rep?.status === 'CAUTION'
  const alertTitle = rep?.status === 'DANGER' ? 'Client à risque élevé' : 'Client à surveiller'
  const isBusiness = formData.customer_type === 'BUSINESS'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">Modifier le client</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {isRisky && (
            <div
              className="flex gap-3 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {alertTitle}
                </p>
                {rep && rep.recent_reasons.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive/95">
                    {rep.recent_reasons.map((reason, idx) => (
                      <li key={`${client.id}-reason-${idx}`}>{reason}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-destructive/80">
                  Données synchronisées depuis le système de réputation.
                </p>
              </div>
            </div>
          )}

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
                    value={formData.business_name ?? ''}
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
                    value={formData.ice ?? ''}
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
                    value={formData.rc ?? ''}
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
                    value={formData.if_number ?? ''}
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
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  CIN (Carte d&apos;identité nationale)
                </label>
                <input
                  type="text"
                  name="cin"
                  value={formData.cin ?? ''}
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
                  value={formData.license_number ?? ''}
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
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
