'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { User, Users, Shield, Save, UserPlus, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, login } = useAuth() // login helper can be used to re-set user info
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile')
  const isAdmin = user?.role === 'ADMIN'

  // Profile Form State
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    password: '',
  })

  // Team State
  const [team, setTeam] = useState<any[]>([])
  const [loadingTeam, setLoadingTeam] = useState(false)

  useEffect(() => {
    if (activeTab === 'team' && isAdmin) {
      fetchTeam()
    }
  }, [activeTab, isAdmin])

  const fetchTeam = async () => {
    setLoadingTeam(true)
    try {
      const { data } = await api.get('admin/users/')
      setTeam(data)
    } catch (err) {
      toast.error("Impossible de charger l'équipe")
    } finally {
      setLoadingTeam(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.patch('auth/me/', profileData)
      toast.success('Profil mis à jour avec succès')
      // Note: In a real app, you'd refresh the AuthContext user here
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`admin/users/${userId}/`, { is_active: !currentStatus })
      toast.success('Statut utilisateur mis à jour')
      fetchTeam()
    } catch (err) {
      toast.error('Erreur de modification')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et les accès de votre équipe.</p>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors",
              activeTab === 'profile' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" /> Mon Profil
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                "flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors",
                activeTab === 'team' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" /> Gestion d'équipe
            </button>
          )}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'profile' ? (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm max-w-2xl">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> 
              Informations Personnelles
            </h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom</label>
                  <input 
                    type="text" 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={profileData.first_name}
                    onChange={e => setProfileData({...profileData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <input 
                    type="text" 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={profileData.last_name}
                    onChange={e => setProfileData({...profileData, last_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input 
                  type="email" 
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={profileData.email}
                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau mot de passe (laisser vide pour inchangé)</label>
                <input 
                  type="password" 
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="••••••••"
                  value={profileData.password}
                  onChange={e => setProfileData({...profileData, password: e.target.value})}
                />
              </div>
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <Save className="h-4 w-4" /> Enregistrer les modifications
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Membres de l'agence</h2>
                <p className="text-sm text-muted-foreground">Seuls les administrateurs peuvent voir cette liste.</p>
              </div>
              <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <UserPlus className="h-4 w-4" /> Ajouter un agent
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Utilisateur</th>
                    <th className="px-6 py-4">Rôle</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{member.first_name} {member.last_name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          member.role === 'ADMIN' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.is_active ? (
                          <span className="flex items-center gap-1 text-success"><CheckCircle className="h-4 w-4" /> Actif</span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /> Bloqué</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleUserStatus(member.id, member.is_active)}
                          className="text-muted-foreground hover:text-primary p-2"
                          title={member.is_active ? "Désactiver" : "Activer"}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-destructive p-2">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {team.length === 0 && !loadingTeam && (
                <div className="p-12 text-center text-muted-foreground">Aucun autre membre trouvé.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}