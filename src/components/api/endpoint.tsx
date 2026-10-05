// One page of the API reference, drawn from public/openapi.json: the same
// component for every route and every webhook event. The page's MDX only names
// the operation; nothing about a route is written by hand here.

import type { ReactNode } from 'react'
import { FieldList, Md } from './fields'
import { Responses } from './responses'
import { endpoint, schemaFields, errorCodes, SERVER, type Field } from './spec'
import { TryIt } from './try-it'

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className='mapi-section'>
      <div className='mapi-section-head'>
        <h2 className='mapi-h2' id={title.toLowerCase().replace(/\s+/g, '-')}>{title}</h2>
        {note && <span className='mapi-media'>{note}</span>}
      </div>
      {children}
    </section>
  )
}

const AUTHORIZATION = (description: string): Field[] => [
  {
    name: 'Authorization',
    type: 'string',
    required: true,
    description: `\`Bearer <API key>\`. ${description} [Where to get it](/docs/api-key).`,
    limits: [],
  },
]

export function Endpoint({ id, children }: { id: string; children?: ReactNode }) {
  const model = endpoint(id)
  const webhook = model.kind === 'webhook'

  return (
    <div className='mapi'>
      <header className='mapi-header'>
        <div className='mapi-eyebrow'>{model.tag}</div>
        <h1 className='mapi-title'>{model.title}</h1>
        {children && <div className='mapi-intro'>{children}</div>}
      </header>

      {webhook ? (
        <div className='mapi-bar'>
          <span className='mapi-method' data-method='POST'>POST</span>
          <span className='mapi-url'>
            <span className='mapi-url-host'>your endpoint</span>
          </span>
          <span className='mapi-bar-note'>sent by Mesub</span>
        </div>
      ) : (
        <TryIt
          server={SERVER}
          method={model.method}
          path={model.path}
          summary={model.summary}
          inputs={model.tryIt?.inputs ?? []}
          confirm={model.tryIt?.confirm}
        />
      )}

      {(model.limit || model.guide) && (
        <p className='mapi-facts'>
          {model.limit && <span>Limit: {model.limit}.</span>}
          {model.guide && (
            <span>
              Guide: <a href={`/${model.guide.href}`}>{model.guide.label}</a>.
            </span>
          )}
        </p>
      )}

      {!webhook && (
        <Section title='Authorizations'>
          <FieldList fields={AUTHORIZATION(model.auth).map((row) => ({ ...row, type: 'string · header' }))} />
        </Section>
      )}

      {model.headerParams.length > 0 && (
        <Section title='Headers'>
          <FieldList fields={model.headerParams} />
        </Section>
      )}

      {model.pathParams.length > 0 && (
        <Section title='Path Parameters'>
          <FieldList fields={model.pathParams} />
        </Section>
      )}

      {model.queryParams.length > 0 && (
        <Section title='Query Parameters'>
          <FieldList fields={model.queryParams} />
        </Section>
      )}

      {model.body && (
        <Section title={webhook ? 'Payload' : 'Body'} note='application/json'>
          <FieldList fields={model.body.fields} />
        </Section>
      )}

      {webhook ? (
        <Section title='Your answer'>
          <p className='mapi-lead'>
            <Md text={model.responses[0]?.description ?? ''} />
          </p>
        </Section>
      ) : (
        <Responses responses={model.responses} />
      )}
    </div>
  )
}

/** A named object of the API, as rows. */
export function SchemaFields({ name }: { name: string }) {
  return (
    <div className='mapi'>
      <FieldList fields={schemaFields(name)} />
    </div>
  )
}

const STATUS_NAMES: Record<string, string> = {
  '400': 'Bad request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not found',
  '409': 'Conflict',
  '429': 'Too many requests',
  '503': 'Unavailable',
}

/** Every code the routes of the spec answer, grouped by status. */
export function ErrorCodes() {
  const codes = errorCodes()
  const statuses = [...new Set(codes.map((code) => code.status))].sort()

  return (
    <div className='mapi'>
      {statuses.map((status) => (
        <div key={status} className='mapi-codes mapi-codes-page'>
          <div className='mapi-codes-title'>
            {status} {STATUS_NAMES[status]}
          </div>
          {codes
            .filter((code) => code.status === status)
            .map((code) => (
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
      ))}
    </div>
  )
}
