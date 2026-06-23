export function leadsToCSV(leads: Record<string, unknown>[]): string {
  if (leads.length === 0) return ''
  const headers = [
    'Business Name','Niche','City','State','ZIP Code','Website URL',
    'Email','Phone','Google Rating','Review Count','Website Quality',
    'Opportunity Score','Recommended Service','Status',
    'Cold Email','DM Message','Call Opener','Follow-Up','Notes'
  ]
  const rows = leads.map((l) => [
    l.businessName, l.niche, l.city, l.state, l.zipCode || '',
    l.websiteUrl || '', l.email || '', l.phone || '',
    l.googleRating ?? '', l.reviewCount ?? '', l.websiteQuality,
    l.opportunityScore, l.recommendedService || '', l.status,
    (l.aiAudits as Record<string,unknown>[])?.[0]?.coldEmail || '',
    (l.aiAudits as Record<string,unknown>[])?.[0]?.dmMessage || '',
    (l.aiAudits as Record<string,unknown>[])?.[0]?.callOpener || '',
    (l.aiAudits as Record<string,unknown>[])?.[0]?.followUpMessage || '',
    l.generalNotes || ''
  ])
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
}
