import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function EmailPreferencesSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["digest-preferences"],
    queryFn: () => api.get<{ weeklyDigest: boolean }>("/digest/preferences"),
  });
  const [saved, setSaved] = useState(false);
  const update = useMutation({
    mutationFn: (weeklyDigest: boolean) =>
      api.put<{ weeklyDigest: boolean }>("/digest/preferences", { weeklyDigest }),
    onSuccess: (next) => {
      qc.setQueryData(["digest-preferences"], next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    },
    onError: (error: Error) =>
      toast({
        title: "Couldn't update email settings",
        description: error.message,
        variant: "destructive",
      }),
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
          <div>
            <h1 className="font-serif text-2xl">Email preferences</h1>
            <p className="text-xs text-muted-foreground">Choose how Beat keeps you in the loop.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">Weekly tutorial digest</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Get a weekly email with fresh tutorials matched to the looks and techniques you save.
                  You can also turn this off from the unsubscribe link in any digest.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data?.weeklyDigest ?? true}
                aria-label="Weekly tutorial digest"
                disabled={update.isPending}
                onClick={() => update.mutate(!(data?.weeklyDigest ?? true))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  (data?.weeklyDigest ?? true) ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    (data?.weeklyDigest ?? true) ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
            {saved && (
              <p className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Preferences saved
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}