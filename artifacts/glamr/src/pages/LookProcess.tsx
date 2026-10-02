import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock3, ExternalLink, Lightbulb, Sparkles } from "lucide-react";
import { ALL_LOOKS_FLAT } from "@/lib/looks";
import { getLookImage } from "@/lib/lookImages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LookStepDiagram } from "@/components/LookStepDiagram";
import { AffiliateProductsForLook } from "@/components/AffiliateProductsForLook";

const ORDER = ["base", "brows", "eyes", "cheeks", "lips"] as const;
type ProcessStep = (typeof ORDER)[number];

const methodCopy: Record<ProcessStep, { product: string; tools: string; method: string; note: string }> = {
  base: {
    product: "Moisturizer, then a foundation or skin tint and concealer chosen to match your own skin tone. Use the look swatch only as a finish/style reference.",
    tools: "Foundation brush or a clean, damp makeup sponge; a small concealer brush if needed.",
    method: "Start with moisturized skin. Work a thin layer from the centre of the face outward, then spot-conceal only where you want more coverage. Add another light layer only where needed; set the areas that crease or become shiny rather than powdering everywhere.",
    note: "Complexion shade is personal: never use the look palette as a foundation shade match.",
  },
  brows: {
    product: "A brow pencil for hair-like definition, powder for a softer fill, or clear/tinted gel when the look calls for groomed or brushed-up brows.",
    tools: "Spoolie plus a fine angled brush for powder or pomade.",
    method: "Brush hairs into their natural direction first. Add small, light strokes where you want the selected shape or density, concentrating on the arch and tail only as the look requires. Comb through again to soften any hard marks.",
    note: "Keep the silhouette from the look instruction; use a lighter hand at the front of the brow.",
  },
  eyes: {
    product: "Shadow, liner, or both in the selected look’s named shade and finish. Pick a pencil, cream, or powder formula that suits the exact placement.",
    tools: "Flat shader brush to press colour on; fluffy blending brush for edges; small detail or angled brush for lash-line work.",
    method: "Follow the instruction’s shape and colour placement: press colour where it needs the strongest payoff, then soften only the edges with a clean fluffy brush. Use the small brush for precise liner or lower-lash details. Build in thin passes so the shape stays intentional.",
    note: "Let the placement in this look lead; blending should soften edges, not erase its graphic or smoky shape.",
  },
  cheeks: {
    product: "Choose blush, bronzer, contour, or highlighter to match the instruction. A cream or liquid works well with fingers or a sponge; powder pairs with a soft cheek brush.",
    tools: "Soft, angled cheek brush for powder, or fingertips/damp sponge for cream textures.",
    method: "Pick up very little product and tap off excess. For blush, begin on the apples and sweep upward and outward, adapting that path to the look’s drape or contour direction. Build gradually and diffuse the edges; place bronzer or highlight only where the selected instruction calls for it.",
    note: "If the instruction says minimal or no blush, keep the cheek quiet rather than adding colour by default.",
  },
  lips: {
    product: "The lipstick, tint, or gloss finish and shade named by the look; add coordinating liner when definition, overlining, or long wear is part of the style.",
    tools: "Lip liner and a tapered lip brush for a clean cupid’s bow and precise edges.",
    method: "Outline if the look benefits from definition, then fill from the centre toward the corners. Use the tapered brush to refine the edge. Blot once for a softer or longer-wearing finish, then layer again if you want more depth; skip blotting when a wet gloss finish is the point.",
    note: "Keep the selected look’s lip shape and finish; liner can refine without changing the colour story.",
  },
};

const sources = [
  ["M·A·C — Makeup Brushes & Tools", "https://www.maccosmetics.com/collections/brushes"],
  ["Bobbi Brown — Foundation for Combination Skin", "https://www.bobbibrowncosmetics.com/how-to-foundation-combination-skin"],
  ["Bobbi Brown — How to: Everyday Eye", "https://www.bobbibrowncosmetics.com/how-to-everyday-eye"],
  ["Bobbi Brown — Cheeks & Lips How-To", "https://www.bobbibrown.co.uk/makeup-lesson-cheeks-lips"],
  ["Bobbi Brown — Do Your Makeup Like a Pro", "https://www.bobbibrown.co.uk/how-do-your-makeup-pro"],
];

export default function LookProcess() {
  const { lookId } = useParams();
  const look = ALL_LOOKS_FLAT.find((item) => item.id === lookId);
  const [completed, setCompleted] = useState<string[]>([]);

  if (!look) {
    return (
      <main className="min-h-[70dvh] flex items-center justify-center px-6 text-foreground" data-testid="status-look-not-found">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[.2em] text-muted-foreground mb-3">Glamr look guide</p>
          <h1 className="text-3xl font-serif mb-4">Look not found</h1>
          <p className="text-muted-foreground mb-6">This tutorial may have moved, or the look link is incomplete.</p>
          <Link href="/"><Button variant="outline">Return home</Button></Link>
        </div>
      </main>
    );
  }

  const toggleDone = (id: string) =>
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const orderedSteps = ORDER.map((key) => look.steps[key]);
  const cover = getLookImage(look.id, import.meta.env.BASE_URL, look.palette.slice(0, 3) as [string, string, string]);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground pb-24" data-testid={`page-look-process-${look.id}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <Link href={`/looks/${look.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-to-look">
          <ArrowLeft className="w-4 h-4" /> Back to the look
        </Link>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-10">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8 lg:gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
            <p className="text-xs uppercase tracking-[.24em] text-primary font-bold mb-3">At the vanity · the look, step by step</p>
            <h1 className="font-serif text-4xl sm:text-6xl leading-[1.03] mb-5" data-testid="text-process-title">{look.name}<span className="block text-primary">The Process</span></h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-6">{look.description}</p>
            <div className="flex flex-wrap items-center gap-2 mb-7">
              <Badge className="bg-primary text-primary-foreground">{look.mood}</Badge>
              <Badge variant="outline">{look.difficulty}</Badge>
              <Badge variant="outline" className="gap-1"><Clock3 className="w-3 h-3" /> {look.timeEstimate}</Badge>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 flex gap-3 max-w-xl">
              <Lightbulb className="w-5 h-5 shrink-0 text-primary mt-0.5" />
              <p className="text-sm leading-relaxed"><strong className="text-foreground">Vanity note.</strong> Follow the look’s colour and shape, but make every complexion product work for your own skin tone and comfort.</p>
            </div>
          </motion.div>
          <div className="relative max-w-md mx-auto w-full">
            <div className="absolute -inset-3 rounded-[2rem] border border-primary/20 rotate-2" aria-hidden="true" />
            <img src={cover} alt={`${look.name} makeup look reference`} className="relative w-full aspect-[4/3] object-cover rounded-[1.5rem] shadow-lg border border-border" data-testid="img-process-look-reference" />
            <div className="absolute bottom-3 left-3 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-semibold">Look reference · finish & colour story</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10" aria-label="Tutorial progress">
        <div className="flex items-center justify-between gap-4 border-y border-border py-4">
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-muted-foreground">Your progress</p>
            <p className="font-semibold mt-1" data-testid="text-progress-count">{completed.length} of 5 steps complete</p>
          </div>
          <div className="flex gap-1.5" aria-label={`${completed.length} of 5 steps complete`}>
            {ORDER.map((key) => <span key={key} className={`h-1.5 w-8 sm:w-12 rounded-full ${completed.includes(key) ? "bg-primary" : "bg-muted"}`} />)}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="space-y-7">
          {orderedSteps.map((step, index) => {
            const key = ORDER[index];
            const guide = methodCopy[key];
            const shade = step.colorName || (key === "base" ? "Complexion finish" : "Look shade");
            return (
              <motion.article
                key={step.id}
                id={`step-${key}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: .35 }}
                className="grid md:grid-cols-[.82fr_1.18fr] overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                data-testid={`card-process-step-${key}`}
              >
                <div className="relative min-h-[220px] md:min-h-[290px] bg-[#efe7da] p-3 sm:p-5">
                  <LookStepDiagram step={key} color={step.color} stepName={step.name} />
                  <div className="absolute left-5 top-5 rounded-full bg-background/90 text-xs uppercase tracking-[.15em] font-bold px-3 py-1.5">Step 0{index + 1}</div>
                </div>
                <div className="p-5 sm:p-8 lg:p-9">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[.2em] text-primary font-bold mb-1">{key}</p>
                      <h2 className="font-serif text-3xl sm:text-4xl">{step.name}</h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
                      <span className="w-3 h-3 rounded-full border border-foreground/20" style={{ backgroundColor: step.color === "transparent" ? "transparent" : step.color || "hsl(var(--muted))" }} />
                      {shade}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl border-l-2 border-primary bg-muted/50 p-4">
                    <p className="text-[11px] uppercase tracking-[.15em] text-muted-foreground font-bold mb-1">From this look</p>
                    <p className="leading-relaxed font-medium" data-testid={`text-look-instruction-${key}`}>{step.instruction}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mt-5">
                    <div>
                      <p className="text-xs uppercase tracking-[.13em] text-muted-foreground font-bold mb-1.5">Product to reach for</p>
                      <p className="text-sm leading-relaxed">{guide.product}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[.13em] text-muted-foreground font-bold mb-1.5">Tool / brush</p>
                      <p className="text-sm leading-relaxed">{guide.tools}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-[.13em] text-muted-foreground font-bold mb-1.5">How to apply</p>
                      <p className="text-sm leading-relaxed">{guide.method}</p>
                    </div>
                  </div>
                  {key === "base" && <p className="mt-4 text-xs text-muted-foreground italic">{guide.note}</p>}
                  <div className="mt-6 flex flex-wrap gap-3 items-center justify-between border-t border-border pt-4">
                     <span className="text-xs text-muted-foreground">{key === "base" ? "Finish cue" : "Shade cue"}: <strong className="text-foreground">{shade}</strong></span>
                    <Button
                      type="button"
                      variant={completed.includes(key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDone(key)}
                      aria-pressed={completed.includes(key)}
                      data-testid={`button-complete-${key}`}
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      {completed.includes(key) ? "Done" : "Mark done"}
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center rounded-3xl bg-secondary/70 border border-border p-6 sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-primary font-bold mb-2">Your kit, your version</p>
            <h2 className="font-serif text-3xl mb-2">Make the look yours.</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">Use the exact colour direction above as a guide, then choose formulas and complexion shades that suit you. No single product is required to recreate the technique.</p>
          </div>
          <Link href={`/try-on/${look.id}`} data-testid="link-process-try-on">
            <Button size="lg" className="rounded-full px-6"><Sparkles className="w-4 h-4 mr-2" /> Preview this look</Button>
          </Link>
        </div>
        <AffiliateProductsForLook lookId={look.id} />
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="border-t border-border pt-7">
          <h2 className="font-serif text-2xl mb-2">Technique notes & further reading</h2>
          <p className="text-sm text-muted-foreground mb-5">Brush handling, placement and layering references used to shape this practical guide.</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {sources.map(([label, href], index) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm font-semibold underline decoration-primary/50 underline-offset-4 hover:text-primary" data-testid={`link-technique-source-${index + 1}`}>
                  <span>{label}</span><ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}