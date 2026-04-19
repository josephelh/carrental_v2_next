import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  trend: string
  trendUp: boolean
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trendUp ? 'text-success' : 'text-destructive'
          )}
        >
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-card-foreground">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
