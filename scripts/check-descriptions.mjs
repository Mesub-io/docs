// Fails when a page's meta description is outside 25 to 160 characters (docs #137):
// Bing Webmaster Tools flags it, and search results cut a longer one.
import fs from 'node:fs'
import path from 'node:path'

const MIN = 25
const MAX = 160
const root = path.join(import.meta.dirname, '..', 'src')

function* pages(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* pages(full)
    else if (entry.name.endsWith('.mdx')) yield full
  }
}

const wrong = []
for (const file of pages(root)) {
  const front = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)
  const line = front?.[1].match(/^description:\s*"(.*)"\s*$/m)
  if (!line) continue
  const length = line[1].length
  if (length < MIN || length > MAX) wrong.push(`${path.relative(root, file)}: ${length} characters`)
}

if (wrong.length) {
  console.error(`Descriptions outside ${MIN} to ${MAX} characters:\n` + wrong.join('\n'))
  process.exit(1)
}
console.log(`check:descriptions: every description is ${MIN} to ${MAX} characters`)
