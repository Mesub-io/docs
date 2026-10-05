import type { CSSProperties, ReactNode } from 'react'

// Three tones, each tinted from one color so they hold in light and dark.
const TONES = {
  orange: '#f46036',
  teal: '#0d9488',
  violet: '#7c5cff',
} as const

type Tone = keyof typeof TONES

const tint = (tone: Tone, share: number) =>
  `color-mix(in srgb, ${TONES[tone]} ${share}%, transparent)`

const row: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 12,
}

/** A row of numbered moments, read left to right: the whole of Mesub in three boxes. */
export function Flow({ children }: { children: ReactNode }) {
  return (
    <div className='no-bleed' style={row}>
      {children}
    </div>
  )
}

export function Moment({
  step,
  tone,
  who,
  title,
  children,
}: {
  step: number
  tone: Tone
  who: string
  title: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        background: tint(tone, 8),
        border: `1px solid ${tint(tone, 28)}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 24,
            height: 24,
            borderRadius: 999,
            background: TONES[tone],
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {step}
        </span>
        <span
          style={{
            color: TONES[tone],
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {who}
        </span>
      </div>
      <strong style={{ fontSize: 15, lineHeight: 1.3 }}>{title}</strong>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted-foreground)' }}>
        {children}
      </span>
    </div>
  )
}
