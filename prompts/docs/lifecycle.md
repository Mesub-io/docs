# src/docs/lifecycle.mdx

Document a subscription's statuses and transitions from
@https://github.com/Mesub-io/backend (src/access/access.service.ts,
src/pull/retry-policy.ts, src/pull/pull.constants.ts) and
@https://github.com/Mesub-io/node-sdk (README: What the answer says).
The diagram of @../components/lifecycle.tsx, a table of statuses with access
and payment_status, late payments on paid tiers and on Free, cancelling and
resuming, why a subscription ends, parked seats, and a customer coming back.
A plan's end date from src/plans/plan-end.ts, src/access/access.controller.ts
and src/subscriptions/terms.ts: access stops there for everybody, the last
period is charged in full, and what the dates read in the last period.
Blocked charges from src/pull/blocked.ts, src/access/access.service.ts
(accessCapOf) and src/access/access.controller.ts: whose cause each
blocked_reason is, that the status does not move, and when access ends.
