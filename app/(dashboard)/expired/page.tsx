'use client'

import { ShieldAlert, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SubscriptionExpired() {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.post('blacklist/sync-license/')
      toast.success('Licence synchronisée. Redémarrage...')
      window.location.href = '/'
    } catch (err) {
      toast.error('Échec de la synchronisation. Vérifiez votre connexion internet.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-6">
        <ShieldAlert className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Accès Restreint</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Votre abonnement AutoFleet est arrivé à expiration ou le système est resté hors-ligne 
        pendant plus de 48 heures.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisation...' : 'Tenter une synchronisation'}
        </button>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        Besoin d'aide ? Contactez le support Central AutoFleet.
      </p>
    </div>
  )
}