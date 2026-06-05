import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Replace this page with your app&apos;s home screen.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Auth, API security, and admin panel are wired up. Add your domain modules next.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>API modules live in <code className="text-foreground">apps/api/src/</code>.</p>
          <p>Web pages live in <code className="text-foreground">apps/web/src/pages/</code>.</p>
        </CardContent>
      </Card>
    </section>
  );
}
