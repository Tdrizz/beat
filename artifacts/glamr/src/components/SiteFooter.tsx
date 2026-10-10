import { Link, useLocation } from "wouter";

// Sign-in/up render their own legal line; onboarding stays chromeless.
const HIDE_ON = ["/sign-in", "/sign-up", "/onboarding"];

export function SiteFooter() {
  const [loc] = useLocation();
  if (HIDE_ON.some((p) => loc.startsWith(p))) return null;
  return (
    <footer className="border-t border-border/40 mt-8 pb-20 sm:pb-6 pt-6 text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>© {new Date().getFullYear()} Beat</span>
        <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">Terms of Service</Link>
      </div>
    </footer>
  );
}

/** "By continuing you agree to…" line for the auth screens. */
export function LegalConsentLine({ action }: { action: string }) {
  return (
    <p className="text-xs text-muted-foreground text-center max-w-sm">
      By {action} you agree to our{" "}
      <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link> and{" "}
      <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
    </p>
  );
}
