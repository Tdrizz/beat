import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { allLooks, eyeLooks, lipLooks, trendLooks, moreEyeLooks, moreLipLooks } from "../lib/looks";
import { useCamera } from "../hooks/useCamera";
import { useAITryOn } from "../hooks/useAITryOn";
import { useStreak } from "../hooks/useStreak";
import { AITryOnModal } from "../components/AITryOnModal";
import { VoiceGuide } from "../components/VoiceGuide";
import { AvatarSelector, AvatarFace, type Avatar } from "../components/AvatarSelector";
import {
  universalBaseProducts, universalEyeshadowProducts, universalBrowProducts,
  universalLipProducts, universalBlushProducts, type ProductOption
} from "../lib/productRecommendations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Camera as CameraIcon, ChevronLeft, ChevronRight,
  CheckCircle2, Play, User, ShoppingBag, ChevronDown, ChevronUp,
  ExternalLink, Youtube, Sparkles, Image as ImageIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ALL_LOOKS = [
  ...allLooks, ...eyeLooks, ...lipLooks,
  ...trendLooks, ...moreEyeLooks, ...moreLipLooks,
];

const STEP_ORDER = ["base", "brows", "eyes", "cheeks", "lips"] as const;
type StepKey = typeof STEP_ORDER[number];

const STEP_PRODUCTS: Record<StepKey, ProductOption[]> = {
  base:   universalBaseProducts,
  brows:  universalBrowProducts,
  eyes:   universalEyeshadowProducts,
  cheeks: universalBlushProducts,
  lips:   universalLipProducts,
};

const STEP_TOOLS: Record<StepKey, string> = {
  base:   "Damp beauty blender or stippling brush",
  brows:  "Micro brow pencil + spoolie brush",
  eyes:   "Flat shader brush, crease brush, blending brush",
  cheeks: "Large fluffy blush brush",
  lips:   "Lip liner + lipstick or lip brush",
};

// ── Product Options Panel ─────────────────────────────────────────────────────

function ProductPanel({ stepKey }: { stepKey: StepKey }) {
  const [open, setOpen] = useState(false);
  const products = STEP_PRODUCTS[stepKey].slice(0, 4);
  const tool = STEP_TOOLS[stepKey];

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ShoppingBag className="w-3 h-3" />
        {open ? "Hide" : "Show"} product options
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-muted-foreground">🖌️ Tool: </span>
                <span className="text-xs font-medium text-foreground">{tool}</span>
              </div>
              {products.map(p => (
                <div key={`${p.brand}-${p.name}`} className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/50">
                  <div className="w-6 h-6 rounded-full shrink-0 border border-background shadow-sm mt-0.5" style={{ backgroundColor: p.hex }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground leading-tight">{p.brand}</span>
                      <span className="text-xs font-bold text-primary shrink-0">{p.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{p.name}</p>
                    <span className={`text-xs mt-0.5 inline-block px-1.5 py-px rounded-full ${
                      p.priceRange === "Budget" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                      p.priceRange === "Mid" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    }`}>{p.priceRange}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Guided overlay panel (step-by-step instructions over the camera) ─────────

function GuidedOverlayPanel({
  look, currentIdx, onNext, onPrev, onExit,
}: {
  look: ReturnType<typeof ALL_LOOKS.find>;
  currentIdx: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}) {
  if (!look) return null;
  const stepKey = STEP_ORDER[currentIdx];
  const step = look.steps[stepKey];
  const isLast = currentIdx === STEP_ORDER.length - 1;
  const progress = ((currentIdx + 1) / STEP_ORDER.length) * 100;

  const youtubeSearchQuery = `${look.name} ${step.name} makeup tutorial step by step`;

  return (
    <motion.div
      key={currentIdx}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 z-20 p-4"
    >
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/15 overflow-hidden shadow-2xl">
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full border-2 border-white/30"
                style={{ backgroundColor: step.color === "transparent" ? "#555" : step.color }}
              />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                  Step {currentIdx + 1} of {STEP_ORDER.length}
                </p>
                <h3 className="font-serif text-white text-xl font-bold leading-tight">{step.name}</h3>
              </div>
            </div>
            <VoiceGuide
              text={step.instruction}
              stepName={step.name}
              stepNumber={currentIdx + 1}
              totalSteps={STEP_ORDER.length}
              autoPlay
              className="text-white"
            />
          </div>

          <p className="text-sm text-white/90 leading-relaxed mb-3">{step.instruction}</p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">
              🖌️ {STEP_TOOLS[stepKey]}
            </span>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" />
              Watch Tutorial
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex gap-2">
            {currentIdx > 0 && (
              <Button
                size="sm" variant="ghost"
                className="rounded-full text-white/70 hover:text-white hover:bg-white/10 gap-1"
                onClick={onPrev}
              >
                <ChevronLeft className="w-3.5 h-3.5" />Prev
              </Button>
            )}
            <div className="flex-1" />
            <Button
              size="sm" variant="outline"
              className="rounded-full text-xs border-white/20 text-white/60 hover:text-white hover:border-white/40 bg-transparent"
              onClick={onExit}
            >
              Exit
            </Button>
            <Button
              size="sm"
              className="rounded-full gap-1.5 bg-primary text-primary-foreground"
              onClick={onNext}
            >
              {isLast ? (
                <><CheckCircle2 className="w-3.5 h-3.5" />Complete!</>
              ) : (
                <>Next Step<ChevronRight className="w-3.5 h-3.5" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TryOn() {
  const { lookId } = useParams();
  const baseLook = ALL_LOOKS.find((l) => l.id === lookId);

  const { videoRef, isReady, error } = useCamera();

  // Mark today's streak the moment the user opens any try-on. Visiting the
  // try-on page is the "daily action" we want to anchor the habit on; doing
  // it here (not on AI render) means even guided/manual flows count.
  // recordToday is wrapped in useCallback with no deps → stable identity,
  // and is itself idempotent (early-returns if today already recorded).
  const { recordToday } = useStreak();
  useEffect(() => { recordToday(); }, [recordToday]);

  // Guided walkthrough (step-by-step text + voice)
  const [guidedMode, setGuidedMode] = useState(false);
  const [currentGuideStepIdx, setCurrentGuideStepIdx] = useState(0);

  // Avatar (decorative reference face — independent of camera)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  // AI photoreal try-on
  const aiTryon = useAITryOn();
  const [aiTryonOpen, setAiTryonOpen] = useState(false);
  const lastResultUrl = useRef<string | null>(null);
  if (aiTryon.result?.imageUrl) lastResultUrl.current = aiTryon.result.imageUrl;

  const runAITryon = () => {
    if (!baseLook) return;
    setAiTryonOpen(true);
    aiTryon.run({ video: videoRef.current, look: baseLook });
  };
  const closeAITryon = () => {
    // Don't reset() — we keep the last result so the user can re-open it
    // via the image button in the top bar. A subsequent run() will overwrite
    // the state cleanly.
    setAiTryonOpen(false);
  };

  const startGuidedMode = () => { setGuidedMode(true); setCurrentGuideStepIdx(0); };
  const exitGuidedMode  = () => { setGuidedMode(false); };
  const nextGuideStep   = () => {
    if (currentGuideStepIdx >= STEP_ORDER.length - 1) { setGuidedMode(false); return; }
    setCurrentGuideStepIdx(i => i + 1);
  };
  const prevGuideStep   = () => setCurrentGuideStepIdx(i => Math.max(0, i - 1));

  const handleAvatarSelect = (avatar: Avatar | null) => {
    setSelectedAvatar(avatar);
    setSelectedAvatarId(avatar?.id ?? null);
  };

  if (!baseLook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-serif mb-4">Look not found</h2>
          <Link href="/"><Button variant="outline">Return Home</Button></Link>
        </div>
      </div>
    );
  }

  const stepsList = Object.values(baseLook.steps);
  const isGenerating = aiTryon.state === "capturing" || aiTryon.state === "generating";

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden flex flex-col md:flex-row">

      {/* ── Camera Area ─────────────────────────────────────────────────────── */}
      <div className="relative flex-grow h-full bg-zinc-950 overflow-hidden z-0">
        <div className="absolute inset-0 z-10 pointer-events-none vanity-camera-glow" />

        <video
          ref={videoRef}
          style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          autoPlay playsInline muted
        />

        {/* Avatar — bottom right corner when selected */}
        <AnimatePresence>
          {selectedAvatar && !guidedMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 16 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-24 right-4 z-20 bg-black/60 backdrop-blur-md rounded-2xl p-2 border border-white/20"
            >
              <AvatarFace avatar={selectedAvatar} size={72} showMakeup />
              <p className="text-center text-xs text-white/60 mt-1">{selectedAvatar.nationality}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guided mode overlay panel */}
        <AnimatePresence>
          {guidedMode && (
            <GuidedOverlayPanel
              look={baseLook}
              currentIdx={currentGuideStepIdx}
              onNext={nextGuideStep}
              onPrev={prevGuideStep}
              onExit={exitGuidedMode}
            />
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {!isReady && !error && (
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-primary"
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <h3 className="font-serif text-2xl font-bold">Warming up the camera…</h3>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center p-6">
            <CameraIcon className="w-16 h-16 text-destructive mb-4" />
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Camera Access Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Link href={`/looks/${baseLook.id}`}><Button variant="outline">Go Back</Button></Link>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
          <Link href={`/looks/${baseLook.id}`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>

          <div className="flex flex-col items-center gap-1.5">
            <h2 className="font-serif text-xl font-bold text-white tracking-wide drop-shadow-md">{baseLook.name}</h2>
            <div className="flex items-center gap-1.5">
              {baseLook.palette.slice(0, 5).map((c, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/40" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost" size="icon"
              className="rounded-full text-white hover:bg-white/20"
              onClick={() => setShowAvatarSelector(true)}
              title="Choose avatar"
            >
              <User className="w-5 h-5" />
            </Button>
            {lastResultUrl.current && (
              <Button
                variant="ghost" size="icon"
                className="rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/10"
                onClick={() => setAiTryonOpen(true)}
                title="View last AI try-on"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Primary AI Try-On FAB */}
        {!guidedMode && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5">
            <Button
              onClick={runAITryon}
              disabled={!isReady || isGenerating}
              className="rounded-full gap-2 px-7 py-7 text-base font-bold shadow-2xl bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground hover:opacity-95 disabled:opacity-60"
              title="Generate a photoreal AI try-on"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Painting your look…</>
              ) : (
                <><Sparkles className="w-5 h-5" />Try this look with AI</>
              )}
            </Button>
            <p className="text-[11px] text-white/60 font-medium tracking-wide">
              Hold still — we'll generate a photoreal preview
            </p>
          </div>
        )}

        <AITryOnModal
          open={aiTryonOpen}
          state={aiTryon.state}
          imageUrl={aiTryon.result?.imageUrl ?? lastResultUrl.current ?? null}
          error={aiTryon.error}
          lookName={baseLook.name}
          onClose={closeAITryon}
          onRetry={runAITryon}
        />

        <AnimatePresence>
          {showAvatarSelector && (
            <AvatarSelector
              selectedId={selectedAvatarId}
              onSelect={handleAvatarSelect}
              onClose={() => setShowAvatarSelector(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Side Panel ───────────────────────────────────────────────────────── */}
      <div className="w-full md:w-96 bg-card/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-border flex flex-col z-20 h-[48vh] md:h-full shrink-0">

        {/* Look story */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">About this Look</h3>
            <Badge variant="outline" className="text-[10px]">{baseLook.difficulty} · {baseLook.timeEstimate}</Badge>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{baseLook.description}</p>
        </div>

        {/* Guided mode toggle */}
        <div className="px-4 py-3 border-b border-border shrink-0 bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm font-semibold">Step-by-Step Guide</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Voice walkthrough while you do your makeup</p>
            </div>
            {guidedMode ? (
              <Button size="sm" variant="outline" className="text-xs rounded-full" onClick={exitGuidedMode}>Exit</Button>
            ) : (
              <Button size="sm" className="text-xs rounded-full gap-1" onClick={startGuidedMode}>
                <Play className="w-3 h-3" />Start
              </Button>
            )}
          </div>
          {guidedMode && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Step {currentGuideStepIdx + 1} of {STEP_ORDER.length}</span>
                <span>{Math.round(((currentGuideStepIdx + 1) / STEP_ORDER.length) * 100)}%</span>
              </div>
              <Progress value={((currentGuideStepIdx + 1) / STEP_ORDER.length) * 100} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Steps list (instructional) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Look Breakdown</h4>
            <span className="text-xs text-muted-foreground">{stepsList.length} steps</span>
          </div>
          {stepsList.map((step, i) => {
            const stepKey = step.id as StepKey;
            const isCurrent = guidedMode && STEP_ORDER[currentGuideStepIdx] === step.id;
            return (
              <div
                key={step.id}
                className={`space-y-1.5 transition-all duration-300 rounded-2xl ${isCurrent ? "bg-primary/5 p-3 -mx-1 ring-1 ring-primary/30" : guidedMode ? "opacity-50 px-3" : "px-1"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[11px] font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </div>
                  <div
                    className="w-4 h-4 rounded-full border border-border/50 shrink-0"
                    style={{ backgroundColor: step.color === "transparent" ? "#333" : step.color }}
                  />
                  <h4 className="font-serif font-bold text-base flex-1">{step.name}</h4>
                  {step.colorName && (
                    <span className="text-[11px] text-muted-foreground italic">{step.colorName}</span>
                  )}
                  {isCurrent && <Badge className="text-xs py-px px-1.5 h-auto">Now</Badge>}
                </div>
                <p className="text-xs text-muted-foreground pl-9 leading-relaxed">{step.instruction}</p>
                <div className="pl-9">
                  {STEP_ORDER.includes(stepKey) && <ProductPanel stepKey={stepKey} />}
                </div>
              </div>
            );
          })}

          {/* Footer CTA reinforcing AI try-on */}
          <div className="pt-2 mt-2 border-t border-border/60">
            <Button
              onClick={runAITryon}
              disabled={!isReady || isGenerating}
              className="w-full rounded-full gap-2 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="w-4 h-4" />See yourself in this look</>
              )}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-1.5">
              Photoreal AI render of you wearing the full look
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
