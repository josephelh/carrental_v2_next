import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/layout/Layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}
