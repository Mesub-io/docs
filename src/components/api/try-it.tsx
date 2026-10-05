'use client'

// The bar under an endpoint's title, and the panel its button opens: fill the
// parameters, send the request from this browser, read what came back.
//
// The API key lives in this component's state, and in sessionStorage only when
// the reader asks to keep it for the tab. It goes in one place, the
// Authorization header of the request to the API host. It is never logged,
// never put in the cURL shown, and never sent to the docs' own server.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Input } from './spec'

/** Where requests go. Set VITE_MESUB_API_URL at build to point at another backend. */
const BUILD_BASE = (import.meta.env.VITE_MESUB_API_URL as string | undefined)?.replace(/\/+$/, '')

const KEY_STORE = 'mesub-docs-api-key'

interface Props {
  server: string
  method: string
  path: string
  summary: string
  inputs: Input[]
  confirm?: string
}

type Values = Record<string, string>

type Outcome =
  | { kind: 'answer'; status: number; statusText: string; ms: number; headers: [string, string][]; body: string }
  | { kind: 'blocked'; origin: string; base: string }
  | { kind: 'offline' }

const keyOf = (input: Input) => `${input.in}:${input.name}`

/** The request as it will be sent, from what was typed. */
function build(base: string, method: string, path: string, inputs: Input[], values: Values) {
  let url = path
  const query = new URLSearchParams()
  const body: Record<string, unknown> = {}
  const missing: string[] = []

  for (const input of inputs) {
    const value = (values[keyOf(input)] ?? '').trim()
    if (!value) {
      if (input.required) missing.push(input.name)
      continue
    }
    if (input.in === 'path') url = url.replace(`{${input.name}}`, encodeURIComponent(value))
    else if (input.in === 'query') query.set(input.name, value)
    else body[input.name] = value
  }

  const search = query.toString()
  const hasBody = inputs.some((input) => input.in === 'body')

  return {
    url: `${base}${url}${search ? `?${search}` : ''}`,
    body: hasBody ? JSON.stringify(body, null, 2) : undefined,
    missing,
    method,
  }
}

function curlOf(request: ReturnType<typeof build>): string {
  const lines = [
    request.method === 'GET' ? `curl "${request.url}"` : `curl -X ${request.method} "${request.url}"`,
    '  -H "Authorization: Bearer $MESUB_API_KEY"',
  ]
  if (request.body !== undefined) {
    lines.push('  -H "Content-Type: application/json"')
    lines.push(`  -d '${request.body.replace(/'/g, "'\\''")}'`)
  }
  return lines.join(' \\\n')
}

/** JSON with the classes the site's code theme already colors. */
function Json({ text }: { text: string }) {
  const tokens = text.split(/("(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?)/g)
  return (
    <code className='language-json'>
      {tokens.map((token, index) => {
        if (index % 2 === 0) return token
        const next = tokens[index + 1] ?? ''
        const kind = token.startsWith('"')
          ? /^\s*:/.test(next)
            ? 'property'
            : 'string'
          : /^[-\d]/.test(token)
            ? 'number'
            : 'keyword'
        return (
          <span key={index} className={`token ${kind}`}>
            {token}
          </span>
        )
      })}
    </code>
  )
}

function pretty(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type='button'
      className='mapi-copy'
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className='mapi-group'>
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

function InputRow({ input, value, onChange }: { input: Input; value: string; onChange: (value: string) => void }) {
  const id = `mapi-input-${input.in}-${input.name}`
  return (
    <div className='mapi-input'>
      <label htmlFor={id}>
        <span className='mapi-field-name'>{input.name}</span>
        <span className='mapi-pill'>{input.type}</span>
        {input.required && <span className='mapi-pill mapi-pill-required'>required</span>}
      </label>
      {input.values ? (
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value=''>not sent</option>
          {input.values.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type='text'
          value={value}
          placeholder={input.placeholder ?? `enter ${input.name}`}
          autoComplete='off'
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}

export function TryIt({ server, method, path, summary, inputs, confirm }: Props) {
  const base = BUILD_BASE || server
  const dialog = useRef<HTMLDialogElement>(null)
  const [apiKey, setApiKey] = useState('')
  const [keep, setKeep] = useState(false)
  const [values, setValues] = useState<Values>({})
  const [asking, setAsking] = useState(false)
  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  // A key kept for the tab comes back when the panel is opened on another page.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY_STORE)
      if (stored) {
        setApiKey(stored)
        setKeep(true)
      }
    } catch {
      // No storage in this browser: the key stays in memory.
    }
  }, [])

  useEffect(() => {
    try {
      if (keep && apiKey) sessionStorage.setItem(KEY_STORE, apiKey)
      else sessionStorage.removeItem(KEY_STORE)
    } catch {
      // As above.
    }
  }, [keep, apiKey])

  const request = useMemo(() => build(base, method, path, inputs, values), [base, method, path, inputs, values])
  const curl = useMemo(() => curlOf(request), [request])
  const segments = path.split('/').filter(Boolean)

  const groups: [string, Input[]][] = [
    ['Path', inputs.filter((input) => input.in === 'path')],
    ['Query', inputs.filter((input) => input.in === 'query')],
    ['Body', inputs.filter((input) => input.in === 'body')],
  ]

  async function send() {
    setAsking(false)
    setSending(true)
    setOutcome(null)
    const started = performance.now()

    try {
      const response = await fetch(request.url, {
        method,
        headers: {
          ...(apiKey.trim() && { Authorization: `Bearer ${apiKey.trim()}` }),
          ...(request.body !== undefined && { 'Content-Type': 'application/json' }),
        },
        body: request.body,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      })
      const body = await response.text()
      setOutcome({
        kind: 'answer',
        status: response.status,
        statusText: response.statusText,
        ms: Math.round(performance.now() - started),
        headers: [...response.headers.entries()],
        body: pretty(body),
      })
    } catch {
      // fetch rejects the same way for a request the browser refused to make
      // across origins and for a host that is down: a page is not told which.
      setOutcome(navigator.onLine ? { kind: 'blocked', origin: window.location.origin, base } : { kind: 'offline' })
    } finally {
      setSending(false)
    }
  }

  function onSend() {
    if (request.missing.length > 0) return
    if (confirm) setAsking(true)
    else void send()
  }

  return (
    <>
      <div className='mapi-bar'>
        <span className='mapi-method' data-method={method}>{method}</span>
        <span className='mapi-url'>
          <span className='mapi-url-host'>{base}</span>
          {segments.map((segment, index) => (
            <span key={index}>
              <span className='mapi-url-slash'>/</span>
              <span className={segment.startsWith('{') ? 'mapi-url-param' : undefined}>{segment}</span>
            </span>
          ))}
        </span>
        <button type='button' className='mapi-try' data-method={method} onClick={() => dialog.current?.showModal()}>
          Try it
          <svg viewBox='0 0 10 10' width='9' height='9' aria-hidden='true'>
            <path d='M2 1l6 4-6 4z' fill='currentColor' />
          </svg>
        </button>
      </div>

      <dialog
        ref={dialog}
        className='mapi-dialog'
        aria-label={`Try ${summary}`}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close()
        }}
      >
        <div className='mapi-panel'>
          <div className='mapi-panel-top'>
            <div className='mapi-panel-name'>
              <span className='mapi-method' data-method={method}>{method}</span>
              <strong>{summary}</strong>
            </div>
            <div className='mapi-panel-url' title={request.url}>{request.url}</div>
            <button
              type='button'
              className='mapi-send'
              data-method={method}
              disabled={sending || request.missing.length > 0}
              onClick={onSend}
            >
              {sending ? 'Sending' : 'Send'}
            </button>
            <button type='button' className='mapi-close' aria-label='Close' onClick={() => dialog.current?.close()}>
              <svg viewBox='0 0 12 12' width='12' height='12' aria-hidden='true'>
                <path d='M2 2l8 8M10 2l-8 8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
              </svg>
            </button>
          </div>

          {asking && confirm && (
            <div className='mapi-ask' role='alertdialog' aria-label='Confirm the request'>
              <p>
                <strong>Send this for real?</strong> {confirm}
              </p>
              <div>
                <button type='button' className='mapi-ask-yes' onClick={() => void send()}>
                  Send the request
                </button>
                <button type='button' className='mapi-ask-no' onClick={() => setAsking(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className='mapi-panel-body'>
            <div className='mapi-panel-form'>
              <p className='mapi-warning'>
                Calls are real. They go to <code>{base}</code> and act on the project the key belongs to.
              </p>

              <Group title='Authorization'>
                <div className='mapi-input'>
                  <label htmlFor='mapi-key'>
                    <span className='mapi-field-name'>API key</span>
                    <span className='mapi-pill'>Bearer</span>
                    <span className='mapi-pill mapi-pill-required'>required</span>
                  </label>
                  <input
                    id='mapi-key'
                    type='password'
                    value={apiKey}
                    placeholder='SUB_...'
                    autoComplete='off'
                    spellCheck={false}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </div>
                <p className='mapi-note'>
                  The key stays in this browser and is sent only to the API. It is not stored or logged by the docs.
                </p>
                <label className='mapi-keep'>
                  <input type='checkbox' checked={keep} onChange={(event) => setKeep(event.target.checked)} />
                  Keep it until this tab closes
                </label>
              </Group>

              {groups.map(
                ([title, list]) =>
                  list.length > 0 && (
                    <Group key={title} title={title}>
                      {list.map((input) => (
                        <InputRow
                          key={keyOf(input)}
                          input={input}
                          value={values[keyOf(input)] ?? ''}
                          onChange={(value) => setValues((current) => ({ ...current, [keyOf(input)]: value }))}
                        />
                      ))}
                    </Group>
                  ),
              )}

              {request.missing.length > 0 && (
                <p className='mapi-note'>Fill {request.missing.join(', ')} to send.</p>
              )}
            </div>

            <div className='mapi-panel-out'>
              <div className='mapi-card'>
                <div className='mapi-card-head'>
                  <span>cURL</span>
                  <CopyButton text={curl} />
                </div>
                <pre className='mapi-pre'>
                  <code className='language-bash'>{curl}</code>
                </pre>
              </div>

              <div className='mapi-card'>
                <div className='mapi-card-head'>
                  <span>Response</span>
                  {outcome?.kind === 'answer' && (
                    <>
                      <span className='mapi-status-line' data-ok={outcome.status < 400}>
                        {outcome.status} {outcome.statusText}
                      </span>
                      <span className='mapi-time'>{outcome.ms} ms</span>
                      <CopyButton text={outcome.body} />
                    </>
                  )}
                </div>

                {!outcome && (
                  <p className='mapi-empty'>{sending ? 'Waiting for the API.' : 'Send the request to see the status, the headers and the body.'}</p>
                )}

                {outcome?.kind === 'answer' && (
                  <>
                    <details className='mapi-headers'>
                      <summary>{outcome.headers.length} headers readable from a browser</summary>
                      <dl>
                        {outcome.headers.map(([name, value]) => (
                          <div key={name}>
                            <dt>{name}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                    <pre className='mapi-pre'>{outcome.body ? <Json text={outcome.body} /> : <code>(empty body)</code>}</pre>
                  </>
                )}

                {outcome?.kind === 'blocked' && (
                  <div className='mapi-problem'>
                    <p>
                      <strong>The browser could not read an answer.</strong> Most likely the API does not allow pages
                      served from <code>{outcome.origin}</code> to call it (CORS). The browser then stops the request
                      before the key is sent: nothing is wrong with your key or your parameters.
                    </p>
                    <p>
                      A host that is down reads the same from a page. Copy the cURL above and run it in a terminal: it
                      is the same request, and it tells the two apart.
                    </p>
                  </div>
                )}

                {outcome?.kind === 'offline' && (
                  <div className='mapi-problem'>
                    <p>
                      <strong>This browser is offline.</strong> Nothing was sent. Check your connection, then send
                      again.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
