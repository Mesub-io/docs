'use client'

// The one card of a reference page's right column: its code samples, a group
// at a time (Request, Response) and one sample of the group at a time. The
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
  type KeyboardEvent,
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

export function Samples({ groups, lines = '', children }: { groups: string; lines?: string; children: ReactNode }) {
  const all = read(groups, lines, children)
  const base = useId()
  const [group, setGroup] = useState(0)
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const switches = useRef<(HTMLButtonElement | null)[]>([])

  // After the first paint, so the server's page and the browser's agree.
  useEffect(() => {
    try {
      const last = localStorage.getItem(LANGUAGE_STORE)
      if (!last) return
      const found: Record<number, number> = {}
      all.forEach((entry, index) => {
        const at = entry.samples.findIndex((sample) => sample.label === last)
        if (at > 0 && entry.samples.length <= TABS_UP_TO) found[index] = at
      })
      if (Object.keys(found).length > 0) setPicked((current) => ({ ...found, ...current }))
    } catch {
      // No storage in this browser: every page opens on its first sample.
    }
    // Once: the samples of a page do not change under it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = all[group]
  if (!shown || shown.samples.length === 0) return null
  const index = Math.min(picked[group] ?? 0, shown.samples.length - 1)
  const sample = shown.samples[index]!
  const key = `${group}-${index}`
  const foldable = shown.cut && sample.lines >= CUT_FROM
  const folded = foldable && !open[key]

  function pick(at: number, remember: boolean) {
    setPicked((current) => ({ ...current, [group]: at }))
    if (!remember) return
    try {
      localStorage.setItem(LANGUAGE_STORE, shown!.samples[at]!.label)
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

  function onSwitchKey(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const to = (group + step + all.length) % all.length
    setGroup(to)
    switches.current[to]?.focus()
  }

  const asTabs = shown.samples.length > 1 && shown.samples.length <= TABS_UP_TO

  return (
    <div className='mapi-samples'>
      <div className='mapi-samples-top'>
        {all.length > 1 ? (
          <div className='mapi-switch' role='tablist' aria-label='Samples'>
            {all.map((entry, at) => (
              <button
                key={entry.name}
                ref={(node) => {
                  switches.current[at] = node
                }}
                type='button'
                role='tab'
                id={`${base}-switch-${at}`}
                aria-controls={`${base}-body`}
                aria-selected={at === group}
                tabIndex={at === group ? 0 : -1}
                onClick={() => setGroup(at)}
                onKeyDown={onSwitchKey}
              >
                {entry.name}
              </button>
            ))}
          </div>
        ) : (
          <span className='mapi-samples-name'>{shown.name}</span>
        )}
        <button type='button' className='mapi-samples-copy' aria-label={copied ? 'Copied' : 'Copy this sample'} onClick={copy}>
          <CopyIcon done={copied} />
        </button>
      </div>

      {shown.samples.length > 1 && (
        <div className='mapi-samples-pick'>
          {asTabs ? (
            <div className='mapi-samples-tabs' role='group' aria-label={`${shown.name} sample`}>
              {shown.samples.map((entry, at) => (
                <button key={entry.label} type='button' aria-pressed={at === index} onClick={() => pick(at, true)}>
                  {entry.label}
                </button>
              ))}
            </div>
          ) : (
            <label className='mapi-samples-select'>
              <span>Status</span>
              <select value={index} onChange={(event) => pick(Number(event.target.value), false)}>
                {shown.samples.map((entry, at) => (
                  <option key={entry.label} value={at}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <div
        ref={body}
        id={`${base}-body`}
        role={all.length > 1 ? 'tabpanel' : undefined}
        aria-labelledby={all.length > 1 ? `${base}-switch-${group}` : undefined}
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
          aria-controls={`${base}-body`}
          onClick={() => setOpen((current) => ({ ...current, [key]: folded }))}
        >
          {folded ? `Show all ${sample.lines} lines` : 'Show less'}
        </button>
      )}
    </div>
  )
}
