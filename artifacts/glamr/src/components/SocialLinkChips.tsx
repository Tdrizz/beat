import { PLATFORMS, type SocialLinks, SOCIAL_PLATFORMS } from "@/lib/socialLinks";

interface Props {
  links: SocialLinks | undefined | null;
  /** "lg" shows label, "sm" is icon-only chips. */
  size?: "sm" | "lg";
}

/**
 * Read-only renderer for someone's linked social accounts. Every chip is
 * an external `<a target="_blank" rel="noopener">` so we don't proxy clicks
 * through our app and don't leak the user's session as the referrer.
 */
export function SocialLinkChips({ links, size = "sm" }: Props) {
  if (!links) return null;
  const entries = SOCIAL_PLATFORMS
    .map((id) => [id, links[id]] as const)
    .filter((e): e is readonly [typeof e[0], string] => typeof e[1] === "string" && e[1].length > 0);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([id, value]) => {
        const meta = PLATFORMS[id];
        const Icon = meta.icon;
        return (
          <a
            key={id}
            href={meta.toUrl(value)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${meta.label} – open in new tab`}
            className={
              size === "lg"
                ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all text-xs font-medium"
                : "inline-flex items-center justify-center w-9 h-9 rounded-full hover:scale-105 transition-transform shadow-sm " + meta.bg + " " + meta.color
            }
          >
            <span className={size === "lg"
              ? `inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.bg} ${meta.color}`
              : ""
            }>
              <Icon className="w-4 h-4" />
            </span>
            {size === "lg" && (
              <span className="text-foreground">
                {id === "website" ? value.replace(/^https?:\/\//, "").replace(/\/$/, "") : `@${value}`}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
