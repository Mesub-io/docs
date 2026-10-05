// The statuses of a subscription and what moves it from one to the next,
// drawn here so it takes the site's colors in both themes.

type Box = { id: string; x: number; y: number; final?: boolean }

const W = 100
const H = 34

const BOXES: Box[] = [
  { id: 'pending', x: 0, y: 78 },
  { id: 'active', x: 180, y: 78 },
  { id: 'unpaid', x: 370, y: 20 },
  { id: 'stopped', x: 560, y: 20, final: true },
  { id: 'cancelled', x: 370, y: 136 },
  { id: 'ended', x: 560, y: 136, final: true },
]

const at = (id: string) => BOXES.find((box) => box.id === id)!
const ink = 'var(--foreground)'
const accent = 'var(--primary)'

function Arrow({
  d,
  label,
  lx,
  ly,
  dashed,
  anchor = 'middle',
}: {
  d: string
  label: string
  lx: number
  ly: number
  dashed?: boolean
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <g>
      <path
        d={d}
        fill='none'
        stroke={ink}
        strokeWidth='1.25'
        strokeDasharray={dashed ? '4 4' : undefined}
        markerEnd='url(#life-arrow)'
      />
      <text x={lx} y={ly} textAnchor={anchor} fontSize='11.5' fill='var(--muted-foreground)'>
        {label}
      </text>
    </g>
  )
}

export function Lifecycle() {
  const pending = at('pending')
  const active = at('active')
  const unpaid = at('unpaid')
  const stopped = at('stopped')
  const cancelled = at('cancelled')
  const ended = at('ended')
  const mid = (box: Box) => box.y + H / 2

  return (
    <svg
      className='no-bleed'
      viewBox='0 0 660 196'
      role='img'
      aria-label='A subscription starts pending and turns active when the first payment lands. A missed charge makes it unpaid; a retry that pays makes it active again, and when the retries run out it is stopped. Cancelling makes it cancelled; resuming makes it active again, and at the end of the paid period it is ended.'
      style={{ width: '100%', height: 'auto', fontFamily: 'inherit' }}
    >
      <defs>
        <marker
          id='life-arrow'
          viewBox='0 0 8 8'
          refX='7'
          refY='4'
          markerWidth='7'
          markerHeight='7'
          orient='auto-start-reverse'
        >
          <path d='M0 0.5 L7 4 L0 7.5 z' fill={ink} />
        </marker>
      </defs>

      <Arrow
        d={`M${pending.x + W + 3} ${mid(pending)} H${active.x - 4}`}
        label='first payment'
        lx={(pending.x + W + active.x) / 2}
        ly={pending.y - 8}
      />
      <Arrow
        d={`M${active.x + W + 3} ${mid(active) - 8} L${unpaid.x - 4} ${mid(unpaid) - 4}`}
        label='charge missed'
        lx={318}
        ly={50}
        anchor='end'
      />
      <Arrow
        d={`M${unpaid.x - 4} ${mid(unpaid) + 10} L${active.x + W + 3} ${mid(active) + 2}`}
        label='retry paid'
        lx={340}
        ly={88}
        anchor='start'
        dashed
      />
      <Arrow
        d={`M${unpaid.x + W + 3} ${mid(unpaid)} H${stopped.x - 4}`}
        label='retries spent'
        lx={(unpaid.x + W + stopped.x) / 2}
        ly={mid(unpaid) - 8}
      />
      <Arrow
        d={`M${active.x + W + 3} ${mid(active) + 10} L${cancelled.x - 4} ${mid(cancelled) + 4}`}
        label='cancel'
        lx={318}
        ly={148}
        anchor='end'
      />
      <Arrow
        d={`M${cancelled.x - 4} ${mid(cancelled) - 10} L${active.x + W + 3} ${mid(active) + 2}`}
        label='resume'
        lx={340}
        ly={112}
        anchor='start'
        dashed
      />
      <Arrow
        d={`M${cancelled.x + W + 3} ${mid(cancelled)} H${ended.x - 4}`}
        label='period ends'
        lx={(cancelled.x + W + ended.x) / 2}
        ly={mid(cancelled) - 8}
      />

      {BOXES.map((box) => {
        const on = box.id === 'active'
        return (
          <g key={box.id}>
            <rect
              x={box.x}
              y={box.y}
              width={W}
              height={H}
              rx={8}
              fill={on ? accent : box.final ? 'var(--muted)' : 'var(--background)'}
              stroke={on ? accent : 'var(--border)'}
            />
            <text
              x={box.x + W / 2}
              y={box.y + 22}
              textAnchor='middle'
              fontSize='13'
              fontWeight='600'
              fontFamily='var(--font-mono, ui-monospace, monospace)'
              fill={on ? 'var(--primary-foreground, #fff)' : ink}
            >
              {box.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
