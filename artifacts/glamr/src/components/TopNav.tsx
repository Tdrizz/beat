import { Link, useLocation } from "wouter";
import { UserButton, useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Sparkles, MessageCircle, Upload as UploadIcon, Store, BarChart3 } from "lucide-react";
import { NotificationsBell } from "@/components/NotificationsBell";

const links = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/feed", label: "Feed", icon: Sparkles },
  { href: "/upload", label: "Share", icon: UploadIcon },
  { href: "/messages", label: "DMs", icon: MessageCircle },
  { href: "/brands", label: "Shop", icon: Store },
];

export function TopNav() {
  const [loc] = useLocation();
  const { isSignedIn } = useAuth();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/">
          <span className="font-serif text-xl font-bold text-primary cursor-pointer select-none">Beat</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = loc === href || (href !== "/" && loc.startsWith(href));
            return (
              <Link key={href} href={href}>
                <Button
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full gap-1.5 text-xs whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              <NotificationsBell />
              <Link href="/affiliate">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <BarChart3 className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <Link href="/sign-in">
              <Button size="sm" className="rounded-full">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
