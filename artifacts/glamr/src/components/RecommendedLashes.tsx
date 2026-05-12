import { recommendLashesForLook, type LookLike } from "@/lib/lashes";
import { Eye } from "lucide-react";

interface Props {
  look: LookLike;
}

/**
 * Surfaces 3 lash styles that pair well with the given look using the
 * tag-based matcher. Hidden when no styles match (rather than showing
 * generic recommendations) so users only see actual matches.
 */
export function RecommendedLashes({ look }: Props) {
  const matches = recommendLashesForLook(look, 3);
  if (matches.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-xl font-bold">Recommended lashes</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        These lash styles pair beautifully with this look's energy.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {matches.map((l) => (
          <div
            key={l.id}
            className="rounded-xl border border-border overflow-hidden bg-card hover:border-primary/40 transition-all"
          >
            <div className={`h-20 bg-gradient-to-br ${l.swatch} flex items-center justify-center`}>
              <span className="font-serif font-bold text-white text-lg drop-shadow">
                {l.name}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground leading-snug mb-2">{l.blurb}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span className="uppercase tracking-wider font-semibold">{l.finish}</span>
                <span>{l.difficulty}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
