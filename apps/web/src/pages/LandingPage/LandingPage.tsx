import { Link } from 'react-router-dom';
import { Button } from '@repo/ui';

const appName = import.meta.env.VITE_APP_NAME?.trim() || 'App';

export function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{appName}</h1>
        <p className="max-w-md text-muted-foreground">
          Internal app starter — sign in to continue.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/signin">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/signup">Create account</Link>
        </Button>
      </div>
    </main>
  );
}
