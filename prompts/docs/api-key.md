# src/docs/api-key.mdx

Explain how a merchant gets the API key of a project: where it is created in
the dashboard, that it is shown once and stored hashed, where it goes on the
server, how to check it with GET /v1/project, what rotating does, and the two
401 codes. Short, no marketing.

MESUB_BASE_URL (@mesub/node 0.1.3, node-sdk src/options.ts): the API address
the key is sent to, set beside the key only when Mesub gives another one, and
only to Mesub or a trusted proxy. Never name which other address.
