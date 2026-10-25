# src/docs/webhooks.mdx

Document webhooks from @https://github.com/Mesub-io/node-sdk (README, section
Webhooks) and @https://github.com/Mesub-io/backend (src/webhooks/webhook-payload.ts,
src/webhooks/webhook-samples.ts, src/pull/pull-events.ts).
Set up the endpoint, the handler in Express, Next.js and NestJS, testing it (webhook.site, then a test event), the
table of events, full event bodies in collapsed blocks, delivery behavior.
What a plan's end date changes, from src/pull/renewal-check.sweep.ts and
src/pull/pull.processor.ts: no renewal_upcoming for a charge that cannot
happen, payment_failed with no retry, ended with plan_ended.
The access events and sequence from backend PR #507, #502 and issue #425:
sent only on an effective access flip, and sent (ACCESS_EVENTS=on,
src/access/access-flips.ts).
