# Working on the Mesub docs

For the Mesub team and its agents. The README is for a visitor: keep how the
site is edited here.

A [Holocron](https://holocron.so) site. Load the Holocron skill before editing
content, styling or navigation:
https://raw.githubusercontent.com/remorses/holocron/refs/heads/main/skills/holocron/SKILL.md

## Run it

```bash
pnpm install
pnpm dev --port 5180   # http://localhost:5180
pnpm build             # fails on a broken internal link
```

Both write the reference pages from the spec first (`pnpm reference`).

## Where things are

```text
docs.jsonc               the site: name, colors, logo, the two tabs and their menus
src/index.mdx            the home page
src/docs/*.mdx           the guides, one file per page, served at /docs/<name>
src/reference/*.mdx      the reference's hand-written pages: introduction,
                         authentication, errors, webhooks/overview
src/reference/*/*.mdx    one page per route and per webhook event: GENERATED
public/openapi.json      the description of the public API, served at /openapi.json
scripts/reference.mjs    writes the generated pages from the spec
src/components/api/      the endpoint page and its try-it panel, drawn from the spec
                         (samples.tsx: the sample cards of the right column;
                         more.tsx: "Read more" under an introduction)
src/components/          the diagrams: sequence.tsx, lifecycle.tsx
src/components/mcp.tsx   the MCP server's address, written once, and the snippets drawn from it
style.css                the styles of src/components/api, all under .mapi-
public/                  logo, icon, robots.txt
```

## Add or change a guide

1. Write `src/docs/<name>.mdx`, with the frontmatter the other pages have:
   `title`, `sidebarTitle`, `description`, `icon`, and `prompt`, which records
   what the page was written from.
2. List it in `docs.jsonc`, under the group it belongs to. A page that is not
   listed is not served.
3. Link to other pages by their file, relatively: `[webhooks](./webhooks.mdx)`.
4. After touching a table, run `npx -y @holocron.so/cli diagrams fix <file>`.
5. Run `pnpm build`, and look at the page in both themes.

## Add or change a route in the reference

The reference is drawn from `public/openapi.json`, and the spec is written from
the backend's code: the controllers' doc comments, the DTOs, the served shapes,
`src/common/error-codes.ts`. The code wins over anything written here.

1. Edit `public/openapi.json`. An operation carries `x-mesub`: `href` (where
   its page lives), `limit`, `guide`, and `confirm` on a route that changes
   something, which the try-it panel asks before sending. An error response
   lists its codes in `x-codes`. Links in a description are site paths:
   `/reference/subscriptions/submit`.
2. Run `pnpm reference`. Never edit a generated page.
3. For a new operation, list its page in `docs.jsonc`.
4. Check the spec: `npx -y @redocly/cli lint public/openapi.json`. Every example
   must conform to its schema.

The try-it panel sends to `https://api.mesub.io`. Set `VITE_MESUB_API_URL` when
starting or building to point it elsewhere:
`VITE_MESUB_API_URL=http://localhost:3333 pnpm dev --port 5180`.

## What the pages hold to

- Every claim is checked against the code: the backend for routes, error codes
  and limits, the SDKs for what a call takes and returns. An example that could
  not be checked says so in the pull request.
- Plain prose. No stack of cards, no marketing tone, bold only where a reader
  scans for the word. The home page has four cards, as navigation, and that is
  all.
- Code for Express, Next.js and NestJS, as tabs, wherever the three differ.
- A full answer is collapsed, under "See a full answer", after the short
  example.
- Nothing floats beside the text in a guide: no `Aside`. Notes go in the
  paragraph. The reference's pages keep their samples in the right column.
- It says API key, never secret key, and does not mention a network: a plan has
  no choice of one yet.
- No line of code or table wider than the column: check it in the browser.
- The accent is Mesub's orange, `#f46036`, in both themes.
