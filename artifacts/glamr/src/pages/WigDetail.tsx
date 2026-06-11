import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWigStyle, getWigColor, wigSwatchGradient } from "../lib/wigs";

const DEFAULT_TRYON_LOOK = "trend-no-makeup";

export default function WigDetail() {
  const { wigId } = useParams();
  const [, navigate] = useLocation();
  const style = getWigStyle(wigId);
  const [colorId, setColorId] = useState(style?.colors[0]?.id ?? "");

  if (!style) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-serif mb-4">Wig not found</h2>
          <Link href="/wigs"><Button variant="outline">Back to Wig Studio</Button></Link>
        </div>
      </div>
    );
  }

  const color = getWigColor(style, colorId);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <Link href="/wigs">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />Wig Studio
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Preview */}
          <div
            className="relative rounded-3xl overflow-hidden h-72 md:h-[28rem] border border-border/60 shadow-sm"
            style={{ background: color ? wigSwatchGradient(color) : "#222" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-white/80 text-xs">{color?.name}</p>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{style.length}</Badge>
              <Badge variant="outline">{style.texture}</Badge>
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground">{style.name}</h1>
            <p className="text-sm text-accent font-medium mt-1">{style.vibe}</p>
            <p className="text-foreground/85 leading-relaxed mt-4">{style.description}</p>

            {/* Suitability */}
            <div className="mt-5 space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Flatters</p>
                <div className="flex flex-wrap gap-1.5">
                  {style.faceShapes.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{f} face</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Great for</p>
                <div className="flex flex-wrap gap-1.5">
                  {style.occasions.map((o) => (
                    <span key={o} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{o}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Colour picker */}
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                Colour · <span className="text-foreground">{color?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {style.colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColorId(c.id)}
                    aria-label={c.name}
                    aria-pressed={c.id === colorId}
                    title={c.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      c.id === colorId ? "border-primary scale-110" : "border-border/50"
                    }`}
                    style={{ background: wigSwatchGradient(c) }}
                  />
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-auto pt-6 flex gap-2">
              <Button
                size="lg"
                className="flex-1 rounded-full gap-2 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground"
                onClick={() => navigate(`/try-on/${DEFAULT_TRYON_LOOK}?wig=${style.id}&color=${colorId}`)}
              >
                <Sparkles className="w-5 h-5" />
                Try this wig with AI
              </Button>
              <Link href="/my-wigs">
                <Button size="lg" variant="outline" className="rounded-full gap-1.5">
                  <Heart className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              Photoreal AI render with hairline blending matched to your skin tone
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
