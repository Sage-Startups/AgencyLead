import { ImageResponse } from 'next/og'

export const alt = 'AgencyLead Radar — AI lead scoring and outreach for US agencies'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #172554 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            AL
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: '#ffffff' }}>AgencyLead Radar</div>
        </div>

        <div
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: 940,
          }}
        >
          Find local businesses that need your web design or SEO services.
        </div>

        <div style={{ fontSize: 30, color: '#94a3b8', marginTop: 32, maxWidth: 880 }}>
          Score leads 0–100, spot online weaknesses, and generate personalized outreach in seconds.
        </div>
      </div>
    ),
    size
  )
}
