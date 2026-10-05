// A subscription's statuses as two small trees, after the one in the Mesub
// deck: every step is a question with two answers. Drawn here so it takes the
// site's colors in both themes.

type Tone = 'neutral' | 'good' | 'bad'
type Node = { id: string; col: number; row: number; status: string; note: string; tone?: Tone }
type Edge = { from: string; to: string; label?: string; tone: Tone }
type Tree = { title: string; rows: number; nodes: Node[]; edges: Edge[] }

const W = 150
const H = 46
const COL = 255
const ROW = 60
const TITLE = 26

const COLOR: Record<Tone, string> = {
  neutral: 'var(--foreground)',
  good: '#12a594',
  bad: '#e5484d',
}

const TREES: Tree[] = [
  {
    title: 'Each period',
    rows: 3,
    nodes: [
      { id: 'due', col: 0, row: 0.75, status: 'active', note: 'a charge is due' },
      { id: 'paid', col: 1, row: 0, status: 'active', note: 'next period', tone: 'good' },
      { id: 'unpaid', col: 1, row: 1.5, status: 'unpaid', note: 'Mesub retries' },
      { id: 'back', col: 2, row: 1, status: 'active', note: 'back on schedule', tone: 'good' },
      { id: 'stopped', col: 2, row: 2, status: 'stopped', note: 'access off', tone: 'bad' },
    ],
    edges: [
      { from: 'due', to: 'paid', label: 'paid', tone: 'good' },
      { from: 'due', to: 'unpaid', label: 'not paid', tone: 'bad' },
      { from: 'unpaid', to: 'back', label: 'paid', tone: 'good' },
      { from: 'unpaid', to: 'stopped', label: 'not paid', tone: 'bad' },
    ],
  },
  {
    title: 'After a cancellation',
    rows: 2,
    nodes: [
      { id: 'cancelled', col: 0, row: 0.5, status: 'cancelled', note: 'access to period end' },
      { id: 'resumed', col: 1, row: 0, status: 'active', note: 'charged again', tone: 'good' },
      { id: 'ended', col: 1, row: 1, status: 'ended', note: 'access off', tone: 'bad' },
    ],
    edges: [
      { from: 'cancelled', to: 'resumed', label: 'resumed', tone: 'good' },
      { from: 'cancelled', to: 'ended', label: 'period over', tone: 'bad' },
    ],
  },
]

function TreeView({ tree, index }: { tree: Tree; index: number }) {
  const height = TITLE + (tree.rows - 1) * ROW + H + 2
  const x = (node: Node) => node.col * COL
  const y = (node: Node) => TITLE + node.row * ROW
  const find = (id: string) => tree.nodes.find((node) => node.id === id)!

  return (
    <svg
      className='no-bleed'
      viewBox={`0 0 660 ${height}`}
      role='img'
      aria-label={`${tree.title}: ${tree.edges
        .map((edge) => `${find(edge.from).status} to ${find(edge.to).status}${edge.label ? ` when ${edge.label}` : ''}`)
        .join(', ')}.`}
      style={{ width: '100%', height: 'auto', fontFamily: 'inherit' }}
    >
      <defs>
        {(Object.keys(COLOR) as Tone[]).map((tone) => (
          <marker
            key={tone}
            id={`life-${index}-${tone}`}
            viewBox='0 0 10 10'
            refX='9'
            refY='5'
            markerWidth='5'
            markerHeight='5'
            orient='auto-start-reverse'
          >
            <path d='M 0 0 L 10 5 L 0 10 z' fill={COLOR[tone]} />
          </marker>
        ))}
      </defs>

      <text
        x={0}
        y={12}
        fontSize='11'
        fontWeight='600'
        letterSpacing='0.08em'
        fill='var(--muted-foreground)'
        style={{ textTransform: 'uppercase' }}
      >
        {tree.title}
      </text>

      {tree.edges.map((edge) => {
        const from = find(edge.from)
        const to = find(edge.to)
        const x1 = x(from) + W
        const y1 = y(from) + H / 2
        const x2 = x(to) - 2
        const y2 = y(to) + H / 2
        const bend = (x2 - x1) * 0.5
        return (
          <g key={`${edge.from}-${edge.to}`}>
            <path
              d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`}
              fill='none'
              stroke={COLOR[edge.tone]}
              strokeWidth='1.25'
              markerEnd={`url(#life-${index}-${edge.tone})`}
            />
          </g>
        )
      })}

      {tree.nodes.map((node) => {
        const tone = node.tone ?? 'neutral'
        const toned = tone !== 'neutral'
        return (
          <g key={node.id}>
            <rect
              x={x(node) + 0.5}
              y={y(node) + 0.5}
              width={W - 1}
              height={H - 1}
              rx={9}
              fill='var(--background)'
              stroke={toned ? `color-mix(in srgb, ${COLOR[tone]} 55%, transparent)` : 'var(--border)'}
            />
            <text
              x={x(node) + W / 2}
              y={y(node) + 20}
              textAnchor='middle'
              fontSize='13'
              fontWeight='600'
              fontFamily='var(--font-mono, ui-monospace, monospace)'
              fill='var(--foreground)'
            >
              {node.status}
            </text>
            <text
              x={x(node) + W / 2}
              y={y(node) + 36}
              textAnchor='middle'
              fontSize='11.5'
              fill='var(--muted-foreground)'
            >
              {node.note}
            </text>
          </g>
        )
      })}

      {/* each answer, written on its wire */}
      {tree.edges
        .filter((edge) => edge.label)
        .map((edge) => {
          const from = find(edge.from)
          const to = find(edge.to)
          const cx = (x(from) + W + x(to)) / 2
          const cy = (y(from) + y(to)) / 2 + H / 2
          const width = edge.label!.length * 6.6 + 12
          return (
            <g key={`label-${edge.to}`}>
              <rect
                x={cx - width / 2}
                y={cy - 8}
                width={width}
                height={16}
                rx={4}
                fill='var(--background)'
              />
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor='middle'
                fontSize='10'
                fontWeight='600'
                letterSpacing='0.08em'
                fill={COLOR[edge.tone]}
                style={{ textTransform: 'uppercase' }}
              >
                {edge.label}
              </text>
            </g>
          )
        })}
    </svg>
  )
}

export function Lifecycle() {
  return (
    <div className='no-bleed' style={{ display: 'grid', gap: 28 }}>
      {TREES.map((tree, index) => (
        <TreeView key={tree.title} tree={tree} index={index} />
      ))}
    </div>
  )
}
