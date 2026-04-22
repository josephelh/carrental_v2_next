'use client'

import { Menu, Bell, Search, Sun, Moon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
  
interface HeaderProps {
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/fleet': 'Gestion de flotte',
  '/clients': 'Clients',
  '/bookings': 'Reservations',
  '/calendar': 'Calendrier',
}

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/fleet/') && pathname !== '/fleet') {
    return 'Détail véhicule'
  }
  if (pathname.startsWith('/clients/') && pathname !== '/clients') {
    return 'Fiche client'
  }
  return pageTitles[pathname] ?? 'Tableau de bord'
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const title = resolveTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-foreground hover:text-foreground/80"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-48 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-3">
        <Link href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
    <span className="text-sm font-medium text-primary-foreground uppercase">
      {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
    </span>
  </div>
  <div className="hidden sm:block text-left">
    <p className="text-sm font-medium leading-none">{user?.first_name} {user?.last_name}</p>
    <p className="text-xs text-muted-foreground mt-1">{user?.role}</p>
  </div>
</Link>
        </div>
      </div>
    </header>
  )
}
