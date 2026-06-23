import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { calculateOpportunityScore } from '../lib/scoring'

const prisma = new PrismaClient()

async function main() {
  // Admin credentials are env-driven so a buyer can set their own before the
  // first deploy. The password syncs on every seed run, so updating
  // ADMIN_PASSWORD and redeploying rotates it.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@agencyleadradar.com').toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const adminHash = await bcrypt.hash(adminPassword, 10)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: 'admin' },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      fullName: 'Admin User',
      role: 'admin',
    },
  })

  // Create demo user (public read-only account)
  const demoEmail = (process.env.DEMO_EMAIL || 'demo@agencyleadradar.com').toLowerCase()
  const demoHash = await bcrypt.hash('demo123', 10)
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      passwordHash: demoHash,
      fullName: 'Demo User',
      companyName: 'AgencyLead Demo',
      role: 'user',
    },
  })

  // Idempotent: if the demo user already has leads, skip seeding so repeated
  // deploys don't duplicate the demo dataset.
  const existingLeadCount = await prisma.lead.count({ where: { userId: demo.id } })
  if (existingLeadCount > 0) {
    console.log(`Demo leads already present (${existingLeadCount}). Skipping lead seed.`)
    console.log(`Admin user: ${adminEmail}`)
    console.log(`Demo user:  ${demoEmail}`)
    return
  }

  const rawLeads = [
    { businessName: 'Lone Star Roofing Co.', niche: 'Roofing Contractor', city: 'Austin', state: 'TX', zipCode: '78701', websiteUrl: 'https://example.com', googleRating: 3.8, reviewCount: 14, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No roofing service pages, weak local targeting, no trust badges.', generalNotes: 'Good prospect for website redesign and local SEO.', recommendedService: 'Website Redesign + Local SEO', status: 'new' },
    { businessName: 'Sunshine Plumbing LLC', niche: 'Plumbing', city: 'Miami', state: 'FL', zipCode: '33101', websiteUrl: '', googleRating: 3.5, reviewCount: 8, websiteQuality: 'missing', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No website found. Listing only on Yelp.', generalNotes: 'No online presence — major opportunity.', recommendedService: 'New Website + Google Business Setup', status: 'new' },
    { businessName: 'Desert Electric Services', niche: 'Electrician', city: 'Phoenix', state: 'AZ', zipCode: '85001', websiteUrl: 'https://example.com', googleRating: 4.1, reviewCount: 22, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Site looks outdated, no service area pages.', generalNotes: 'Good reviews but weak website.', recommendedService: 'Website Redesign + Local SEO', status: 'new' },
    { businessName: 'Mile High HVAC', niche: 'HVAC Contractor', city: 'Denver', state: 'CO', zipCode: '80201', websiteUrl: 'https://example.com', googleRating: 3.9, reviewCount: 11, websiteQuality: 'average', hasClearCta: true, hasQuoteForm: false, seoNotes: 'No blog content, missing city landing pages.', generalNotes: 'Average site, needs SEO work.', recommendedService: 'Local SEO Package', status: 'new' },
    { businessName: 'Nashville Lawn & Landscape', niche: 'Landscaper', city: 'Nashville', state: 'TN', zipCode: '37201', websiteUrl: '', googleRating: 4.2, reviewCount: 6, websiteQuality: 'missing', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No website. Only a Facebook page with low activity.', generalNotes: 'Great opportunity for a starter website package.', recommendedService: 'Starter Website + Google Maps Setup', status: 'new' },
    { businessName: 'Bay Area Dental Group', niche: 'Dentist', city: 'Tampa', state: 'FL', zipCode: '33601', websiteUrl: 'https://example.com', googleRating: 3.6, reviewCount: 19, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No online booking, slow load time, no schema markup.', generalNotes: 'Dentist site needs full overhaul.', recommendedService: 'Website Redesign + Local SEO', status: 'saved' },
    { businessName: 'Queen City Med Spa', niche: 'Med Spa', city: 'Charlotte', state: 'NC', zipCode: '28201', websiteUrl: 'https://example.com', googleRating: 4.0, reviewCount: 31, websiteQuality: 'average', hasClearCta: true, hasQuoteForm: false, seoNotes: 'Missing treatment-specific pages. No FAQ section.', generalNotes: 'Mid-range opportunity, good reviews.', recommendedService: 'SEO Content + Landing Pages', status: 'new' },
    { businessName: 'Peach State Hair Studio', niche: 'Hair Salon', city: 'Atlanta', state: 'GA', zipCode: '30301', websiteUrl: 'https://example.com', googleRating: 4.4, reviewCount: 47, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Site is mobile-unfriendly. No booking widget.', generalNotes: 'Popular salon with poor web presence.', recommendedService: 'Mobile-Friendly Redesign + Booking Integration', status: 'new' },
    { businessName: 'Cowboy Auto Repair', niche: 'Auto Repair', city: 'Dallas', state: 'TX', zipCode: '75201', websiteUrl: 'https://example.com', googleRating: 3.7, reviewCount: 9, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No pricing page, no service pages, no CTAs.', generalNotes: 'Classic local shop needing digital upgrade.', recommendedService: 'Website Redesign + Review Generation', status: 'contacted' },
    { businessName: 'Pacific Paws Dog Grooming', niche: 'Dog Groomer', city: 'San Diego', state: 'CA', zipCode: '92101', websiteUrl: '', googleRating: 4.6, reviewCount: 12, websiteQuality: 'missing', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No website. Strong reviews on Google but no digital footprint.', generalNotes: 'Excellent local reputation, just needs a website.', recommendedService: 'Starter Website + Online Booking', status: 'new' },
    { businessName: 'Windy City Remodelers', niche: 'Home Remodeling', city: 'Chicago', state: 'IL', zipCode: '60601', websiteUrl: 'https://example.com', googleRating: 3.3, reviewCount: 5, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Very thin website. No project gallery. Low reviews.', generalNotes: 'High value niche with weak digital presence.', recommendedService: 'Full Website Build + Local SEO', status: 'new' },
    { businessName: 'Emerald City Tax & Accounting', niche: 'Accountant', city: 'Seattle', state: 'WA', zipCode: '98101', websiteUrl: 'https://example.com', googleRating: 4.0, reviewCount: 17, websiteQuality: 'average', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Site lacks service pages and local keywords.', generalNotes: 'Seasonal demand spike opportunity.', recommendedService: 'Local SEO + Content Strategy', status: 'new' },
    { businessName: 'Spine & Wellness Chiropractic', niche: 'Chiropractor', city: 'Austin', state: 'TX', zipCode: '78702', websiteUrl: 'https://example.com', googleRating: 4.5, reviewCount: 28, websiteQuality: 'average', hasClearCta: true, hasQuoteForm: false, seoNotes: 'Good reviews but no online booking or appointment form.', generalNotes: 'High potential with right CTA improvements.', recommendedService: 'Conversion Optimization + Booking Setup', status: 'new' },
    { businessName: 'Bayou Fresh Cleaning Co.', niche: 'Cleaning Company', city: 'Houston', state: 'TX', zipCode: '77001', websiteUrl: '', googleRating: 3.9, reviewCount: 7, websiteQuality: 'missing', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No website at all. Word of mouth only.', generalNotes: 'Cleaning companies are great website clients.', recommendedService: 'New Website + Local SEO', status: 'new' },
    { businessName: 'Desert Bloom Landscaping', niche: 'Landscaper', city: 'Phoenix', state: 'AZ', zipCode: '85002', websiteUrl: 'https://example.com', googleRating: 4.1, reviewCount: 13, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No project portfolio. No neighborhood targeting.', generalNotes: 'Good local brand, just needs digital help.', recommendedService: 'Website Redesign + Portfolio Section', status: 'new' },
    { businessName: 'Rocky Mountain Roofing', niche: 'Roofing Contractor', city: 'Denver', state: 'CO', zipCode: '80202', websiteUrl: 'https://example.com', googleRating: 3.6, reviewCount: 4, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No financing page, no emergency roofing content.', generalNotes: 'Low review count hurts them.', recommendedService: 'Website + Review Funnel Setup', status: 'new' },
    { businessName: 'Gulf Coast Electric', niche: 'Electrician', city: 'Tampa', state: 'FL', zipCode: '33602', websiteUrl: 'https://example.com', googleRating: 4.3, reviewCount: 16, websiteQuality: 'average', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Missing local landing pages for surrounding cities.', generalNotes: 'Decent site but needs local SEO expansion.', recommendedService: 'Local SEO + City Landing Pages', status: 'interested' },
    { businessName: 'Music City Plumbing', niche: 'Plumbing', city: 'Nashville', state: 'TN', zipCode: '37202', websiteUrl: 'https://example.com', googleRating: 3.8, reviewCount: 21, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Old website, not mobile-optimized. No live chat.', generalNotes: 'Busy shop, just needs a website upgrade.', recommendedService: 'Mobile Redesign + Chat Widget', status: 'new' },
    { businessName: 'Lone Star Med Spa', niche: 'Med Spa', city: 'Dallas', state: 'TX', zipCode: '75202', websiteUrl: 'https://example.com', googleRating: 4.2, reviewCount: 34, websiteQuality: 'average', hasClearCta: true, hasQuoteForm: true, seoNotes: 'Good site overall but no blog or educational content.', generalNotes: 'Lower opportunity but good for SEO upsell.', recommendedService: 'SEO Content Marketing', status: 'new' },
    { businessName: 'Breezy Clean Maids', niche: 'Cleaning Company', city: 'Charlotte', state: 'NC', zipCode: '28202', websiteUrl: '', googleRating: 4.0, reviewCount: 3, websiteQuality: 'missing', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No website. Runs purely on referrals.', generalNotes: 'Small but growing cleaning business.', recommendedService: 'Starter Website + Online Booking', status: 'new' },
    { businessName: 'SoCal Shine Auto Detail', niche: 'Auto Repair', city: 'San Diego', state: 'CA', zipCode: '92102', websiteUrl: 'https://example.com', googleRating: 4.5, reviewCount: 62, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Popular shop but website is outdated and not mobile-friendly.', generalNotes: 'Strong reviews — just needs better web presence.', recommendedService: 'Mobile-First Redesign', status: 'new' },
    { businessName: 'Magnolia Dental Care', niche: 'Dentist', city: 'Atlanta', state: 'GA', zipCode: '30302', websiteUrl: 'https://example.com', googleRating: 3.9, reviewCount: 15, websiteQuality: 'average', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No new patient offers visible. Slow page speed.', generalNotes: 'Mid-tier dental office needing SEO attention.', recommendedService: 'Local SEO + Speed Optimization', status: 'new' },
    { businessName: 'Northwest Roofing Pros', niche: 'Roofing Contractor', city: 'Seattle', state: 'WA', zipCode: '98102', websiteUrl: 'https://example.com', googleRating: 4.0, reviewCount: 18, websiteQuality: 'average', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No financing info, no storm damage page.', generalNotes: 'Solid reviews, decent site but room for growth.', recommendedService: 'Conversion Optimization + SEO', status: 'new' },
    { businessName: 'Chitown Hair & Beauty', niche: 'Hair Salon', city: 'Chicago', state: 'IL', zipCode: '60602', websiteUrl: '', googleRating: 4.7, reviewCount: 89, websiteQuality: 'missing', hasClearCta: false, hasQuoteForm: false, seoNotes: 'No website — only Instagram presence.', generalNotes: 'Very popular locally. Great candidate for a premium site.', recommendedService: 'Premium Website + Instagram Integration', status: 'new' },
    { businessName: 'Sunshine State HVAC', niche: 'HVAC Contractor', city: 'Miami', state: 'FL', zipCode: '33102', websiteUrl: 'https://example.com', googleRating: 3.7, reviewCount: 10, websiteQuality: 'poor', hasClearCta: false, hasQuoteForm: false, seoNotes: 'Missing AC tune-up and repair landing pages.', generalNotes: 'High-demand niche in Florida heat.', recommendedService: 'Website Redesign + Seasonal SEO', status: 'new' },
  ]

  for (const lead of rawLeads) {
    const score = calculateOpportunityScore({
      websiteUrl: lead.websiteUrl || null,
      websiteQuality: lead.websiteQuality,
      googleRating: lead.googleRating,
      reviewCount: lead.reviewCount,
      hasClearCta: lead.hasClearCta,
      hasQuoteForm: lead.hasQuoteForm,
      seoNotes: lead.seoNotes,
    })

    await prisma.lead.create({
      data: {
        userId: demo.id,
        businessName: lead.businessName,
        niche: lead.niche,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zipCode,
        websiteUrl: lead.websiteUrl || null,
        googleRating: lead.googleRating,
        reviewCount: lead.reviewCount,
        websiteQuality: lead.websiteQuality,
        hasClearCta: lead.hasClearCta,
        hasQuoteForm: lead.hasQuoteForm,
        seoNotes: lead.seoNotes,
        generalNotes: lead.generalNotes,
        opportunityScore: score,
        recommendedService: lead.recommendedService,
        status: lead.status,
      },
    })
  }

  console.log(`Seeded ${rawLeads.length} demo leads for demo user`)
  console.log(`Admin user: ${adminEmail}`)
  console.log(`Demo user:  ${demoEmail}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
