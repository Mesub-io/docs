# src/docs/subscribe.mdx

Document subscribing without the widget from
@https://github.com/Mesub-io/node-sdk (README: Subscribe from your server,
Errors; src/subscriptions.ts for the shape of what create answers).
Five steps as Steps: create, sign the terms, ask for the transaction, sign
it, submit. What create
returns in a collapsed block, how long submit takes and what to do when its
outcome is unknown, the refusals, and reading a subscription back.
The order of the steps, terms first then a fresh transaction, from
@https://github.com/Mesub-io/backend
(src/subscriptions/server-subscriptions.controller.ts: the comments of
POST /v1/subscriptions/:id/transaction and of the submit route).
The terms of a plan with an end date, copied from
@https://github.com/Mesub-io/backend (src/subscriptions/terms.ts and its
spec): the last charge in full, and the single charge.
Showing a plan's token and its dollar value from
@https://github.com/Mesub-io/docs/issues/49 (the contract of `token` and
`amount_usd`) and @https://github.com/Mesub-io/backend
(src/prices/price.processor.ts for when an attempt is priced).
