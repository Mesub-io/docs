// The rows of a parameter list or of a schema, and the small inline Markdown
// the spec's descriptions are written in. No state: drawn on the server and in
// the browser alike.

import type { ReactNode } from 'react'
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

function Row({ field }: { field: Field }) {
  return (
    <div className='mapi-field'>
      <div className='mapi-field-head'>
        <span className='mapi-field-name'>{field.name}</span>
        <span className='mapi-pill'>{field.type}</span>
        {field.required && <span className='mapi-pill mapi-pill-required'>required</span>}
        {field.fallback !== undefined && <span className='mapi-pill'>default: {field.fallback}</span>}
      </div>
      {field.description && (
        <p className='mapi-field-text'>
          <Md text={field.description} />
        </p>
      )}
      {field.values && field.values.length > 0 && (
        <p className='mapi-field-meta'>
          <span>One of</span>
          {field.values.map((value) => (
            <code key={value}>{value}</code>
          ))}
        </p>
      )}
      {field.limits.length > 0 && (
        <p className='mapi-field-meta'>
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
      {field.children && (
        <details className='mapi-children'>
          <summary>
            <span className='mapi-children-closed'>Show child attributes</span>
            <span className='mapi-children-open'>Hide child attributes</span>
          </summary>
          <FieldList fields={field.children} />
        </details>
      )}
    </div>
  )
}

export function FieldList({ fields }: { fields: Field[] }) {
  return (
    <div className='mapi-fields'>
      {fields.map((field) => (
        <Row key={field.name} field={field} />
      ))}
    </div>
  )
}
