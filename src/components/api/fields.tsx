'use client'

// The rows of a parameter list or of a schema, and the small inline Markdown
// the spec's descriptions are written in. A row is two lines: what the field
// is, then what it means. Its limits, default and example wait behind
// "Details".

import { useId, useState, type ReactNode } from 'react'
import type { Field } from './spec'

/** Backticks, bold and links, which is all a field's description uses. */
export function Md({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, index): ReactNode => {
        if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
        if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        if (link) return <a key={index} href={link[2]}>{link[1]}</a>
        return part
      })}
    </>
  )
}

/** `sent`: what you send, where a field can be required. `received`: what Mesub answers or posts. */
type Side = 'sent' | 'received'

/** An enum this short is read at a glance; a longer one waits behind "Details". */
const VALUES_SHOWN = 4

function Values({ values }: { values: string[] }) {
  return (
    <p className='mapi-field-meta'>
      <span>One of</span>
      {values.map((value) => (
        <code key={value}>{value}</code>
      ))}
    </p>
  )
}

function Row({ field, side }: { field: Field; side: Side }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const values = field.values ?? []
  const glance = values.length > 0 && values.length <= VALUES_SHOWN
  const hasDetails =
    (values.length > 0 && !glance) ||
    field.limits.length > 0 ||
    field.fallback !== undefined ||
    field.example !== undefined

  return (
    <div className='mapi-field'>
      <div className='mapi-field-head'>
        <span className='mapi-field-name'>{field.name}</span>
        <span className='mapi-pill'>{field.type}</span>
        {side === 'sent' && field.required && <span className='mapi-pill mapi-pill-required'>required</span>}
        {/* An answer requires nothing of the reader: only a field that may be missing is marked. */}
        {side === 'received' && !field.required && <span className='mapi-pill'>not always present</span>}
        {hasDetails && (
          <button
            type='button'
            className='mapi-field-toggle'
            aria-expanded={open}
            aria-controls={id}
            aria-label={`Details of ${field.name}`}
            onClick={() => setOpen(!open)}
          >
            Details
            <svg viewBox='0 0 10 10' width='8' height='8' aria-hidden='true'>
              <path d='M2 3.5l3 3 3-3' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        )}
      </div>
      {field.description && (
        <p className='mapi-field-text'>
          <Md text={field.description} />
        </p>
      )}
      {glance && <Values values={values} />}
      {hasDetails && (
        <div id={id} className='mapi-field-details' hidden={!open}>
          {values.length > 0 && !glance && <Values values={values} />}
          {field.fallback !== undefined && (
            <p className='mapi-field-meta'>
              <span>Default:</span>
              <code>{field.fallback}</code>
            </p>
          )}
          {field.limits.length > 0 && (
            <p className='mapi-field-meta'>
              <span>Limits:</span>
              {field.limits.map((limit) => (
                <span key={limit} className='mapi-limit'>{limit}</span>
              ))}
            </p>
          )}
          {field.example !== undefined && (
            <p className='mapi-field-meta'>
              <span>Example:</span>
              <code>{field.example}</code>
            </p>
          )}
        </div>
      )}
      {field.children && (
        <details className='mapi-children'>
          <summary>
            <span className='mapi-children-closed'>Show child attributes</span>
            <span className='mapi-children-open'>Hide child attributes</span>
          </summary>
          <FieldList fields={field.children} side={side} />
        </details>
      )}
    </div>
  )
}

export function FieldList({ fields, side = 'sent' }: { fields: Field[]; side?: Side }) {
  return (
    <div className='mapi-fields'>
      {fields.map((field) => (
        <Row key={field.name} field={field} side={side} />
      ))}
    </div>
  )
}
