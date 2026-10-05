'use client'

// The Response section of an endpoint page: one status at a time, picked from
// a row of statuses, with its fields and, on an error, the codes it carries.

import { useState } from 'react'
import { FieldList, Md } from './fields'
import type { ResponseModel } from './spec'

const tone = (status: string) => (status.startsWith('2') ? 'ok' : status.startsWith('5') ? 'down' : 'refused')

export function Responses({ responses }: { responses: ResponseModel[] }) {
  const [status, setStatus] = useState(responses[0]?.status)
  const [shape, setShape] = useState(0)
  const shown = responses.find((response) => response.status === status) ?? responses[0]
  if (!shown) return null

  const fields = shown.shapes[Math.min(shape, shown.shapes.length - 1)]

  return (
    <section className='mapi-section'>
      <div className='mapi-section-head'>
        <h2 className='mapi-h2' id='response'>Response</h2>
        <div className='mapi-statuses' role='tablist' aria-label='Response status'>
          {responses.map((response) => (
            <button
              key={response.status}
              type='button'
              role='tab'
              aria-selected={response.status === shown.status}
              className='mapi-status'
              data-tone={tone(response.status)}
              onClick={() => {
                setStatus(response.status)
                setShape(0)
              }}
            >
              {response.status}
            </button>
          ))}
        </div>
        {shown.shapes.length > 0 && <span className='mapi-media'>application/json</span>}
      </div>

      <p className='mapi-lead'>
        <Md text={shown.description} />
      </p>

      {shown.codes.length > 0 && (
        <div className='mapi-codes'>
          <div className='mapi-codes-title'>
            <code>code</code> is one of
          </div>
          {shown.codes.map((code) => (
            <div key={code.code} className='mapi-code'>
              <div className='mapi-code-name'>
                <code>{code.code}</code>
                {code.retryable && <span className='mapi-pill'>retryable</span>}
              </div>
              <div className='mapi-code-when'>
                <Md text={code.when} />
              </div>
            </div>
          ))}
        </div>
      )}

      {shown.headers.length > 0 && (
        <>
          <h3 className='mapi-h3'>Headers</h3>
          <FieldList fields={shown.headers} side='received' />
        </>
      )}

      {shown.shapes.length > 1 && (
        <div className='mapi-shapes' role='tablist' aria-label='Shape of the body'>
          {shown.shapes.map((option, index) => (
            <button
              key={option.title ?? index}
              type='button'
              role='tab'
              aria-selected={index === shape}
              className='mapi-shape'
              onClick={() => setShape(index)}
            >
              {option.title ?? `Shape ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {fields && (
        <>
          {shown.codes.length > 0 && <h3 className='mapi-h3'>Body</h3>}
          <FieldList fields={fields.fields} side='received' />
        </>
      )}
    </section>
  )
}
