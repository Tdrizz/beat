import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, Heart, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  wigStyles, wigSwatchGradient, getWigColor,
  WIG_LENGTHS, WIG_TEXTURES,
  type WigStyle, type WigLength, type WigTexture,
} from "../lib/wigs";

// Natural base look the "Try this wig" CTA pairs the wig with — keeps the
// face neutral so the hair is the star.
const DEFAULT_TRYON_LOOK = "trend-no-makeup";

function tryOnHref(style: WigStyle, colorId: string) {
  return `/try-on/${DEFAULT_TRYON_LOOK}?wig=${style.id}&color=${colorId}`;
}

function WigCard({ style }: { style: WigStyle }) {
  const [colorId, setColorId] = useState(style.colors[0]?.id ?? "");
  const color = getWigColor(style, colorId);
  const [, navigate] = useLocation();

  return (
    <div className="group rounded-3xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-lg transition-shadow flex flex-col">
      {/* Hero — gradient swatch standing in for the colour */}
      <Link href={`/wigs/${style.id}`}>
        <div
          className="relative h-44 cursor-pointer"
          style={{ background: color ? wigSwatchGradient(color) : "#222" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className="bg-black/45 backdrop-blur-md text-white border-0 text-[10px]">{style.length}</Badge>
            <Badge className="bg-black/45 backdrop-blur-md text-white border-0 text-[10px]">{style.texture}</Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-serif text-xl font-bold text-white drop-shadow-md leading-tight">{style.name}</h3>
            <p className="text-[11px] text-white/80">{color?.name}</p>
          </div>
        </div>
      </Link>

      <div className="p-3.5 flex flex-col gap-3 flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{style.description}</p>

        {/* Suitability tags */}
        <div className="flex flex-wrap gap-1">
          {style.faceShapes.slice(0, 3).map((f) => (
            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{f}</span>
          ))}
          {style.occasions.slice(0, 2).map((o) => (
            <span key={o} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{o}</span>
          ))}
        </div>

        {/* Colour swatch row — tapping updates the hero preview */}
        <div className="flex flex-wrap gap-1.5">
          {style.colors.map((c) => (
            <button
              key={c.id}
              onClick={() => setColorId(c.id)}
              aria-label={c.name}
              aria-pressed={c.id === colorId}
              title={c.name}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                c.id === colorId ? "border-primary scale-110" : "border-border/50"
              }`}
              style={{ background: wigSwatchGradient(c) }}
            />
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 rounded-full gap-1.5 text-xs bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground"
            onClick={() => navigate(tryOnHref(style, colorId))}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try this wig
          </Button>
          <Link href={`/wigs/${style.id}`}>
            <Button size="sm" variant="outline" className="rounded-full text-xs">Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Wigs() {
  const [lengthFilter, setLengthFilter] = useState<WigLength | null>(null);
  const [textureFilter, setTextureFilter] = useState<WigTexture | null>(null);

  const filtered = useMemo(
    () => wigStyles.filter((w) =>
      (!lengthFilter || w.length === lengthFilter) &&
      (!textureFilter || w.texture === textureFilter),
    ),
    [lengthFilter, textureFilter],
  );

  const hasFilter = lengthFilter || textureFilter;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground">Wig Studio</h1>
              <p className="text-muted-foreground mt-1.5 max-w-xl">
                Try on {wigStyles.length} curated styles with AI — bobs, waves, curls, braids and locs in
                every colour. Pick a shade, hit “Try this wig,” and see yourself instantly.
              </p>
            </div>
            <Link href="/my-wigs">
              <Button variant="outline" className="rounded-full gap-1.5">
                <Heart className="w-4 h-4" />
                My Wigs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col gap-2.5 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Filter className="w-3.5 h-3.5" />Length</span>
            {WIG_LENGTHS.map((l) => (
              <button
                key={l}
                onClick={() => setLengthFilter((cur) => (cur === l ? null : l))}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  lengthFilter === l
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/60 text-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Filter className="w-3.5 h-3.5" />Texture</span>
            {WIG_TEXTURES.map((t) => (
              <button
                key={t}
                onClick={() => setTextureFilter((cur) => (cur === t ? null : t))}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  textureFilter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/60 text-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
            {hasFilter && (
              <button
                onClick={() => { setLengthFilter(null); setTextureFilter(null); }}
                className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground hover:bg-muted flex items-center gap-1"
              >
                <X className="w-3 h-3" />Clear
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">{filtered.length} styles</p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No wigs match those filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((style) => (
              <WigCard key={style.id} style={style} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
