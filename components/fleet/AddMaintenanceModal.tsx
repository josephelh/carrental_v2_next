'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { toast } from 'sonner'

interface AddMaintenanceModalProps {
  carId: string
  isOpen: boolean
  onClose: () => void
}

const defaultFormData = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  cost: 0,
}

export default function AddMaintenanceModal({ carId, isOpen, onClose }: AddMaintenanceModalProps) {
  const { addMaintenanceRecord } = useData()
  const [formData, setFormData] = useState(defaultFormData)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addMaintenanceRecord(carId, {
        description: formData.description,
        cost: formData.cost,
        date: formData.date,
      })
      toast.success("L'entrée de maintenance a été enregistrée")
      setFormData(defaultFormData)
      onClose()
    } catch {
      /* toast DataContext */
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-card-foreground">Ajouter une maintenance</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Travaux effectués…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Coût (DH)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              required
              min={0}
              step="0.01"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
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
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
