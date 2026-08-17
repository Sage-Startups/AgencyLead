/**
 * Transactional email via Resend.
 *
 * Deliberately uses fetch against Resend's REST API rather than their SDK:
 * it is a single POST, and avoiding the dependency keeps the install smaller
 * and the lockfile stable.
 *
 * Email is OPTIONAL, exactly like OpenAI and Stripe. With no RESEND_API_KEY
 * set the app runs normally and simply does not send anything. Sending is
 * always fire-and-forget: a failure here must never break a signup or a
 * waitlist submission, because the user's actual request already succeeded.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

interface SendArgs {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send an email. Never throws — returns false if sending was skipped or
 * failed, so callers can ignore the result safely.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    // Not configured. This is a supported state, so log quietly and move on.
    console.info(`[email] skipped "${subject}" to ${to} — RESEND_API_KEY/EMAIL_FROM not set`)
    return false
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email] Resend rejected "${subject}" (${res.status}): ${detail}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`[email] failed to send "${subject}":`, err)
    return false
  }
}

/** Shared shell so every email looks like the product. */
function layout(heading: string, body: string, footerNote?: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <div style="display:inline-block;width:36px;height:36px;background:#2563eb;border-radius:9px;text-align:center;line-height:36px;color:#ffffff;font-weight:bold;font-size:15px;">AL</div>
                <span style="color:#ffffff;font-weight:600;font-size:17px;margin-left:10px;vertical-align:middle;">AgencyLead Radar</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:700;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;color:#cbd5e1;font-size:14px;line-height:1.65;">
                ${body}
              </td>
            </tr>
          </table>
          ${
            footerNote
              ? `<p style="max-width:560px;color:#64748b;font-size:11px;line-height:1.6;margin:16px auto 0 auto;text-align:center;">${footerNote}</p>`
              : ''
          }
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return /^https?:\/\//.test(raw) ? raw.replace(/\/$/, '') : `https://${raw.replace(/\/$/, '')}`
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:9px;font-weight:600;font-size:14px;">${label}</a>`
}

/** Sent when someone creates an account. */
export async function sendWelcomeEmail(to: string, name?: string | null): Promise<boolean> {
  const greeting = name ? `Hi ${name},` : 'Hi,'
  return sendEmail({
    to,
    subject: 'Welcome to AgencyLead Radar',
    html: layout(
      'Your account is ready',
      `<p style="margin:0 0 14px 0;">${greeting}</p>
       <p style="margin:0 0 14px 0;">Thanks for signing up. You're on the <strong>Free plan</strong>, which includes 10 leads and 3 AI audits per month — no card required.</p>
       <p style="margin:0 0 20px 0;">A good first step is the Lead Scanner: add a local business you're interested in, or use <strong>Find Prospects</strong> to build a shortlist to research.</p>
       <p style="margin:0 0 22px 0;">${button(`${appUrl()}/dashboard`, 'Open your dashboard')}</p>
       <p style="margin:0;color:#94a3b8;font-size:13px;">If you have questions, just reply to this email.</p>`,
      `You received this because an account was created with this address at AgencyLead Radar.`
    ),
  })
}

/** Sent when someone joins the public waitlist. */
export async function sendWaitlistConfirmation(to: string, name?: string | null): Promise<boolean> {
  const greeting = name ? `Hi ${name},` : 'Hi,'
  return sendEmail({
    to,
    subject: "You're on the AgencyLead Radar waitlist",
    html: layout(
      "You're on the list",
      `<p style="margin:0 0 14px 0;">${greeting}</p>
       <p style="margin:0 0 14px 0;">Thanks for your interest in AgencyLead Radar. We've added you to the early-access waitlist and will be in touch as soon as places open up.</p>
       <p style="margin:0 0 20px 0;">In the meantime you can explore the product with the live demo — it's preloaded with sample leads so you can see exactly how the scoring and AI outreach work.</p>
       <p style="margin:0 0 22px 0;">${button(`${appUrl()}/demo`, 'Try the demo')}</p>`,
      `You received this because this address was submitted to the AgencyLead Radar waitlist. If that wasn't you, you can ignore this email.`
    ),
  })
}

/** Optional internal ping so the owner knows a signup landed. */
export async function sendWaitlistNotification(signup: {
  name: string
  email: string
  companyName?: string | null
  buyerType?: string | null
  mainService?: string | null
  message?: string | null
}): Promise<boolean> {
  const to = process.env.ADMIN_NOTIFY_EMAIL
  if (!to) return false

  const row = (label: string, value?: string | null) =>
    value ? `<tr><td style="padding:3px 12px 3px 0;color:#94a3b8;">${label}</td><td style="padding:3px 0;color:#e2e8f0;">${value}</td></tr>` : ''

  return sendEmail({
    to,
    replyTo: signup.email,
    subject: `New waitlist signup: ${signup.name}`,
    html: layout(
      'New waitlist signup',
      `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">
         ${row('Name', signup.name)}
         ${row('Email', signup.email)}
         ${row('Company', signup.companyName)}
         ${row('Type', signup.buyerType)}
         ${row('Service', signup.mainService)}
         ${row('Message', signup.message)}
       </table>
       <p style="margin:20px 0 0 0;">${button(`${appUrl()}/admin`, 'Open admin')}</p>`
    ),
  })
}
