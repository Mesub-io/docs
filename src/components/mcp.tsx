// The MCP page's snippets, drawn from one address so that it is written once.
import { CodeBlock } from '@holocron.so/vite/mdx'

// PLACEHOLDER: the server is not hosted yet. The only value to change when it is.
const MCP_URL = 'https://mcp.mesub.io/mcp'

/** The address alone, on a line to copy. */
export function McpAddress() {
  return (
    <CodeBlock lang="text" showLineNumbers={false}>
      {MCP_URL}
    </CodeBlock>
  )
}

/** The entry of a tool configured by a JSON file. */
export function McpJson() {
  const entry = { mcpServers: { mesub: { url: MCP_URL } } }
  return (
    <CodeBlock lang="json" showLineNumbers={false}>
      {JSON.stringify(entry, null, 2)}
    </CodeBlock>
  )
}

/** The shape of the command of a tool configured from a terminal. */
export function McpCommand() {
  return (
    <CodeBlock lang="bash" showLineNumbers={false}>
      {`your-tool mcp add --transport http \\
  mesub ${MCP_URL}`}
    </CodeBlock>
  )
}
