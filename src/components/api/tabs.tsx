'use client'

// One section of an endpoint page at a time: its parameters by kind, then the
// response. Every panel stays in the page, hidden, so a search in the browser
// and the Markdown copy still find it.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface Tab {
  /** Also the anchor: `#response` opens the page on that tab. */
  id: string
  label: string
  /** How many fields it holds, shown beside the label. */
  count?: number
  node: ReactNode
}

export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [picked, setPicked] = useState(tabs[0]?.id)
  const base = useId()
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})

  // After the first paint, so the server's page and the browser's agree.
  useEffect(() => {
    const open = () => {
      const asked = window.location.hash.slice(1)
      if (tabs.some((tab) => tab.id === asked)) setPicked(asked)
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [tabs])

  function pick(id: string, focus = false) {
    setPicked(id)
    window.history.replaceState(null, '', `#${id}`)
    if (focus) buttons.current[id]?.focus()
  }

  function onKey(event: KeyboardEvent, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const to =
      event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + step + tabs.length) % tabs.length
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    pick(tabs[to]!.id, true)
  }

  if (tabs.length === 0) return null

  return (
    <div className='mapi-tabs'>
      <div className='mapi-tablist' role='tablist' aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              buttons.current[tab.id] = node
            }}
            type='button'
            role='tab'
            id={`${base}-${tab.id}-tab`}
            aria-controls={`${base}-${tab.id}`}
            aria-selected={tab.id === picked}
            tabIndex={tab.id === picked ? 0 : -1}
            className='mapi-tab'
            onClick={() => pick(tab.id)}
            onKeyDown={(event) => onKey(event, index)}
          >
            {tab.label}
            {tab.count !== undefined && <span className='mapi-tab-count'>{tab.count}</span>}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role='tabpanel'
          id={`${base}-${tab.id}`}
          aria-labelledby={`${base}-${tab.id}-tab`}
          hidden={tab.id !== picked}
          className='mapi-tabpanel'
        >
          {tab.node}
        </div>
      ))}
    </div>
  )
}
