import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, Check, Sparkles, Video, ShieldCheck, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import { usePremium } from "@/hooks/usePremium";
import { api } from "@/lib/api";

const PERKS = [
  { icon: Video, title: "Host live classes", body: "Drop your class onto the catalog and teach Beat's growing community." },
  { icon: Wand2, title: "Watch all premium classes", body: "Unlock every premium-tier tutorial — pageant, drag, editorial, more." },
  { icon: ShieldCheck, title: "Ad-free everything", body: "A cleaner Beat — no sponsored interruptions across feed and try-on." },
  { icon: Sparkles, title: "First in line for drops", body: "Early access to new looks, AR filters, and creator features." },
];

export default function Premium() {
  const [loc, navigate] = useLocation();
  const { isSignedIn } = useAuth();
  const { active, until } = usePremium();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Surface checkout return state from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast({ title: "Welcome to Premium", description: "Your perks are unlocking now." });
      qc.invalidateQueries({ queryKey: ["me", "premium"] });
      // Clean the URL so a refresh doesn't refire the toast.
      window.history.replaceState({}, "", "/premium");
    } else if (params.get("cancelled") === "1") {
      toast({ title: "Checkout cancelled", description: "No charge was made." });
      window.history.replaceState({}, "", "/premium");
    }
  }, [loc, toast, qc]);

  const checkout = useMutation({
    mutationFn: () => api.post<{ url: string }>("/premium/checkout"),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: Error) => toast({ title: "Could not start checkout", description: err.message, variant: "destructive" }),
  });

  const portal = useMutation({
    mutationFn: () => api.post<{ url: string }>("/premium/portal"),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err: Error) => toast({ title: "Could not open portal", description: err.message, variant: "destructive" }),
  });

  const renewal = useMemo(() => until ? new Date(until).toLocaleDateString([], { dateStyle: "long" }) : null, [until]);

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-8 sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 dark:from-amber-500/10 dark:via-rose-500/10 dark:to-violet-500/10 p-6 sm:p-10 text-center relative"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/30 flex items-center justify-center mb-4">
            <Crown className="w-7 h-7 text-amber-700" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Beat Premium</p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold mt-2">Teach. Watch. Glow.</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg mx-auto">
            Unlock the host-a-class feature, every premium tutorial in the catalog, and an ad-free Beat.
          </p>

          {active ? (
            <div className="mt-6 inline-flex flex-col items-center gap-2">
              <div className="px-4 py-2 rounded-full bg-amber-400 text-amber-950 text-xs font-semibold inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> You're Premium {renewal ? `· renews ${renewal}` : ""}
              </div>
              <Button variant="ghost" size="sm" onClick={() => portal.mutate()} disabled={portal.isPending} className="text-xs">
                {portal.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Opening…</> : "Manage subscription"}
              </Button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-2xl font-serif font-semibold">$9.99<span className="text-sm font-sans text-muted-foreground">/month</span></p>
              {isSignedIn ? (
                <Button
                  size="lg"
                  className="rounded-full gap-1.5 bg-amber-400 text-amber-950 hover:bg-amber-300"
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <><Sparkles className="w-4 h-4" /> Upgrade now</>}
                </Button>
              ) : (
                <Button size="lg" className="rounded-full gap-1.5 bg-amber-400 text-amber-950 hover:bg-amber-300" onClick={() => navigate("/sign-in")}>
                  Sign in to upgrade
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">Cancel anytime. Web-only checkout via Stripe.</p>
            </div>
          )}
        </motion.div>

        <section className="mt-10 grid sm:grid-cols-2 gap-3 sm:gap-4">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-2.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Already Premium? <Link href="/host-class" className="text-primary hover:underline">Host your first class →</Link>
        </p>
      </div>
    </div>
  );
}
