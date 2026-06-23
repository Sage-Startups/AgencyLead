import { cn } from '@/lib/cn'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm', className)}>
      {children}
    </div>
  )
}
