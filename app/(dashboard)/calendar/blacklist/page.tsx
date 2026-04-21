'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { extractBackendMessage } from '@/lib/djangoDataMappers'
import type { BlacklistLocalHit } from '@/types'

function formatHitDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function BlacklistVerificationPage() {
  const [identityType, setIdentityType] = useState<'cin' | 'license'>('cin')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hits, setHits] = useState<BlacklistLocalHit[] | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = input.trim().toUpperCase()
    setErrorMsg(null)
    setHits(null)
    
    if (!raw) {
      setErrorMsg('Saisissez un CIN ou un numéro de permis.')
      return
    }
  
    setLoading(true)
  
    try {
      const param = identityType === 'cin' ? 'cin' : 'license_number'
      
      // 1. Run Local Check and Global Check in parallel for speed
      const [localRes, globalRes] = await Promise.allSettled([
        api.get<BlacklistLocalHit[]>(`blacklist/check_identity/?${param}=${encodeURIComponent(raw)}`),
        api.get(`blacklist/check_global/?identity=${encodeURIComponent(raw)}`) // We will add this bridge to backend
      ]);
  
      let combinedHits: any[] = [];
  
      // Process Local Results
      if (localRes.status === 'fulfilled') {
        combinedHits = [...localRes.value.data.map(h => ({ ...h, type: 'LOCAL' }))];
      }
  
      // Process Global Results (Normalized to match local UI structure)
      if (globalRes.status === 'fulfilled' && globalRes.value.data.total_reports > 0) {
        const gData = globalRes.value.data;
        combinedHits.push({
          id: 'global-rep',
          type: 'GLOBAL',
          reason: `Signalement Global: ${gData.total_reports} rapports. Note: ${gData.average_rating}/5`,
          created_at: new Date().toISOString(),
          details: gData.recent_reasons
        });
      }
  
      setHits(combinedHits);
  
    } catch (err) {
      setErrorMsg('La vérification a échoué. Vérifiez votre connexion au serveur Central.');
    } finally {
      setLoading(false)
    }
  }





  const clean = hits !== null && hits.length === 0
  const flagged = hits !== null && hits.length > 0

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vérification identité</h1>
        <p className="mt-1 text-muted-foreground">
          Contrôlez un CIN ou un permis avant de créer une fiche client — première étape à l&apos;accueil.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-1 w-fit">
          <button
            type="button"
            onClick={() => setIdentityType('cin')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              identityType === 'cin'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            CIN
          </button>
          <button
            type="button"
            onClick={() => setIdentityType('license')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              identityType === 'license'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Permis
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder={identityType === 'cin' ? 'Ex. AB12345' : 'Numéro de permis'}
            className="w-full rounded-xl border-2 border-input bg-background py-4 pl-12 pr-4 text-lg font-medium tracking-wide text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Vérification…' : 'Vérifier'}
        </button>
      </form>

      {errorMsg && (
        <div
          className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      {clean && (
        <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Aucun signalement local</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette identité ne correspond à aucune entrée sur la liste noire de votre instance.
          </p>
        </div>
      )}

      {flagged && (
        <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 px-6 py-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/15">
              <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-destructive">Signal détecté</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {hits.length} entrée{hits.length > 1 ? 's' : ''} correspondante{hits.length > 1 ? 's' : ''} sur la liste
                locale.
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {hits.map((hit) => (
              <li
                key={hit.id}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-card-foreground"
              >
                <p className="font-medium text-foreground">{hit.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">Enregistré le {formatHitDate(hit.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
