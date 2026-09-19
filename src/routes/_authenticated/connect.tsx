import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/connect')({ component: ConnectPage })

function ConnectPage() {
  return (
    <>
      <PageHeader
        title="Connect"
        description="Instructions for connecting Claude, Claude Code or ChatGPT to the ED Portal's MCP server."
      />
      <ComingSoon
        items={[
          'OAuth-protected MCP server at /mcp',
          'my_rota, team_rota, my_leave, request_leave, update_rota_notes, faculty_directory',
          'Staff-only: fellow_summary, fellow_reflections, fellow_peer_feedback',
        ]}
      />
    </>
  )
}
