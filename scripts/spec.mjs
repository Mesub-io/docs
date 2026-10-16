// Copies the backend's OpenAPI spec, the one description of /v1, into
// public/openapi.json. The backend holds it (openapi/v1.json) and its tests keep
// it true to the code: never edit the copy here, change it there and run
// `pnpm spec`.
//
// The source defaults to the sibling backend clone; MESUB_OPENAPI or the first
// argument names another path.

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(
  process.argv[2] ?? process.env.MESUB_OPENAPI ?? path.join(root, '../backend/openapi/v1.json'),
)

let text, spec
try {
  text = readFileSync(source, 'utf8')
  spec = JSON.parse(text)
} catch (error) {
  console.error(`spec: cannot read ${source}: ${error.message}`)
  process.exit(1)
}
if (!spec.openapi || !spec.paths || !spec.webhooks) {
  console.error(`spec: ${source} is not the /v1 OpenAPI spec`)
  process.exit(1)
}

writeFileSync(path.join(root, 'public/openapi.json'), text)
console.log(`spec: public/openapi.json copied from ${source}`)
