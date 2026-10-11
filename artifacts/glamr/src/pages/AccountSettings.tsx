import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import { ArrowLeft, Ban, Link2, Mail, Shield, Trash2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePremium } from "@/hooks/usePremium";
import { useFaceConsent } from "@/hooks/useFaceConsent";

const LINKS = [
  { href: "/settings/social", label: "Linked accounts", icon: Link2 },
  { href: "/settings/email", label: "Email preferences", icon: Mail },
  { href: "/settings/blocked", label: "Blocked accounts", icon: Ban },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: Shield },
];

export default function AccountSettings() {
  const { signOut } = useClerk();
  const premium = usePremium();
  const faceConsent = useFaceConsent();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const remove = useMutation({
    mutationFn: () => api.del("/me", { confirm: "DELETE" }),
    onSuccess: async () => {
      // The Clerk user is already gone server-side; clear the local session.
      await signOut().catch(() => undefined);
      window.location.assign("/");
    },
  });

  return (
    <div className="min-h-screen vanity-bg">
      <main className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-2xl">Account</h1>
        </div>

        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 p-4 text-sm hover:bg-muted/40">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Camera & face data</h2>
          {faceConsent.granted ? (
            <>
              <p className="text-xs leading-relaxed text-muted-foreground">
                You agreed to camera and face-photo use for try-on and Look Match
                {faceConsent.grantedAt ? ` on ${new Date(faceConsent.grantedAt).toLocaleDateString()}` : ""}.
                Withdrawing turns those features off until you agree again.
              </p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => faceConsent.withdraw()}>
                Withdraw consent
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Not given. We'll ask before the camera is used.</p>
          )}
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-destructive">Delete account</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Permanently deletes your profile, posts, comments, messages, saved looks, try-on photos and uploads,
            and your sign-in. {premium.active ? "Your Premium subscription will be cancelled immediately. " : ""}
            This can't be undone.
          </p>
          <Button variant="destructive" className="rounded-full gap-1.5" onClick={() => setOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete my account
          </Button>
        </section>
      </main>

      <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTyped(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything you've shared will be removed and you'll be signed out. Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            autoCapitalize="characters"
            aria-label="Type DELETE to confirm"
          />
          {remove.isError && (
            <p className="text-sm text-destructive">{(remove.error as Error).message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={typed !== "DELETE" || remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "Deleting…" : "Delete forever"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
