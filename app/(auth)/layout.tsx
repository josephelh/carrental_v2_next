export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background p-6">
      {children}
    </div>
  )
}
