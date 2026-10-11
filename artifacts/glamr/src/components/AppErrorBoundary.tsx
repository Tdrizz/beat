import type { ReactNode } from "react";
import { Sentry } from "@/lib/sentry";
import { Button } from "@/components/ui/button";

function Fallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="min-h-screen vanity-bg flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="font-serif text-2xl">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          Sorry about that. We've been notified. Try again, or head back home.
        </p>
        <div className="flex justify-center gap-2">
          <Button className="rounded-full" onClick={resetError}>Try again</Button>
          <Button variant="outline" className="rounded-full" onClick={() => window.location.assign("/")}>Home</Button>
        </div>
      </div>
    </div>
  );
}

/** Catches render errors app-wide, reports them, and shows a recovery screen. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={({ resetError }) => <Fallback resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
