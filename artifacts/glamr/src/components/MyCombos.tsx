import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Sparkles, Trash2, Loader2, Pencil, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { api, type SavedCombo } from "@/lib/api";
import { resolveCombo, comboDisplayName } from "@/lib/savedCombos";
import { getLookImage } from "@/lib/lookImages";
import { wigSwatchGradient } from "@/lib/wigs";
import { useToast } from "@/hooks/use-toast";

// "My combos" — the signed-in user's saved makeup-look + wig pairings, each a
// deep link back into try-on with the selections pre-applied. Only rendered on
// the user's own profile (combos are private to their account).
export function MyCombos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const { data: combos, isLoading } = useQuery({
    queryKey: ["my-combos"],
    queryFn: () => api.get<SavedCombo[]>("/profiles/me/combos"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.del(`/profiles/me/combos/${id}`),
    onSuccess: (_d, id) => {
      queryClient.setQueryData<SavedCombo[]>(["my-combos"], (prev) =>
        (prev ?? []).filter((c) => c.id !== id),
      );
    },
    onError: (e) =>
      toast({
        title: "Couldn't remove combo",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      }),
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put<SavedCombo>(`/profiles/me/combos/${id}`, { name }),
    onSuccess: (updated) => {
      queryClient.setQueryData<SavedCombo[]>(["my-combos"], (prev) =>
        (prev ?? []).map((combo) => combo.id === updated.id ? updated : combo),
      );
      setEditingId(null);
    },
    onError: (e) =>
      toast({
        title: "Couldn't rename combo",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      }),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.put<SavedCombo[]>("/profiles/me/combos/order", { ids }),
    onSuccess: (updated) => queryClient.setQueryData(["my-combos"], updated),
    onError: (e) =>
      toast({
        title: "Couldn't reorder combos",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      }),
  });

  if (isLoading || !combos || combos.length === 0) return null;

  const resolved = combos.map(resolveCombo).filter((r): r is NonNullable<typeof r> => r !== null);
  if (resolved.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-serif text-lg">My combos</h2>
        <span className="text-xs text-muted-foreground">({resolved.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {resolved.map(({ combo, look, wig, color, href }, index) => (
          <div
            key={combo.id}
            className="group relative rounded-2xl overflow-hidden border border-border bg-card"
          >
            <Link href={href} className="block">
              <div className="relative aspect-[4/5]">
                <img
                  src={getLookImage(look.id, undefined, [
                    look.palette[0] ?? "#888",
                    look.palette[1] ?? "#aaa",
                    look.palette[2] ?? "#666",
                  ])}
                  alt={look.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Wig swatch chip (bottom-left) — visual cue of the paired wig. */}
                {wig && color && (
                  <div
                    className="absolute bottom-2 left-2 w-7 h-7 rounded-full border-2 border-white/80 shadow-md"
                    style={{ background: wigSwatchGradient(color) }}
                    title={`${wig.name} / ${color.name}`}
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pt-6 pb-2">
                  <p className="text-[11px] font-semibold text-white leading-tight">
                    {comboDisplayName({ combo, look, wig, color, href })}
                  </p>
                  <p className="text-[10px] text-white/75 leading-tight truncate">
                    {wig ? `${wig.name}${color ? ` · ${color.name}` : ""}` : "My hair"}
                  </p>
                </div>
              </div>
            </Link>
            {editingId === combo.id ? (
              <form
                className="absolute inset-x-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-background/95 p-1 shadow-lg"
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = draftName.trim();
                  if (name) rename.mutate({ id: combo.id, name });
                }}
              >
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  aria-label="Combo name"
                  autoFocus
                  maxLength={80}
                  className="min-w-0 flex-1 bg-transparent px-1 text-xs outline-none"
                />
                <button type="submit" aria-label="Save combo name" className="p-1 text-primary" disabled={rename.isPending}>
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Cancel renaming" className="p-1 text-muted-foreground" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="absolute top-1.5 left-1.5 rounded-full bg-black/55 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-primary"
                onClick={() => { setEditingId(combo.id); setDraftName(comboDisplayName({ combo, look, wig, color, href })); }}
                aria-label={`Rename ${comboDisplayName({ combo, look, wig, color, href })}`}
                title="Rename combo"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="absolute right-1.5 bottom-1.5 flex gap-1">
              <button
                type="button"
                aria-label={`Move ${comboDisplayName({ combo, look, wig, color, href })} up`}
                disabled={index === 0 || reorder.isPending}
                onClick={() => {
                  const ids = resolved.map((item) => item.combo.id);
                  [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                  reorder.mutate(ids);
                }}
                className="rounded-full bg-black/55 p-1 text-white backdrop-blur-sm disabled:opacity-30"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label={`Move ${comboDisplayName({ combo, look, wig, color, href })} down`}
                disabled={index === resolved.length - 1 || reorder.isPending}
                onClick={() => {
                  const ids = resolved.map((item) => item.combo.id);
                  [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
                  reorder.mutate(ids);
                }}
                className="rounded-full bg-black/55 p-1 text-white backdrop-blur-sm disabled:opacity-30"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={() => del.mutate(combo.id)}
              disabled={del.isPending}
              className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/55 hover:bg-destructive text-white backdrop-blur-sm transition-colors"
               aria-label={`Remove combo ${comboDisplayName({ combo, look, wig, color, href })}`}
              title="Remove combo"
            >
              {del.isPending && del.variables === combo.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
