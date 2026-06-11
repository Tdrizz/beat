import { useLocation } from "wouter";
import { Home as HomeIcon, Sparkles, Plus, GraduationCap, MessageCircle } from "lucide-react";
import { useAuth } from "@clerk/react";

// Auth + onboarding screens get the full viewport — no bottom bar.
const HIDE_ON = ["/sign-in", "/sign-up", "/onboarding"];

// Five-slot bottom tab bar shown on phones only (`sm:hidden`). The middle
// slot is the primary creator action — promoted with a filled circle so
// it reads as the obvious thumb target. We deliberately keep this to the
// 5 most-used destinations; everything else lives in the hamburger Sheet
// on TopNav (Brands, Affiliate, Profile, Sign-out).
type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
  authed?: boolean;
};
const TABS: Tab[] = [
  { href: "/",         label: "Home",  icon: HomeIcon },
  { href: "/feed",     label: "Feed",  icon: Sparkles },
  { href: "/upload",   label: "Share", icon: Plus,           primary: true },
  { href: "/classes",  label: "Classes", icon: GraduationCap },
  { href: "/messages", label: "DMs",   icon: MessageCircle,  authed: true },
];

export function MobileTabBar() {
  const [loc, navigate] = useLocation();
  const { isSignedIn } = useAuth();
  if (HIDE_ON.some((p) => loc.startsWith(p))) return null;
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 h-14">
        {TABS.map(({ href, label, icon: Icon, primary, authed }) => {
          const active = href === "/" ? loc === "/" : loc.startsWith(href);
          // Routes that require auth bounce signed-out visitors to /sign-in.
          const target = authed && !isSignedIn ? "/sign-in" : href;
          // We render plain <button>s and call wouter's `navigate()` on
          // click rather than wrapping <button> inside <Link> (which would
          // produce invalid <a><button> markup and break activation).
          if (primary) {
            return (
              <li key={href} className="flex items-end justify-center">
                <button
                  type="button"
                  onClick={() => navigate(target)}
                  aria-label={label}
                  className="-mt-5 mb-1 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                >
                  <Icon className="w-5 h-5" />
                </button>
              </li>
            );
          }
          return (
            <li key={href} className="flex">
              <button
                type="button"
                onClick={() => navigate(target)}
                aria-current={active ? "page" : undefined}
                className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="leading-none">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
