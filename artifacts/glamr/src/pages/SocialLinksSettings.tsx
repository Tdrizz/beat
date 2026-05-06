import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Check, Loader2, ExternalLink } from "lucide-react";
import { api, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLATFORMS, SOCIAL_PLATFORMS, normaliseSocialValue,
  validateSocialValue, type SocialLinks, type SocialPlatform,
} from "@/lib/socialLinks";

export default function SocialLinksSettings() {
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Profile>("/profiles/me"),
  });

  const [draft, setDraft] = useState<Record<SocialPlatform, string>>(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, ""])) as Record<SocialPlatform, string>,
  );
  const [errors, setErrors] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [saved, setSaved] = useState(false);

  // Hydrate draft when profile loads (guarded so user edits aren't clobbered
  // by background refetches — only seed on first arrival of the data).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!me || hydrated) return;
    const next = { ...draft };
    for (const p of SOCIAL_PLATFORMS) next[p] = me.socialLinks?.[p] ?? "";
    setDraft(next);
    setHydrated(true);
  }, [me, hydrated, draft]);

  const dirty = useMemo(() => {
    if (!me) return false;
    return SOCIAL_PLATFORMS.some(
      (p) => normaliseSocialValue(p, draft[p]) !== (me.socialLinks?.[p] ?? ""),
    );
  }, [me, draft]);

  const save = useMutation({
    mutationFn: async () => {
      // Validate all fields first.
      const errs: Partial<Record<SocialPlatform, string>> = {};
      const body: SocialLinks = {};
      for (const p of SOCIAL_PLATFORMS) {
        const e = validateSocialValue(p, draft[p]);
        if (e) { errs[p] = e; continue; }
        const v = normaliseSocialValue(p, draft[p]);
        if (v) body[p] = v;
      }
      setErrors(errs);
      if (Object.keys(errs).length > 0) throw new Error("invalid");
      return api.put<Profile>("/profiles/me/social-links", body);
    },
    onSuccess: (next) => {
      // Update both cache slots — the per-handle profile fetch on
      // /u/:handle uses queryKey ["profile", handle] and would otherwise
      // serve stale chips immediately after save.
      qc.setQueryData(["me"], next);
      qc.setQueryData(["profile", next.handle], next);
      qc.invalidateQueries({ queryKey: ["profile", next.handle] });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
  });

  function update(p: SocialPlatform, v: string) {
    setDraft((d) => ({ ...d, [p]: v }));
    if (errors[p]) setErrors((e) => ({ ...e, [p]: undefined }));
  }

  if (isLoading) {
    return <div className="min-h-screen vanity-bg flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!me) {
    return (
      <div className="min-h-screen vanity-bg flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-muted-foreground">Create a profile first.</p>
        <Link href="/onboarding"><Button>Set up profile</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/u/${me.handle}`}>
            <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl">Linked accounts</h1>
            <p className="text-xs text-muted-foreground">
              Connect your other socials so people can find you everywhere.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {SOCIAL_PLATFORMS.map((p) => {
            const meta = PLATFORMS[p];
            const Icon = meta.icon;
            const value = draft[p];
            const err = errors[p];
            const valid = value.trim() && !err;
            return (
              <div key={p} className="bg-card border border-border rounded-2xl p-3 flex items-start gap-3">
                <span className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${meta.bg} ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <label htmlFor={`s-${p}`} className="block text-sm font-semibold">{meta.label}</label>
                  <div className="flex items-stretch border border-border rounded-md overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring">
                    {meta.prefix && (
                      <span className="px-2 text-[11px] text-muted-foreground bg-muted/40 inline-flex items-center border-r border-border whitespace-nowrap">
                        {meta.prefix}
                      </span>
                    )}
                    <Input
                      id={`s-${p}`}
                      value={value}
                      onChange={(e) => update(p, e.target.value)}
                      placeholder={meta.placeholder}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 rounded-none"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>
                  {err ? (
                    <p className="text-[11px] text-destructive">{err}</p>
                  ) : valid ? (
                    <a
                      href={meta.toUrl(normaliseSocialValue(p, value))}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Preview <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-20 sm:bottom-4 flex justify-end">
          <Button
            size="lg"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
            className="rounded-full shadow-lg gap-2"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
             saved ?           <><Check className="w-4 h-4" /> Saved</> :
                               "Save links"}
          </Button>
        </div>
      </main>
    </div>
  );
}
