'use client'

// The rest of an endpoint's introduction, behind one button: the first
// paragraph says what the route does, this holds what else to know. It stays
// in the page, hidden, so a search in the browser and the Markdown copy still
// find it.

import { useId, useState, type ReactNode } from 'react'

export function More({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className='mapi-more'>
      <div id={id} className='mapi-more-body' hidden={!open}>
        {children}
      </div>
      <button type='button' className='mapi-more-button' aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'Read more'}
        <svg viewBox='0 0 10 10' width='9' height='9' aria-hidden='true'>
          <path d='M2 3.5l3 3 3-3' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>
    </div>
  )
}
