import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton, useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home as HomeIcon, Sparkles, MessageCircle, Upload as UploadIcon,
  Store, BarChart3, Wand2, Menu, ScanFace, Heart, BookOpen, Calendar, Brush, Apple, Link2, Users,
  Coffee, BookHeart, Gem,
} from "lucide-react";
import { NotificationsBell } from "@/components/NotificationsBell";

// Primary nav — also rendered as bottom tab bar on mobile (subset).
const PRIMARY = [
  { href: "/",          label: "Home",   icon: HomeIcon },
  { href: "/feed",      label: "Feed",   icon: Sparkles },
  { href: "/archetype", label: "Iola",   icon: Wand2 },
  { href: "/upload",    label: "Share",  icon: UploadIcon },
  { href: "/messages",  label: "DMs",    icon: MessageCircle },
  { href: "/friends",   label: "Friends", icon: Users },
  { href: "/brands",    label: "Shop",   icon: Store },
] as const;

// Secondary destinations — surfaced inside the mobile drawer + as a small
// row on desktop right of the user button, so they stay one tap away
// without crowding the main nav rail.
type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  authed?: boolean;
};
const SECONDARY: NavItem[] = [
  { href: "/tools",     label: "Brushes & tools", icon: Brush },
  { href: "/nutrition", label: "Skin nutrition",  icon: Apple },
  { href: "/match",     label: "Look match",   icon: ScanFace },
  { href: "/skincare",  label: "Skincare",     icon: Heart },
  { href: "/diary",     label: "Skin diary",   icon: BookOpen },
  { href: "/special-products", label: "Specials", icon: Calendar },
  { href: "/slay-bible",  label: "Slay Bible",    icon: BookHeart },
  { href: "/teapot",     label: "The Teapot",    icon: Coffee },
  { href: "/esthetician-hub", label: "Esthetician Hub", icon: Gem },
  { href: "/affiliate", label: "Creator stats", icon: BarChart3, authed: true },
  { href: "/settings/social", label: "Linked accounts", icon: Link2, authed: true },
];

// Routes that should render fully-chromeless — no global header.
const HIDE_ON = ["/sign-in", "/sign-up", "/onboarding"];

export function TopNav() {
  // All hooks must run unconditionally on every render — early-returning
  // before useState caused "Rendered fewer hooks than expected" when
  // navigating between hidden (/sign-in) and visible routes.
  const [loc] = useLocation();
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  if (HIDE_ON.some((p) => loc.startsWith(p))) return null;

  const isActive = (href: string) => (href === "/" ? loc === "/" : loc.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-gradient-to-b from-background/95 via-background/85 to-background/75 border-b border-border/40 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_20px_-12px_rgba(190,80,140,0.25)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          {/* Mobile: hamburger trigger left of the wordmark so it falls
              naturally under the left thumb. Desktop hides it. */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden -ml-1"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="p-5 pb-3 border-b border-border/60">
                <SheetTitle className="font-serif text-2xl text-primary text-left">Beat</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-2">
                <p className="px-5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground py-2">Browse</p>
                {PRIMARY.map((l) => (
                  <DrawerItem key={l.href} {...l} active={isActive(l.href)} onClick={() => setOpen(false)} />
                ))}
                <p className="px-5 mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground py-2">More</p>
                {SECONDARY
                  .filter((l) => !l.authed || isSignedIn)
                  .map((l) => (
                    <DrawerItem key={l.href} {...l} active={isActive(l.href)} onClick={() => setOpen(false)} />
                  ))}
              </div>
              <div className="p-4 border-t border-border/60 flex items-center justify-between">
                {isSignedIn ? (
                  <>
                    <span className="text-xs text-muted-foreground">Signed in</span>
                    <UserButton />
                  </>
                ) : (
                  <Link href="/sign-in" className="w-full">
                    <Button className="w-full rounded-full" onClick={() => setOpen(false)}>Sign in</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="shrink-0">
            <span className="font-serif text-xl font-bold text-primary cursor-pointer select-none">Beat</span>
          </Link>

          {/* Desktop primary nav — hidden on mobile (mobile uses the
              bottom MobileTabBar + the drawer above). */}
          <nav className="hidden sm:flex items-center gap-1 mx-auto">
            {PRIMARY.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant={isActive(href) ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full gap-1.5 text-xs whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            {isSignedIn ? (
              <>
                <NotificationsBell />
                <Link href="/affiliate" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Creator stats">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="hidden sm:block"><UserButton /></div>
              </>
            ) : (
              <Link href="/sign-in" className="hidden sm:block">
                <Button size="sm" className="rounded-full">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function DrawerItem({
  href, label, icon: Icon, active, onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  // Use wouter's navigate via useLocation rather than nesting <button>
  // inside <Link> (which would render invalid <a><button> markup).
  const [, navigate] = useLocation();
  return (
    <button
      type="button"
      onClick={() => { onClick(); navigate(href); }}
      aria-current={active ? "page" : undefined}
      className={`w-full px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
        active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/60"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
