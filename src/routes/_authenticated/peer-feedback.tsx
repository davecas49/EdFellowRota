import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/layout/coming-soon'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/_authenticated/peer-feedback')({
  component: PeerFeedbackPage,
})

function PeerFeedbackPage() {
  return (
    <>
      <PageHeader
        title="Peer feedback"
        description="Give and view feedback for past education and Sim sessions only."
      />
      <ComingSoon
        items={[
          'Strengths, development areas and a 1–5 rating against a past session',
          'Guest invites by NHS email, with copy-link or mailto',
          'View feedback given and received',
        ]}
      />
    </>
  )
}
