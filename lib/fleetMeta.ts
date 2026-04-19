import { api } from '@/lib/api'
import { unwrapList } from '@/lib/djangoDataMappers'
import type { Marque, Modele } from '@/types'

export const FLEET_MARQUES = 'admin/fleet/marques/'
export const FLEET_MODELES = 'admin/fleet/modeles/'

export async function fetchMarques(): Promise<Marque[]> {
  const { data } = await api.get(FLEET_MARQUES)
  return unwrapList<Marque>(data)
}

export async function fetchModeles(marqueId?: number): Promise<Modele[]> {
  const url =
    marqueId != null && marqueId > 0
      ? `${FLEET_MODELES}?marque=${marqueId}`
      : FLEET_MODELES
  const { data } = await api.get(url)
  return unwrapList<Modele>(data)
}
