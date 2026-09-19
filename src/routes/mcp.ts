import { createFileRoute } from '@tanstack/react-router'

/**
 * OAuth-protected MCP server (spec.md §4/§7). Nine tools: my_rota,
 * team_rota, my_leave, request_leave, update_rota_notes, faculty_directory,
 * and the staff-only fellow_summary, fellow_reflections and
 * fellow_peer_feedback.
 *
 * Not yet implemented — this returns a clear placeholder rather than a
 * partial MCP handshake, since a half-built OAuth flow would fail silently
 * for clients that try to use it.
 */
export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      ANY: () =>
        new Response(
          JSON.stringify({ error: 'not_implemented', message: 'The MCP server is not yet built.' }),
          { status: 501, headers: { 'content-type': 'application/json' } },
        ),
    },
  },
})
