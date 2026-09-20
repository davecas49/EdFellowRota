import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export function StatTile({
  label,
  value,
  detail,
}: {
  label: string
  value: number | string
  detail?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="stat-label text-xs">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {value}
          {detail && (
            <span className="text-base font-normal text-muted-foreground">
              {' '}
              {detail}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
