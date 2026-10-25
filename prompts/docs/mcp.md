# src/docs/mcp.mdx

Document the Mesub MCP server from @https://github.com/Mesub-io/mcp (README,
AGENTS.md, src/server.ts for the instructions, src/tools, src/tools/result.ts
for the advice on each code, test/roles-matrix.spec.ts),
@https://github.com/Mesub-io/backend (src/agent-auth for how a connection
works and its caps, src/agent-routes/agent-scope.ts for AGENT_TOOL_ACCESS
and AGENT_TOOL_PROJECT, src/agent-routes/agent-project.guard.ts for how
`project` is resolved, src/orgs/permissions.ts for the roles,
src/common/error-codes.ts for the codes) and
@https://github.com/Mesub-io/frontend (lib/dashboard/agent-consent.ts and
lib/teams/copy.ts for the consent page's words,
lib/dashboard/agent-connections.ts for the connection lists).
What it is and is not, next to the skills. Connecting, generically: no
product named. A connection reaches an organization, or one project when
pinned. The tools as a table, Read, Act, Prepare, one plain line each,
no parameters. The `project` argument and list_projects, with an example
organization. What each role's agent may do. The codes an agent meets and
what it does next. What it can never do, the limits, cutting a connection,
the risks, a few example requests. The server's address is written once, in
@../components/mcp.tsx.
