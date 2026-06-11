import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sparkles, Trash2, Loader2 } from "lucide-react";
import { api, type SavedCombo } from "@/lib/api";
import { resolveCombo, comboLabel } from "@/lib/savedCombos";
import { getLookImage } from "@/lib/lookImages";
import { wigSwatchGradient } from "@/lib/wigs";
import { useToast } from "@/hooks/use-toast";

// "My combos" — the signed-in user's saved makeup-look + wig pairings, each a
// deep link back into try-on with the selections pre-applied. Only rendered on
// the user's own profile (combos are private to their account).
export function MyCombos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        {resolved.map(({ combo, look, wig, color, href }) => (
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
                  <p className="text-[11px] font-semibold text-white leading-tight">{look.name}</p>
                  <p className="text-[10px] text-white/75 leading-tight truncate">
                    {wig ? `${wig.name}${color ? ` · ${color.name}` : ""}` : "My hair"}
                  </p>
                </div>
              </div>
            </Link>
            <button
              onClick={() => del.mutate(combo.id)}
              disabled={del.isPending}
              className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/55 hover:bg-destructive text-white backdrop-blur-sm transition-colors"
              aria-label={`Remove combo ${comboLabel({ combo, look, wig, color, href })}`}
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
