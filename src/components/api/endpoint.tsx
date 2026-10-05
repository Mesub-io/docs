// One page of the API reference, drawn from public/openapi.json: the same
// component for every route and every webhook event. The page's MDX only names
// the operation; nothing about a route is written by hand here.

import type { ReactNode } from 'react'
import { FieldList, Md } from './fields'
import { Responses } from './responses'
import { endpoint, schemaFields, SERVER, type Field } from './spec'
import { Tabs, type Tab } from './tabs'
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
  const side = webhook ? 'received' : 'sent'

  // What changes from one route to the next comes first; the key, which never does, last.
  const tabs: Tab[] = []
  if (!webhook && model.headerParams.length > 0) {
    tabs.push({
      id: 'headers',
      label: 'Headers',
      count: model.headerParams.length,
      node: (
        <Section title='Headers'>
          <FieldList fields={model.headerParams} side={side} />
        </Section>
      ),
    })
  }
  if (model.pathParams.length > 0) {
    tabs.push({
      id: 'path',
      label: 'Path',
      count: model.pathParams.length,
      node: (
        <Section title='Path Parameters'>
          <FieldList fields={model.pathParams} />
        </Section>
      ),
    })
  }
  if (model.queryParams.length > 0) {
    tabs.push({
      id: 'query',
      label: 'Query',
      count: model.queryParams.length,
      node: (
        <Section title='Query Parameters'>
          <FieldList fields={model.queryParams} />
        </Section>
      ),
    })
  }
  if (model.body) {
    tabs.push({
      id: webhook ? 'payload' : 'body',
      label: webhook ? 'Payload' : 'Body',
      count: model.body.fields.length,
      node: (
        <Section title={webhook ? 'Payload' : 'Body'} note='application/json'>
          <FieldList fields={model.body.fields} side={side} />
        </Section>
      ),
    })
  }
  // On a webhook the payload is the news, its headers come after.
  if (webhook && model.headerParams.length > 0) {
    tabs.push({
      id: 'headers',
      label: 'Headers',
      count: model.headerParams.length,
      node: (
        <Section title='Headers'>
          <FieldList fields={model.headerParams} side={side} />
        </Section>
      ),
    })
  }
  if (webhook) {
    tabs.push({
      id: 'your-answer',
      label: 'Your answer',
      node: (
        <Section title='Your answer'>
          <p className='mapi-lead'>
            <Md text={model.responses[0]?.description ?? ''} />
          </p>
        </Section>
      ),
    })
  } else {
    tabs.push({ id: 'response', label: 'Response', node: <Responses responses={model.responses} /> })
    tabs.push({
      id: 'authorization',
      label: 'Authorization',
      node: (
        <Section title='Authorizations'>
          <FieldList fields={AUTHORIZATION(model.auth).map((row) => ({ ...row, type: 'string · header' }))} />
        </Section>
      ),
    })
  }

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

      <Tabs label={webhook ? 'What Mesub sends' : 'Request and response'} tabs={tabs} />
    </div>
  )
}

/** A named object of the API, as rows. */
export function SchemaFields({ name }: { name: string }) {
  return (
    <div className='mapi'>
      <FieldList fields={schemaFields(name)} side='received' />
    </div>
  )
}
