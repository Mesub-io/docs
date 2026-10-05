# Mesub docs

The documentation of [Mesub](https://mesub.io), recurring payments on Solana.

Mesub charges a customer's wallet on a schedule without holding their funds.
The customer approves a plan once, Mesub pulls the price to the merchant's
wallet at every period, and the merchant's server asks Mesub who has access.
These pages explain how to build on it.

## What is in it

**Guides**

| Page                       | What it covers                                                              |
| -------------------------- | --------------------------------------------------------------------------- |
| First subscriber           | A plan, an API key, the server routes and a subscribe button, in four steps |
| How it works               | The flow from a click to a renewal, and the on-chain accounts behind it     |
| API key                    | Creating the key, putting it on a server, rotating it                       |
| Check access               | `hasAccess`, the guards, `GET /v1/access`, its answer and its errors        |
| Lifecycle                  | Every status, late payments and retries, cancelling, why one ends           |
| Webhooks                   | The endpoint, the handler, testing it, the events and their bodies          |
| React widget               | The subscribe and manage buttons of `@mesub/react`                          |
| Subscribe from your server | Create, sign in the browser, submit, without the widget                     |
| Manage from your server    | Cancel, resume, close, and a subscription's payments                        |
| Test your integration      | The fake Mesub of `@mesub/node/testing`                                     |
| Pricing and limits         | The tiers, what counts toward a limit, the API's rate limits                |

**API reference**

One page per route and per webhook event, with its parameters, its answers,
its error codes, samples in cURL, `@mesub/node` and `fetch`, and a panel to try
the request from the page. It is drawn from one OpenAPI file, served at
`/openapi.json`.

Code examples are given for Express, Next.js and NestJS wherever the three
differ.

## The SDKs it documents

- [`@mesub/node`](https://github.com/Mesub-io/node-sdk), for your server. It is
  enough on its own.
- [`@mesub/react`](https://github.com/Mesub-io/react-sdk), optional: the
  subscribe and manage buttons for your pages.

## For AI agents

The whole documentation is readable as plain Markdown:

- `/llms.txt` is the index, and `/llms-full.txt` holds every page in one file.
- Each page is also served as Markdown at its own address followed by `.md`.

## Who writes it

This documentation is written and maintained by the Mesub team. It is built
with [Holocron](https://holocron.so).
