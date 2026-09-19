import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

/** Scaffolding placeholder: lists what a screen will do, sourced from spec.md, until it's built. */
export function ComingSoon({ items }: { items: ReadonlyArray<string> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="stat-label text-xs">Coming next</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
