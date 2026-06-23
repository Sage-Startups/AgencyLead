import { cn } from '@/lib/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      {
        'bg-slate-700 text-slate-300 border-slate-600': variant === 'default',
        'bg-green-500/20 text-green-400 border-green-500/30': variant === 'success',
        'bg-amber-500/20 text-amber-400 border-amber-500/30': variant === 'warning',
        'bg-red-500/20 text-red-400 border-red-500/30': variant === 'danger',
        'bg-blue-500/20 text-blue-400 border-blue-500/30': variant === 'info',
      },
      className
    )}>
      {children}
    </span>
  )
}
