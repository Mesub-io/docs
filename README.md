# Mesub docs

The documentation of [Mesub](https://mesub.io), recurring payments on Solana.
It is a [Holocron](https://holocron.so) site: MDX pages, one config file, and
two diagrams drawn as React components.

## Run it

```bash
pnpm install
pnpm dev --port 5180   # http://localhost:5180
pnpm build             # fails on a broken internal link
pnpm start             # serves the build
```

## Where things are

```text
docs.jsonc             the site: name, colors, logo, and the menu
src/index.mdx          the home page
src/docs/*.mdx         one file per page, served at /docs/<name>
src/components/        the diagrams: sequence.tsx, lifecycle.tsx
public/                logo, icon, robots.txt
```

| Page                  | File                    |
| --------------------- | ----------------------- |
| How it works          | `docs/how-it-works.mdx` |
| First subscriber      | `docs/quickstart.mdx`   |
| Check access          | `docs/access.mdx`       |
| Lifecycle             | `docs/lifecycle.mdx`    |
| Webhooks              | `docs/webhooks.mdx`     |
| React widget          | `docs/react.mdx`        |
| Subscribe, by hand    | `docs/subscribe.mdx`    |
| Manage, by hand       | `docs/manage.mdx`       |
| Test your integration | `docs/testing.mdx`      |
| Pricing and limits    | `docs/pricing.mdx`      |
| API reference         | `docs/api.mdx`          |

## Add or change a page

1. Write `src/docs/<name>.mdx`, with the frontmatter the other pages have:
   `title`, `sidebarTitle`, `description`, `icon`, and `prompt`, which records
   what the page was written from.
2. List it in `docs.jsonc`, under the group it belongs to. A page that is not
   listed is not served.
3. Link to other pages by their file, relatively: `[webhooks](./webhooks.mdx)`.
4. After touching a table, run `npx -y @holocron.so/cli diagrams fix <file>`.
5. Run `pnpm build`, and look at the page in both themes.

## What the pages hold to

- **Every claim is checked against the code**: the backend for routes, error
  codes and limits, the SDKs for what a call takes and returns. An example that
  could not be checked says so in the pull request.
- **Plain prose.** No stack of cards, no marketing tone, bold only where a
  reader scans for the word.
- **Code for Express, Next.js and NestJS**, as tabs, wherever the three differ.
- **A full answer is collapsed**, under "See a full answer", after the short
  example.
- **Nothing floats beside the text.** Notes go in the paragraph.
- It says **API key**, never secret key, and does not mention a network: a plan
  has no choice of one yet.
- No line of code or table wider than the column: check it in the browser.

## For AI agents

Holocron serves these on its own, nothing to maintain:

- `/llms.txt`, the index, and `/llms-full.txt`, everything in one file
- every page as Markdown at its address plus `.md`
- `/docs.zip` and `/sitemap.xml`

`public/robots.txt` allows everything and names the sitemap.

## Hosting

Not hosted yet. The dashboard and `robots.txt` point at `docs.mesub.io`.
