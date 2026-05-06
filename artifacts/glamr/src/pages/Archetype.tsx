import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, Heart, ArrowRight, Download, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARCHETYPE_QUIZ, scoreQuiz } from "../lib/archetypeQuiz";
import {
  ARCHETYPES,
  type ArchetypeId,
  lookMatchesArchetype,
  pickFg,
} from "../lib/archetypes";
import { useArchetype } from "../hooks/useArchetype";
import { allCompleteLooks, allEyeLooks, allLipLooks } from "../lib/looks";
import { getLookImage } from "../lib/lookImages";

/**
 * Archetype quiz page — 5 questions, animated transitions, and a result
 * panel that personalises the existing catalogue. The result page recommends
 * looks already in our catalogue (via mood matchers) so we don't have to
 * regenerate content; we're just adding a personality lens on top.
 */
export default function ArchetypePage() {
  const { archetype: savedId, setArchetype, clear, takenAt } = useArchetype();

  // If the user already has an archetype, jump straight to the result
  // page; the "Retake" button on the result resets state.
  const [view, setView] = useState<"quiz" | "result">(() => (savedId ? "result" : "quiz"));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<ArchetypeId | null>>(
    () => Array(ARCHETYPE_QUIZ.length).fill(null),
  );

  const currentArchetypeId: ArchetypeId | null =
    view === "result" ? (savedId ?? scoreQuiz(answers)) : null;

  const handleAnswer = (id: ArchetypeId) => {
    setAnswers((a) => {
      const next = [...a];
      next[step] = id;
      return next;
    });
    // Auto-advance after a short beat so the click registers visually.
    window.setTimeout(() => {
      if (step < ARCHETYPE_QUIZ.length - 1) {
        setStep((s) => s + 1);
      } else {
        const winner = scoreQuiz(answers.map((v, i) => (i === step ? id : v)));
        setArchetype(winner);
        setView("result");
      }
    }, 240);
  };

  // Undo: rewind one step AND clear that step's answer so the auto-advance
  // doesn't immediately re-fire if the user re-picks the same option.
  const handleUndo = () => {
    setStep((s) => {
      const prev = Math.max(0, s - 1);
      setAnswers((a) => {
        const next = [...a];
        next[prev] = null;
        return next;
      });
      return prev;
    });
  };

  const handleRetake = () => {
    clear();
    setAnswers(Array(ARCHETYPE_QUIZ.length).fill(null));
    setStep(0);
    setView("quiz");
  };

  const progress = ((step + 1) / ARCHETYPE_QUIZ.length) * 100;
  const q = ARCHETYPE_QUIZ[step];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            ← Home
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Iola
          </div>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          The Iola archetype test
        </h1>

        {view === "quiz" && q && (
          <QuizView
            step={step}
            total={ARCHETYPE_QUIZ.length}
            progress={progress}
            question={q}
            selected={answers[step]}
            onAnswer={handleAnswer}
            onBack={handleUndo}
            onForward={() => setStep((s) => Math.min(ARCHETYPE_QUIZ.length - 1, s + 1))}
          />
        )}

        {view === "result" && currentArchetypeId && (
          <ResultView
            archetypeId={currentArchetypeId}
            takenAt={takenAt}
            onRetake={handleRetake}
          />
        )}
      </div>
    </div>
  );
}

// ── Quiz view ───────────────────────────────────────────────────────────────

function QuizView({
  step, total, progress, question, selected, onAnswer, onBack, onForward,
}: {
  step: number;
  total: number;
  progress: number;
  question: typeof ARCHETYPE_QUIZ[number];
  selected: ArchetypeId | null;
  onAnswer: (id: ArchetypeId) => void;
  onBack: () => void;
  onForward: () => void;
}) {
  return (
    <>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
          <span>Question {step + 1} of {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-2">
            {question.prompt}
          </h1>
          {question.hint && (
            <p className="text-sm text-muted-foreground mb-7">{question.hint}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.answers.map((a) => {
              const isSelected = selected === a.archetype;
              return (
                <button
                  key={a.label}
                  onClick={() => onAnswer(a.archetype)}
                  className={`group text-left rounded-2xl border px-4 py-4 transition-all hover:border-primary hover:shadow-md flex items-start gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border bg-card"
                  }`}
                >
                  {a.emoji && (
                    <span className="text-2xl leading-none mt-0.5" aria-hidden>{a.emoji}</span>
                  )}
                  <span className="text-sm sm:text-base leading-snug font-medium">
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={onBack}
          className="rounded-full gap-1.5 text-muted-foreground"
          title="Undo last answer"
        >
          <Undo2 className="w-4 h-4" /> Undo
        </Button>
        <Button
          variant="ghost"
          disabled={!selected || step === total - 1}
          onClick={onForward}
          className="rounded-full gap-1.5 text-muted-foreground"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}

// ── Result view ─────────────────────────────────────────────────────────────

function ResultView({
  archetypeId, takenAt, onRetake,
}: {
  archetypeId: ArchetypeId;
  takenAt: number | null;
  onRetake: () => void;
}) {
  const arch = ARCHETYPES[archetypeId];

  // Pull recommended looks from the existing catalogue using mood matchers.
  // We dedupe across complete/eye/lip pools and cap at 8 so the section
  // doesn't dominate the page.
  const recommended = useMemo(() => {
    const pool = [...allCompleteLooks, ...allEyeLooks, ...allLipLooks];
    const seen = new Set<string>();
    const out: typeof pool = [];
    for (const l of pool) {
      if (seen.has(l.id)) continue;
      if (lookMatchesArchetype(l, arch)) {
        seen.add(l.id);
        out.push(l);
        if (out.length >= 8) break;
      }
    }
    return out;
  }, [arch]);

  const dateText = takenAt
    ? new Date(takenAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero — pick text colour from gradient luminance so dark
          archetype palettes (Siren / Rebel / Muse) stay readable. */}
      {(() => {
        const fg = pickFg(arch.palette[1] ?? arch.palette[0]);
        const isLight = fg === "light"; // light text on dark bg
        const heading = isLight ? "text-white" : "text-black/90";
        const sub = isLight ? "text-white/85" : "text-black/80";
        const muted = isLight ? "text-white/70" : "text-black/75";
        const eyebrow = isLight ? "text-white/65" : "text-black/60";
        const pillBg = isLight ? "bg-white/15 text-white/90" : "bg-black/15 text-black/85";
        return (
          <div className="relative overflow-hidden rounded-3xl border border-border p-7 sm:p-10 mb-8"
            style={{
              background: `linear-gradient(135deg, ${arch.palette[0]} 0%, ${arch.palette[2]} 100%)`,
            }}
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-30 blur-3xl"
                 style={{ background: arch.palette[3] }} />
            <div className="relative z-10">
              <div className={`text-[10px] uppercase tracking-[0.22em] mb-2 ${eyebrow}`}>
                You are
              </div>
              <h2 className={`font-serif text-4xl sm:text-6xl font-bold leading-none mb-3 ${heading}`}>
                {arch.name}
              </h2>
              <p className={`text-base sm:text-lg italic mb-5 ${sub}`}>{arch.tagline}</p>
              <p className={`text-sm sm:text-base max-w-prose leading-relaxed ${muted}`}>
                {arch.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {arch.vibes.map((v) => (
                  <span key={v} className={`text-[11px] uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm ${pillBg}`}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Palette */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl font-bold mb-3">Your signature palette</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These are the shades the app will weight when recommending lipsticks,
          eyeshadows and blushes for you. Layered with your face shape and skin
          tone, they shape every suggestion.
        </p>
        <div className="grid grid-cols-5 gap-2 rounded-2xl overflow-hidden border border-border">
          {arch.palette.map((hex) => (
            <div key={hex} className="aspect-square relative group">
              <div className="absolute inset-0" style={{ background: hex }} />
              <div className="absolute bottom-1 inset-x-0 text-center text-[10px] font-mono text-white/95 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                {hex}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Personalised tips */}
      <section className="mb-10">
        <h2 className="font-serif text-2xl font-bold mb-3">Tips made for you</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Five rules to live by, area-by-area. These get woven into your guided
          tutorials and your AI try-on prompt so the look reads as
          unmistakably <span className="italic">{arch.name.toLowerCase()}</span>.
        </p>
        <div className="space-y-3">
          {arch.tips.map((t) => (
            <div key={t.area} className="rounded-xl border border-border bg-card p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary mb-1">
                {t.area}
              </div>
              <p className="text-sm leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended looks */}
      {recommended.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl font-bold mb-3">
            Looks for {arch.name.replace("The ", "the ").toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Hand-picked from the catalogue based on your archetype.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recommended.map((l) => (
              <Link key={l.id} href={`/looks/${l.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted relative">
                    <img
                      src={getLookImage(l.id)}
                      alt={l.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white font-serif text-sm font-bold leading-tight drop-shadow">{l.name}</p>
                      <p className="text-white/80 text-[10px] italic">{l.mood}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {dateText ? <>Quiz taken {dateText}.</> : <>Your archetype is saved on this device.</>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => downloadArchetypeCard(archetypeId)} className="rounded-full gap-1.5">
            <Download className="w-3.5 h-3.5" /> Save card
          </Button>
          <Button variant="outline" onClick={onRetake} className="rounded-full gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Retake
          </Button>
          <Link href="/match">
            <Button className="rounded-full gap-1.5 bg-primary text-primary-foreground">
              <Heart className="w-3.5 h-3.5" /> Find my looks
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Shareable card export ───────────────────────────────────────────────────
//
// Renders the archetype hero into a square PNG via a one-shot OffscreenCanvas
// (falls back to an in-memory <canvas>). Vanilla canvas keeps the bundle
// dep-free — html2canvas would add ~50KB and we only need a static layout.

function downloadArchetypeCard(id: ArchetypeId) {
  const arch = ARCHETYPES[id];
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background gradient — same diagonal as the on-screen hero.
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, arch.palette[0]);
  grad.addColorStop(1, arch.palette[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow in the upper right corner.
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.18, 30, W * 0.85, H * 0.18, 380);
  glow.addColorStop(0, hexA(arch.palette[3], 0.55));
  glow.addColorStop(1, hexA(arch.palette[3], 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const fg = pickFg(arch.palette[1] ?? arch.palette[0]);
  const isLight = fg === "light";
  const textCol = isLight ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.88)";
  const subCol = isLight ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.65)";

  ctx.textAlign = "left";
  ctx.fillStyle = subCol;
  ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("BEAT · IOLA ARCHETYPE", 80, 140);

  ctx.fillStyle = textCol;
  ctx.font = "bold 130px ui-serif, Georgia, serif";
  ctx.fillText(arch.name, 80, 320);

  ctx.fillStyle = subCol;
  ctx.font = "italic 38px ui-serif, Georgia, serif";
  ctx.fillText(arch.tagline, 80, 380);

  // Palette swatches — five circles in a row.
  const swatchY = 540, swatchR = 56, gap = 36;
  arch.palette.forEach((hex, i) => {
    const x = 80 + swatchR + i * (swatchR * 2 + gap);
    ctx.beginPath();
    ctx.arc(x, swatchY, swatchR, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.strokeStyle = isLight ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  // Description — wrap by hand at ~38 chars per line, max 4 lines.
  ctx.fillStyle = textCol;
  ctx.font = "400 34px ui-sans-serif, system-ui, sans-serif";
  const lines = wrap(ctx, arch.description, W - 160, 4);
  lines.forEach((ln, i) => ctx.fillText(ln, 80, 720 + i * 50));

  // Footer signature.
  ctx.fillStyle = subCol;
  ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Take the test → beat.app/archetype", 80, H - 80);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iola-${id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else cur = test;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last) lines[maxLines - 1] = last.replace(/\s*\S*$/, "…");
  }
  return lines;
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
