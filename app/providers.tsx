'use client'

import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster position="top-right" theme={theme} />
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          {children}
          <ThemedToaster />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
