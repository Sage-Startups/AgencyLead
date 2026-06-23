export function calculateOpportunityScore(lead: {
  websiteUrl?: string | null
  websiteQuality: string
  googleRating?: number | null
  reviewCount?: number | null
  hasClearCta: boolean
  hasQuoteForm: boolean
  seoNotes?: string | null
}): number {
  let score = 0
  if (!lead.websiteUrl) {
    score += 30
  } else if (lead.websiteQuality === 'poor') {
    score += 20
  } else if (lead.websiteQuality === 'average') {
    score += 10
  }
  if (lead.googleRating && lead.googleRating < 4.0) score += 10
  if (lead.reviewCount && lead.reviewCount < 20) score += 10
  if (!lead.hasClearCta) score += 15
  if (!lead.hasQuoteForm) score += 15
  if (lead.seoNotes && lead.seoNotes.length > 10) score += 10
  return Math.min(score, 100)
}

export function getScoreLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 80) return 'High'
  if (score >= 60) return 'Medium'
  return 'Low'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-slate-400'
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (score >= 60) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
}
