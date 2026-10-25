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

## Where it runs

Fly, app `mesub-docs`, from the `Dockerfile`, with no public IP: the Cloudflare
Tunnel brings `docs.mesub.io` to `http://mesub-docs.internal:3000`. `server.mjs`
starts the built site on `::`, which Holocron's own entry does not (it listens on
0.0.0.0, and Fly's private network is IPv6 only). A version tag (`v*`) deploys
it once the build passes and a reviewer approves (job `deploy`, token in the
`production` environment, which takes tags only); `main` only builds.
One site serves both environments.

## Where things are

```text
docs.jsonc               the site: name, colors, logo, the two tabs and their menus
src/index.mdx            the home page
src/docs/*.mdx           the guides, one file per page, served at /docs/<name>
src/reference/*.mdx      the reference's hand-written pages: introduction,
                         authentication, errors, webhooks/overview
src/reference/*/*.mdx    one page per route and per webhook event: GENERATED
public/openapi.json      the description of the public API, served at /openapi.json:
                         a copy of the backend's openapi/v1.json, never edited here
public/openapi.source.json the backend commit, its date and the sha256 of that copy,
                         written by `pnpm spec`; the reference's introduction shows the commit
scripts/spec.mjs         copies the backend's spec into public/openapi.json
scripts/reference.mjs    writes the generated pages from the spec
scripts/check-prompts.mjs fails when a page's prompt is published (run after a build)
prompts/                 what each hand-written page was written from, by its path
src/components/api/      the endpoint page and its try-it panel, drawn from the spec
                         (samples.tsx: the sample cards of the right column;
                         more.tsx: "Read more" under an introduction;
                         source.tsx: the backend commit the spec came from)
src/components/          the diagrams: sequence.tsx, lifecycle.tsx
src/components/mcp.tsx   the MCP server's address, written once, and the snippets drawn from it
style.css                the styles of src/components/api, all under .mapi-
public/                  logo, icon, robots.txt
```

## Add or change a guide

1. Write `src/docs/<name>.mdx`, with the frontmatter the other pages have:
   `title`, `sidebarTitle`, `description` and `icon`. What the page was
   written from goes in `prompts/<same path>.md`, never in the page: Holocron
   publishes a page's whole frontmatter, in the site's data and in the `.md`
   copies, `docs.zip` and what "Ask AI" reads. `pnpm check:prompts`, after a
   build, fails if a prompt is published.
2. List it in `docs.jsonc`, under the group it belongs to. A page that is not
   listed is not served.
3. Link to other pages by their file, relatively: `[webhooks](./webhooks.mdx)`.
4. After touching a table, run `npx -y @holocron.so/cli diagrams fix <file>`.
5. Run `pnpm build` and `pnpm check:prompts`, and look at the page in both
   themes.

## Add or change a route in the reference

The reference is drawn from `public/openapi.json`, a copy of the backend's
`openapi/v1.json`, which the backend's tests hold to its code. The code wins
over anything written here.

1. Change the spec in the backend, then copy it here with `pnpm spec`. It reads
   `../backend/openapi/v1.json` by default; give another path as an argument
   or in `MESUB_OPENAPI`. It refuses a file outside a git repo, untracked,
   or with uncommitted changes, so commit the spec in the backend first;
   `--force` copies such a file anyway and records no commit. It records the
   backend's `HEAD` commit in `public/openapi.source.json`: commit both files.
   `pnpm reference` fails if `public/openapi.json` no longer matches the
   recorded sha256, which is how an edit made here is caught. An operation carries `x-mesub`: `href` (where
   its page lives), `limit`, `guide`, and `confirm` on a route that changes
   something, which the try-it panel asks before sending. An error response
   lists its codes in `x-codes`. Links in a description are site paths:
   `/reference/subscriptions/submit`.
2. Run `pnpm reference`. Never edit a generated page.
3. For a new operation, list its page in `docs.jsonc`.
4. The spec is checked in the backend; here, `pnpm build` checks the pages.

The try-it panel sends to `https://api.mesub.io`. Set `VITE_MESUB_API_URL` when
starting or building to point it elsewhere:
`VITE_MESUB_API_URL=http://localhost:3333 pnpm dev --port 5180`.

## What the pages hold to

- Every claim is checked against the code: the backend for routes, error codes
  and limits, the SDKs for what a call takes and returns. An example that could
  not be checked says so in the pull request.
- Plain prose. No stack of cards, no marketing tone, bold only where a reader
  scans for the word. The home page has five cards, as navigation: four to start,
  one for the AI tools. That is all.
- Code for Express, Next.js and NestJS, as tabs, wherever the three differ.
- A full answer is collapsed, under "See a full answer", after the short
  example.
- Nothing floats beside the text in a guide: no `Aside`. Notes go in the
  paragraph. The reference's pages keep their samples in the right column.
- It says API key, never secret key, and mentions a network only where code
  needs it: production is mainnet, the wallet chain `solana:mainnet`. The
  devnet environment (dev.mesub.io, `https://api-dev.mesub.io`) is named in
  one place, the quickstart's step 0, for test money.
- No line of code or table wider than the column: check it in the browser.
- The accent is Mesub's orange, `#f46036`, in both themes.
