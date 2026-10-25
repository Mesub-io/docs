# src/docs/manage.mdx

Document managing a subscription without the widget from
@https://github.com/Mesub-io/node-sdk (README: Cancel, resume and close from
your server; A subscription's payments).
The three actions in a table, the build, sign and send, confirm steps, what
a cancellation does to access, the refusals, and listing payments with a
full example in a collapsed block.
Explain what an attempt says from @https://github.com/Mesub-io/backend
(prisma/schema.prisma, src/pull/pull.processor.ts, src/pull/pull.errors.ts,
src/pull/pull.constants.ts, src/pull/retry-policy.ts,
src/subscriptions/server-subscriptions.service.ts,
src/access/late-reason.ts): the four outcomes, every reason by whose doing
it is, and each remaining field with when it is null.
`amount_usd` from src/prices/price.processor.ts: priced at the instant of
the charge, paid or not, written once.
