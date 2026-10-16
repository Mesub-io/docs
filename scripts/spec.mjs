// Copies the backend's OpenAPI spec, the one description of /v1, into
// public/openapi.json. The backend holds it (openapi/v1.json) and its tests keep
// it true to the code: never edit the copy here, change it there and run
// `pnpm spec`.
//
// The source defaults to the sibling backend clone; MESUB_OPENAPI or the first
// argument names another path. The backend is private, so the copy is committed
// here, and public/openapi.source.json records the backend commit it came from.
// A source outside a git repo, untracked, or with uncommitted changes is
// refused; `--force` copies it anyway and records no commit.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const force = args.includes('--force')
const given = args.find((arg) => arg !== '--force')
const source = path.resolve(given ?? process.env.MESUB_OPENAPI ?? path.join(root, '../backend/openapi/v1.json'))
const target = path.join(root, 'public/openapi.json')
const record = path.join(root, 'public/openapi.source.json')

function fail(message) {
  console.error(`spec: ${message}`)
  process.exit(1)
}

let text, spec
try {
  text = readFileSync(source, 'utf8')
  spec = JSON.parse(text)
} catch (error) {
  fail(`cannot read ${source}: ${error.message}`)
}
if (!spec.openapi || !spec.paths || !spec.webhooks) fail(`${source} is not the /v1 OpenAPI spec`)

const git = (...gitArgs) =>
  execFileSync('git', ['-C', path.dirname(source), ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

/** The commit the source is clean at, or the reason it cannot be named. */
function origin() {
  let top
  try {
    top = git('rev-parse', '--show-toplevel')
  } catch {
    return { problem: `${source} is not in a git repo` }
  }
  // git runs in the source's folder, so it takes the bare name; the record keeps the path from the repo's root.
  const name = path.basename(source)
  const file = path.relative(top, realpathSync(source))
  try {
    git('ls-files', '--error-unmatch', '--', name)
  } catch {
    return { problem: `${file} is not tracked in ${top}` }
  }
  if (git('status', '--porcelain', '--', name)) return { problem: `${file} has uncommitted changes in ${top}` }
  const [commit, date] = git('log', '-1', '--format=%H%n%cI', 'HEAD').split('\n')
  return { file, commit, date }
}

const found = origin()
if (found.problem && !force) fail(`${found.problem}; pass --force to copy it without recording a commit`)

const previous = (() => {
  try {
    return readFileSync(target, 'utf8')
  } catch {
    return null
  }
})()

writeFileSync(target, text)
writeFileSync(
  record,
  JSON.stringify(
    {
      repo: 'Mesub-io/backend',
      file: found.file ?? 'openapi/v1.json',
      commit: found.commit ?? null,
      committed_at: found.date ?? null,
      sha256: createHash('sha256').update(text).digest('hex'),
    },
    null,
    2,
  ) + '\n',
)

const from = found.commit ? `commit ${found.commit.slice(0, 7)} (${found.date})` : `no commit (--force: ${found.problem})`
console.log(`spec: public/openapi.json copied from ${source}`)
console.log(`spec: ${from}, ${Buffer.byteLength(text)} bytes, ${previous === text ? 'unchanged' : 'changed'}`)
console.log('spec: recorded in public/openapi.source.json')
