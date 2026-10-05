// Reads public/openapi.json, the one description of the public API, and turns
// an operation into what the reference page draws. Runs on the server: the
// browser only ever gets the one operation it shows.

import raw from '../../../public/openapi.json'

type Json = Record<string, any>

const spec = raw as Json

export const SERVER: string = spec.servers[0].url

/** One row of a parameter list or of a schema. */
export interface Field {
  name: string
  type: string
  required: boolean
  description?: string
  values?: string[]
  fallback?: string
  example?: string
  limits: string[]
  children?: Field[]
}

/** A parameter the try-it panel asks for. */
export interface Input {
  name: string
  in: 'path' | 'query' | 'body'
  type: string
  required: boolean
  description?: string
  placeholder?: string
  values?: string[]
}

export interface ErrorCode {
  code: string
  when: string
  retryable: boolean
}

export interface ResponseModel {
  status: string
  description: string
  /** One list, or several when the body is one of several shapes. */
  shapes: { title?: string; fields: Field[] }[]
  codes: ErrorCode[]
  headers: Field[]
}

export interface EndpointModel {
  id: string
  kind: 'route' | 'webhook'
  tag: string
  title: string
  summary: string
  method: string
  path: string
  limit?: string
  guide?: { label: string; href: string }
  auth: string
  pathParams: Field[]
  queryParams: Field[]
  headerParams: Field[]
  body?: { fields: Field[]; required: boolean }
  responses: ResponseModel[]
  tryIt?: { inputs: Input[]; confirm?: string }
}

function deref(node: Json | undefined): Json {
  if (!node) return {}
  if (typeof node.$ref === 'string') {
    const name = node.$ref.split('/').pop() as string
    return deref(spec.components.schemas[name])
  }
  return node
}

/** `allOf` folded into one object: the only composition the spec uses for objects. */
function flat(node: Json | undefined): Json {
  const schema = deref(node)
  if (!Array.isArray(schema.allOf)) return schema

  const merged: Json = { ...schema, type: 'object', properties: {}, required: [] }
  delete merged.allOf
  for (const part of schema.allOf) {
    const piece = flat(part)
    merged.properties = { ...merged.properties, ...piece.properties }
    merged.required = [...merged.required, ...(piece.required ?? [])]
  }
  return merged
}

function typeOf(node: Json): string {
  const schema = flat(node)
  if (Array.isArray(schema.oneOf)) return schema.oneOf.map(typeOf).join(' | ')

  const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type ?? 'object']
  const main = types.find((type) => type !== 'null') ?? 'null'
  let label = main
  if (main === 'array') label = `${typeOf(schema.items ?? {})}[]`
  else if (schema.format) label = `${main}<${schema.format}>`
  else if (Array.isArray(schema.enum) && main === 'string') label = 'enum<string>'

  return types.includes('null') ? `${label} | null` : label
}

function limitsOf(schema: Json): string[] {
  const limits: string[] = []
  const { minimum, maximum, minLength, maxLength, pattern } = schema
  if (minimum !== undefined && maximum !== undefined) limits.push(`${minimum} to ${maximum}`)
  else if (minimum !== undefined) limits.push(`at least ${minimum}`)
  else if (maximum !== undefined) limits.push(`at most ${maximum}`)
  if (minLength !== undefined && maxLength !== undefined) limits.push(`${minLength} to ${maxLength} characters`)
  else if (maxLength !== undefined) limits.push(`at most ${maxLength} characters`)
  if (pattern) limits.push(`matches ${pattern}`)
  return limits
}

function childrenOf(node: Json, depth: number): Field[] | undefined {
  if (depth > 3) return undefined
  const schema = flat(node)
  const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type]
  if (types.includes('array')) return childrenOf(schema.items ?? {}, depth)
  if (!schema.properties) return undefined
  const fields = fieldsOf(schema, depth + 1)
  return fields.length ? fields : undefined
}

function field(name: string, node: Json, required: boolean, depth: number, extra: Json = {}): Field {
  const schema = flat(node)
  const example = extra.example ?? extra['x-example'] ?? schema.example
  return {
    name,
    type: typeOf(node),
    required,
    description: extra.description ?? node.description ?? schema.description,
    values: Array.isArray(schema.enum)
      ? schema.enum.filter((value: unknown) => value !== null).map(String)
      : undefined,
    fallback: schema.default === undefined ? undefined : String(schema.default),
    example: example === undefined ? undefined : String(example),
    limits: limitsOf(schema),
    children: childrenOf(node, depth),
  }
}

function fieldsOf(node: Json, depth = 0): Field[] {
  const schema = flat(node)
  const required: string[] = schema.required ?? []
  return Object.entries(schema.properties ?? {}).map(([name, child]) =>
    field(name, child as Json, required.includes(name), depth),
  )
}

function paramsOf(operation: Json, where: string): Field[] {
  return (operation.parameters ?? [])
    .filter((param: Json) => param.in === where)
    .map((param: Json) => field(param.name, param.schema ?? {}, param.required === true, 0, param))
}

function responsesOf(operation: Json): ResponseModel[] {
  return Object.entries(operation.responses ?? {}).map(([status, value]) => {
    const response = value as Json
    const schema = response.content?.['application/json']?.schema as Json | undefined
    const resolved = schema ? deref(schema) : undefined
    const shapes = !resolved
      ? []
      : Array.isArray(resolved.oneOf)
        ? resolved.oneOf.map((option: Json) => ({ title: deref(option).title, fields: fieldsOf(option) }))
        : [{ fields: fieldsOf(resolved) }]

    return {
      status,
      description: response.description ?? '',
      shapes,
      codes: response['x-codes'] ?? [],
      headers: Object.entries(response.headers ?? {}).map(([name, header]) =>
        field(name, (header as Json).schema ?? {}, false, 0, header as Json),
      ),
    }
  })
}

function inputsOf(operation: Json): Input[] {
  const inputs: Input[] = (operation.parameters ?? []).map((param: Json) => {
    const schema = flat(param.schema ?? {})
    const example = param.example ?? param['x-example']
    return {
      name: param.name,
      in: param.in,
      type: typeOf(param.schema ?? {}),
      required: param.required === true,
      description: param.description,
      placeholder: example === undefined ? undefined : String(example),
      values: schema.type === 'boolean' ? ['true', 'false'] : undefined,
    }
  })

  const media = operation.requestBody?.content?.['application/json']
  if (media) {
    const schema = flat(media.schema)
    const required: string[] = schema.required ?? []
    for (const [name, child] of Object.entries(schema.properties ?? {})) {
      const example = media.example?.[name]
      inputs.push({
        name,
        in: 'body',
        type: typeOf(child as Json),
        required: required.includes(name),
        description: (child as Json).description,
        placeholder: example === undefined ? undefined : String(example),
      })
    }
  }
  return inputs
}

function model(kind: 'route' | 'webhook', method: string, path: string, operation: Json): EndpointModel {
  const extra: Json = operation['x-mesub'] ?? {}
  const media = operation.requestBody?.content?.['application/json']

  return {
    id: operation.operationId,
    kind,
    tag: operation.tags?.[0] ?? '',
    title: extra.title ?? operation.summary,
    summary: operation.summary,
    method: method.toUpperCase(),
    path,
    limit: extra.limit,
    guide: extra.guide,
    auth: spec.components.securitySchemes.apiKey.description,
    pathParams: paramsOf(operation, 'path'),
    queryParams: paramsOf(operation, 'query'),
    headerParams: paramsOf(operation, 'header'),
    body: media ? { fields: fieldsOf(media.schema), required: operation.requestBody.required === true } : undefined,
    responses: responsesOf(operation),
    tryIt: kind === 'route' ? { inputs: inputsOf(operation), confirm: extra.confirm } : undefined,
  }
}

/** The operation under that `operationId`, among the routes and the webhooks. */
export function endpoint(id: string): EndpointModel {
  for (const [path, methods] of Object.entries(spec.paths as Json)) {
    for (const [method, operation] of Object.entries(methods as Json)) {
      if ((operation as Json).operationId === id) return model('route', method, path, operation as Json)
    }
  }
  for (const [name, methods] of Object.entries(spec.webhooks as Json)) {
    const operation = (methods as Json).post
    if (operation.operationId === id) return model('webhook', 'post', name, operation)
  }
  throw new Error(`No operation ${id} in public/openapi.json.`)
}

/** A named schema of the spec, as rows. */
export function schemaFields(name: string): Field[] {
  const schema = spec.components.schemas[name]
  if (!schema) throw new Error(`No schema ${name} in public/openapi.json.`)
  return fieldsOf(schema)
}

/** Every error code the routes answer, once each, with the statuses it comes under. */
export function errorCodes(): (ErrorCode & { status: string })[] {
  const seen = new Map<string, ErrorCode & { status: string }>()
  for (const methods of Object.values(spec.paths as Json)) {
    for (const operation of Object.values(methods as Json)) {
      for (const [status, response] of Object.entries((operation as Json).responses ?? {})) {
        for (const code of ((response as Json)['x-codes'] ?? []) as ErrorCode[]) {
          if (!seen.has(code.code)) seen.set(code.code, { ...code, status })
        }
      }
    }
  }
  return [...seen.values()]
}
