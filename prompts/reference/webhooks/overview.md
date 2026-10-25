# src/reference/webhooks/overview.mdx

Reference of webhook deliveries from @https://github.com/Mesub-io/backend
(openapi/v1.json, webhooks section, and the signature during a secret
rotation from the 494-secret-overlap branch). The access events from
backend PR #507 and issue #425: sent only on an effective access flip, and
sent (ACCESS_EVENTS=on, src/access/access-flips.ts).
The request Mesub sends, its headers and signature, the event object, the
list of events linking to each one's page, and what counts as received.
Leave the handler code to the guide.
