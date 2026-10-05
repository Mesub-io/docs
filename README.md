# Mesub docs

The documentation site of Mesub, built with [Holocron](https://holocron.so).
Pages are MDX files in `src/`; the site's name, colors and navigation are in
`docs.jsonc`.

```bash
pnpm install
pnpm dev     # http://localhost:5173
pnpm build   # fails on a broken internal link
```

A page that is not listed in `docs.jsonc` is not served.
