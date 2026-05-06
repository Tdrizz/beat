import { ARCHETYPES, type ArchetypeId } from "@/lib/archetypes";

/**
 * Tiny inline badge showing a user's archetype next to their name in
 * feed/comment rows. Two swatches + short name keep it scannable.
 */
export function ArchetypeBadge({ archetype }: { archetype: string | null | undefined }) {
  if (!archetype || !(archetype in ARCHETYPES)) return null;
  const a = ARCHETYPES[archetype as ArchetypeId];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
      title={`${a.name} — ${a.tagline}`}
    >
      <span className="flex">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.palette[1] }} />
        <span className="w-1.5 h-1.5 rounded-full -ml-0.5" style={{ background: a.palette[3] }} />
      </span>
      {a.name.replace(/^The /, "")}
    </span>
  );
}
