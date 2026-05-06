import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, Clock } from "lucide-react";
import { useArchetype } from "@/hooks/useArchetype";
import { ARCHETYPES, pickFg, type ArchetypeId } from "@/lib/archetypes";
import { api } from "@/lib/api";

interface Challenge {
  archetype: ArchetypeId;
  week: number;
  headline: string;
  body: string;
  endsAt: string;
}

/**
 * Weekly archetype challenge banner. Server-driven so we can rotate copy
 * without shipping a frontend release. Hidden when the user hasn't taken
 * the quiz — without an archetype the banner has nothing to say.
 */
export function WeeklyChallenge({ compact = false }: { compact?: boolean }) {
  const { archetype } = useArchetype();
  const { data } = useQuery<Challenge>({
    queryKey: ["challenge", archetype],
    queryFn: () => api.get<Challenge>(`/archetype/challenge?archetype=${archetype}`),
    enabled: !!archetype,
    staleTime: 60 * 60 * 1000, // 1h — copy doesn't change mid-session
  });
  if (!archetype || !data) return null;
  const arch = ARCHETYPES[archetype];
  const isLight = pickFg(arch.palette[1] ?? arch.palette[0]) === "light";
  const daysLeft = Math.max(0, Math.ceil((new Date(data.endsAt).getTime() - Date.now()) / 86400000));
  return (
    <Link href="/upload">
      <div
        className={`rounded-2xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-shadow ${compact ? "" : "mb-4"}`}
        style={{ background: `linear-gradient(135deg, ${arch.palette[0]} 0%, ${arch.palette[2]} 100%)` }}
      >
        <div className={`p-4 flex items-center gap-3 ${isLight ? "text-white" : "text-black/85"}`}>
          <Trophy className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] uppercase tracking-[0.22em] mb-0.5 ${isLight ? "text-white/65" : "text-black/55"}`}>
              This week's Iola challenge
            </div>
            <p className="font-serif text-base font-bold leading-tight">{data.headline}</p>
            <p className={`text-xs leading-snug mt-0.5 ${isLight ? "text-white/80" : "text-black/70"}`}>{data.body}</p>
          </div>
          <div className={`text-[10px] flex items-center gap-1 shrink-0 ${isLight ? "text-white/70" : "text-black/60"}`}>
            <Clock className="w-3 h-3" />
            {daysLeft}d
          </div>
        </div>
      </div>
    </Link>
  );
}
