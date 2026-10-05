// The Mesub flow as a sequence diagram, drawn here rather than by a library so
// it reads at body size and takes the site's colors in both themes.

const ACTORS = ["Customer's wallet", 'Your server', 'Mesub', 'Solana'] as const
const X = [84, 248, 412, 576]
const WIDTH = 660
const STEP = 38
const BAND = 30
const TOP = 56

type Message = { from: number; to: number; label: string; reply?: boolean }
type Phase = { title: string; messages: Message[] }

const PHASES: Phase[] = [
  {
    title: 'Subscribing, once',
    messages: [
      { from: 1, to: 2, label: 'create a subscription' },
      { from: 2, to: 1, label: 'terms + transaction', reply: true },
      { from: 1, to: 0, label: 'ask to sign', reply: true },
      { from: 0, to: 1, label: 'two signatures' },
      { from: 1, to: 2, label: 'submit' },
      { from: 2, to: 3, label: 'send, first period paid' },
    ],
  },
  {
    title: 'Every period after',
    messages: [
      { from: 2, to: 3, label: 'pull the price' },
      { from: 2, to: 1, label: 'webhook', reply: true },
    ],
  },
  {
    title: 'On each paid request',
    messages: [
      { from: 1, to: 2, label: 'has access?' },
      { from: 2, to: 1, label: 'yes or no', reply: true },
    ],
  },
]

const MESUB = 2
const ink = 'var(--foreground)'
const accent = 'var(--primary)'

export function Sequence() {
  let y = TOP
  const rows: { band?: { y: number; title: string }; message?: Message & { y: number } }[] = []
  for (const phase of PHASES) {
    rows.push({ band: { y, title: phase.title } })
    y += BAND + 14
    for (const message of phase.messages) {
      y += STEP
      rows.push({ message: { ...message, y: y - 12 } })
    }
    y += 18
  }
  const height = y + 4

  return (
    <svg
      className='no-bleed'
      viewBox={`0 0 ${WIDTH} ${height}`}
      role='img'
      aria-label='Subscribing: your server creates a subscription with Mesub, the wallet signs twice, your server submits and Mesub sends it to Solana. Every period Mesub pulls the price and sends your server a webhook. On each paid request your server asks Mesub whether the customer has access.'
      style={{ width: '100%', height: 'auto', fontFamily: 'inherit' }}
    >
      <defs>
        {[ink, accent].map((color, index) => (
          <marker
            key={color}
            id={`seq-arrow-${index}`}
            viewBox='0 0 8 8'
            refX='7'
            refY='4'
            markerWidth='7'
            markerHeight='7'
            orient='auto-start-reverse'
          >
            <path d='M0 0.5 L7 4 L0 7.5 z' fill={color} />
          </marker>
        ))}
      </defs>

      {/* lifelines */}
      {X.map((x, index) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={38}
          y2={height}
          stroke={index === MESUB ? accent : 'var(--border)'}
          strokeOpacity={index === MESUB ? 0.45 : 1}
          strokeWidth='1'
        />
      ))}

      {/* who */}
      {ACTORS.map((name, index) => (
        <g key={name}>
          <rect
            x={X[index] - 68}
            y={6}
            width={136}
            height={32}
            rx={8}
            fill={index === MESUB ? accent : 'var(--background)'}
            stroke={index === MESUB ? accent : 'var(--border)'}
          />
          <text
            x={X[index]}
            y={27}
            textAnchor='middle'
            fontSize='13'
            fontWeight='600'
            fill={index === MESUB ? 'var(--primary-foreground, #fff)' : ink}
          >
            {name}
          </text>
        </g>
      ))}

      {rows.map((row, index) => {
        if (row.band) {
          return (
            <g key={index}>
              <rect
                x={0}
                y={row.band.y}
                width={WIDTH}
                height={BAND}
                rx={6}
                fill='var(--muted)'
              />
              <text x={14} y={row.band.y + 20} fontSize='12.5' fontWeight='600' fill={ink}>
                {row.band.title}
              </text>
            </g>
          )
        }
        const message = row.message!
        const from = X[message.from]
        const to = X[message.to]
        const right = to > from
        const mesub = message.from === MESUB
        const color = mesub ? accent : ink
        return (
          <g key={index}>
            <text
              x={(from + to) / 2}
              y={message.y - 7}
              textAnchor='middle'
              fontSize='12.5'
              fill={ink}
            >
              {message.label}
            </text>
            <line
              x1={from + (right ? 3 : -3)}
              x2={to + (right ? -3 : 3)}
              y1={message.y}
              y2={message.y}
              stroke={color}
              strokeWidth='1.5'
              strokeDasharray={message.reply ? '4 4' : undefined}
              markerEnd={`url(#seq-arrow-${mesub ? 1 : 0})`}
            />
          </g>
        )
      })}
    </svg>
  )
}
