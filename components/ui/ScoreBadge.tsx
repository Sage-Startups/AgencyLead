import { getScoreLabel, getScoreBadgeClass } from '@/lib/scoring'
import { cn } from '@/lib/cn'

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const label = getScoreLabel(score)
  const badgeClass = getScoreBadgeClass(score)
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', badgeClass, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-green-400': score >= 80,
        'bg-amber-400': score >= 60 && score < 80,
        'bg-slate-400': score < 60,
      })} />
      {score} · {label}
    </span>
  )
}
