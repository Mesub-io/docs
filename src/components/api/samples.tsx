'use client'

// The cards of a reference page's right column: one per group of code samples
// (Request, then Response), stacked, each showing one sample at a time. The
// samples are the page's own code fences, so the site highlights them and the
// Markdown copy of the page keeps every one.

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

/** A long sample shows this many lines until it is opened. */
const CUT_LINES = 12
/** Not worth a control to hide two or three lines. */
const CUT_FROM = CUT_LINES + 4
/** Up to this many samples are tabs, more are a list to pick from. */
const TABS_UP_TO = 4

/** The language picked last, kept so the next page opens on it. */
const LANGUAGE_STORE = 'mesub-docs-sample'

interface Group {
  name: string
  cut: boolean
  samples: { label: string; lines: number; node: ReactElement }[]
}

type FenceProps = { title?: string; lang?: string }

/**
 * `groups` names each group and how many of the fences it takes, in order:
 * "Request:3,Response:7:cut". `cut` folds a long sample of that group.
 * `lines` is each fence's line count, in order, so the fold is drawn on the
 * server and nothing jumps once the page is live.
 */
function read(groups: string, lines: string, children: ReactNode): Group[] {
  const fences = Children.toArray(children).filter((node): node is ReactElement<FenceProps> => isValidElement(node))
  const counts = lines.split(',').map(Number)
  let at = 0

  return groups.split(',').map((part) => {
    const [name = '', size = '0', flag] = part.split(':')
    const samples = fences.slice(at, at + Number(size)).map((fence, index) => ({
      label: fence.props.title ?? fence.props.lang ?? `Sample ${index + 1}`,
      lines: counts[at + index] ?? 0,
      // The card already names the sample: the fence's own title would repeat it.
      node: cloneElement(fence, { title: undefined }),
    }))
    at += Number(size)
    return { name, cut: flag === 'cut', samples }
  })
}

function CopyIcon({ done }: { done: boolean }) {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      {done ? (
        <polyline points='20 6 9 17 4 12' />
      ) : (
        <>
          <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
          <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
        </>
      )}
    </svg>
  )
}

function Card({ group }: { group: Group }) {
  const id = useId()
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const asTabs = group.samples.length > 1 && group.samples.length <= TABS_UP_TO

  // After the first paint, so the server's page and the browser's agree.
  useEffect(() => {
    if (!asTabs) return
    try {
      const last = localStorage.getItem(LANGUAGE_STORE)
      const at = group.samples.findIndex((sample) => sample.label === last)
      if (at > 0) setIndex(at)
    } catch {
      // No storage in this browser: every page opens on its first sample.
    }
    // Once: the samples of a page do not change under it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sample = group.samples[Math.min(index, group.samples.length - 1)]
  if (!sample) return null
  const foldable = group.cut && sample.lines >= CUT_FROM
  const folded = foldable && !open[index]

  function pick(at: number) {
    setIndex(at)
    if (!asTabs) return
    try {
      localStorage.setItem(LANGUAGE_STORE, group.samples[at]!.label)
    } catch {
      // As above.
    }
  }

  function copy() {
    // The whole sample, folded or not: a fold only hides lines, it removes none.
    const text = body.current?.querySelector('pre')?.textContent ?? ''
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  return (
    <div className='mapi-samples'>
      <div className='mapi-samples-top'>
        <span className='mapi-samples-name'>{group.name}</span>
        {asTabs && (
          <div className='mapi-samples-tabs' role='group' aria-label={`${group.name} sample`}>
            {group.samples.map((entry, at) => (
              <button key={entry.label} type='button' aria-pressed={at === index} onClick={() => pick(at)}>
                {entry.label}
              </button>
            ))}
          </div>
        )}
        {group.samples.length > TABS_UP_TO && (
          <select
            className='mapi-samples-select'
            aria-label={`${group.name} status`}
            value={index}
            onChange={(event) => pick(Number(event.target.value))}
          >
            {group.samples.map((entry, at) => (
              <option key={entry.label} value={at}>
                {entry.label}
              </option>
            ))}
          </select>
        )}
        <button
          type='button'
          className='mapi-samples-copy'
          aria-label={copied ? 'Copied' : `Copy the ${group.name.toLowerCase()} sample`}
          onClick={copy}
        >
          <CopyIcon done={copied} />
        </button>
      </div>

      <div
        ref={body}
        id={id}
        className='mapi-samples-body code-card-body no-bleed'
        data-folded={folded || undefined}
        style={folded ? { maxHeight: `calc(${CUT_LINES} * 1.6 * var(--type-code-size) + 16px)` } : undefined}
      >
        {sample.node}
      </div>

      {foldable && (
        <button
          type='button'
          className='mapi-samples-more'
          aria-expanded={!folded}
          aria-controls={id}
          onClick={() => setOpen((current) => ({ ...current, [index]: folded }))}
        >
          {folded ? `Show all ${sample.lines} lines` : 'Show less'}
        </button>
      )}
    </div>
  )
}

export function Samples({ groups, lines = '', children }: { groups: string; lines?: string; children: ReactNode }) {
  return (
    <>
      {read(groups, lines, children)
        .filter((group) => group.samples.length > 0)
        .map((group) => (
          <Card key={group.name} group={group} />
        ))}
    </>
  )
}
