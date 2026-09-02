import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bookmark, Sparkles } from "lucide-react";
import { api, type SavedCombo } from "@/lib/api";
import { comboDisplayName, resolveCombo } from "@/lib/savedCombos";
import { getLookImage } from "@/lib/lookImages";
import { wigSwatchGradient } from "@/lib/wigs";

export function SavedComboRail() {
  const { data: combos } = useQuery({
    queryKey: ["my-combos"],
    queryFn: () => api.get<SavedCombo[]>("/profiles/me/combos"),
    staleTime: 30_000,
  });
  const resolved = (combos ?? []).map(resolveCombo).filter((item): item is NonNullable<typeof item> => item !== null);
  if (resolved.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-3">
        <Bookmark className="h-3 w-3 text-white/70" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Saved combos</span>
        <span className="text-[10px] text-white/50">{resolved.length}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {resolved.map(({ combo, look, wig, color, href }) => (
          <Link
            key={combo.id}
            href={href}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-black/30 transition-transform hover:scale-105"
            title={`Use saved combo: ${comboDisplayName({ combo, look, wig, color, href })}`}
          >
            <img
              src={getLookImage(look.id, undefined, [look.palette[0] ?? "#888", look.palette[1] ?? "#aaa", look.palette[2] ?? "#666"])}
              alt={comboDisplayName({ combo, look, wig, color, href })}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5">
              <p className="truncate text-[8px] font-semibold text-white">{comboDisplayName({ combo, look, wig, color, href })}</p>
            </div>
            {wig && color && (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border border-white/80"
                style={{ background: wigSwatchGradient(color) }}
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}