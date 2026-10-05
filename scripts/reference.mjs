// Writes one page per operation of public/openapi.json under src/reference/.
//
// A page holds what Holocron draws natively, the request and response samples
// of the right column, and one line naming the operation: the Endpoint
// component draws the rest from the same spec. Run by `pnpm dev` and
// `pnpm build`, so a page never trails the spec. Never edit a generated page:
// change the spec.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const spec = JSON.parse(readFileSync(path.join(root, 'public/openapi.json'), 'utf8'))
const server = spec.servers[0].url

const fence = (lang, title, code) => ['```' + lang + ` title="${title}" lines=false`, code, '```']
const pretty = (value) => JSON.stringify(value, null, 4)

/** The first sentences of a description, as plain text, for the page's meta description. */
function plain(markdown) {
  const text = markdown
    .split('\n\n')[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/"/g, "'")
  return text.length <= 160 ? text : text.slice(0, 157).replace(/\s+\S*$/, '') + '...'
}

/** Site paths in the spec become relative links to the page's file, which the build checks. */
function relink(markdown, href) {
  return markdown.replace(/\]\(\/([a-z0-9/-]+)(#[a-z0-9-]+)?\)/g, (_, target, hash = '') => {
    const relative = path.posix.relative(path.posix.dirname(href), target)
    return `](${relative.startsWith('.') ? relative : './' + relative}.mdx${hash})`
  })
}

/** The request the samples show: the parameters that carry an `example`, and the body's. */
function sampleRequest(method, route, operation) {
  let url = route
  const query = []
  for (const param of operation.parameters ?? []) {
    if (param.example === undefined) continue
    if (param.in === 'path') url = url.replace(`{${param.name}}`, param.example)
    if (param.in === 'query') query.push(`${param.name}=${encodeURIComponent(param.example)}`)
  }
  const body = operation.requestBody?.content?.['application/json']?.example
  return { method: method.toUpperCase(), url: `${server}${url}${query.length ? '?' + query.join('&') : ''}`, body }
}

function curl({ method, url, body }) {
  const lines = [
    method === 'GET' ? `curl "${url}"` : `curl -X ${method} "${url}"`,
    '  -H "Authorization: Bearer $MESUB_API_KEY"',
  ]
  if (body !== undefined) {
    lines.push('  -H "Content-Type: application/json"')
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`)
  }
  return lines.join(' \\\n')
}

function fetchSample({ method, url, body }) {
  const options = [
    ...(method === 'GET' ? [] : [`    method: '${method}',`]),
    '    headers: {',
    '        Authorization: `Bearer ${process.env.MESUB_API_KEY}`,',
    ...(body !== undefined ? ["        'Content-Type': 'application/json',"] : []),
    '    },',
    ...(body !== undefined
      ? [`    body: JSON.stringify(${pretty(body).replace(/\n/g, '\n    ').replace(/"([a-z_]+)":/g, '$1:')}),`]
      : []),
  ]
  return [
    `const response = await fetch('${url}', {`,
    ...options,
    '});',
    '',
    'if (!response.ok) {',
    '    const { code, retryable } = await response.json();',
    '    // branch on `code`',
    '}',
    'const data = await response.json();',
  ].join('\n')
}

function requestExamples(method, route, operation) {
  const request = sampleRequest(method, route, operation)
  return [
    ...fence('bash', 'cURL', curl(request)),
    ...(operation['x-codeSamples'] ?? []).flatMap((sample) => fence('ts', sample.label, sample.source)),
    ...fence('js', 'fetch', fetchSample(request)),
  ]
}

function responseExamples(operation) {
  return Object.entries(operation.responses ?? {}).flatMap(([status, response]) => {
    const media = response.content?.['application/json']
    if (!media) return []
    if (media.examples) {
      return Object.entries(media.examples).flatMap(([name, example]) =>
        fence('json', `${status} ${name}`, pretty(example.value)),
      )
    }
    return media.example === undefined ? [] : fence('json', status, pretty(media.example))
  })
}

function webhookExamples(name, operation) {
  const payload = operation.requestBody.content['application/json'].example
  const handler = [
    "import { Mesub } from '@mesub/node';",
    '',
    'const mesub = new Mesub(); // reads MESUB_API_KEY and MESUB_WEBHOOK_SECRET',
    '',
    '// rawBody: the exact bytes received, never a parsed and rewritten body',
    'const event = await mesub.webhooks.verify(rawBody, headers);',
    '',
    `if (event.type === '${name}') {`,
    '    // event.id is the webhook-id header: deduplicate on it',
    '    // event.data is the subscription, event.data.detail the event\'s own',
    '}',
  ].join('\n')
  return {
    request: [...fence('json', 'Payload', pretty(payload)), ...fence('ts', '@mesub/node', handler)],
    response: [],
  }
}

function page({ kind, method, route, operation }) {
  const extra = operation['x-mesub']
  const depth = extra.href.split('/').length - 1
  const title = extra.title ?? operation.summary
  const webhook = kind === 'webhook'
  const examples = webhook
    ? webhookExamples(route, operation)
    : { request: requestExamples(method, route, operation), response: responseExamples(operation) }

  const lines = [
    '---',
    '$schema: https://holocron.so/frontmatter.json',
    `title: "${title}"`,
    `sidebarTitle: "${operation.summary}"`,
    `description: "${plain(operation.description)}"`,
    ...(webhook ? [] : [`api: "${method.toUpperCase()} ${route}"`]),
    'hideTitle: true',
    'gridGap: 36',
    'prompt: |',
    '  Generated by @/scripts/reference.mjs from @/public/openapi.json, which is',
    '  written from the backend. Do not edit this page: change the spec and run',
    '  `pnpm reference`.',
    '---',
    '',
    `import { Endpoint } from '${'../'.repeat(depth)}components/api/endpoint'`,
    '',
    '<Aside full>',
    '',
    '<RequestExample>',
    '',
    ...examples.request,
    '',
    '</RequestExample>',
    '',
    ...(examples.response.length
      ? ['<ResponseExample>', '', ...examples.response, '', '</ResponseExample>', '']
      : []),
    '</Aside>',
    '',
    `<Endpoint id="${operation.operationId}">`,
    '',
    relink(operation.description, extra.href),
    '',
    '</Endpoint>',
    '',
  ]

  const file = path.join(root, 'src', `${extra.href}.mdx`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, lines.join('\n'))
  return extra.href
}

const written = []
for (const [route, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    written.push(page({ kind: 'route', method, route, operation }))
  }
}
for (const [name, methods] of Object.entries(spec.webhooks)) {
  written.push(page({ kind: 'webhook', method: 'post', route: name, operation: methods.post }))
}

console.log(`reference: ${written.length} pages written from public/openapi.json`)
