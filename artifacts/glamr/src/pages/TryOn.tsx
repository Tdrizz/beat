import { useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { allLooks, eyeLooks, lipLooks, trendLooks, moreEyeLooks, moreLipLooks } from "../lib/looks";
import { useFaceAR } from "../hooks/useFaceAR";
import { useAITryOn } from "../hooks/useAITryOn";
import { AITryOnModal } from "../components/AITryOnModal";
import { sampleSkinProfile, matchShadesToSkin, DEPTH_LABELS, UNDERTONE_LABELS, type SkinProfile } from "../lib/shadeMatch";
import { VoiceGuide } from "../components/VoiceGuide";
import { AvatarSelector, AvatarFace, AVATARS, type Avatar } from "../components/AvatarSelector";
import {
  universalBaseProducts, universalEyeshadowProducts, universalBrowProducts,
  universalLipProducts, universalBlushProducts, type ProductOption
} from "../lib/productRecommendations";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Loader2, Camera as CameraIcon,
  Columns2, Maximize2, ChevronLeft, ChevronRight, Zap,
  Pipette, CheckCircle2, RefreshCw, Play, User, ShoppingBag,
  ChevronDown, ChevronUp, ExternalLink, Youtube, Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ALL_LOOKS = [
  ...allLooks, ...eyeLooks, ...lipLooks,
  ...trendLooks, ...moreEyeLooks, ...moreLipLooks
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

// ── Split-view divider ─────────────────────────────────────────────────────────

function SplitDivider({
  pct, containerRef, onChange,
}: {
  pct: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (pct: number) => void;
}) {
  const dragging = useRef(false);
  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onChange(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)));
  }, [containerRef, onChange]);

  return (
    <div
      className="absolute inset-y-0 z-30 flex items-center"
      style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      onPointerDown={e => { dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); updatePos(e.clientX); }}
      onPointerMove={e => { if (dragging.current) updatePos(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/70 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
      <div className="relative z-10 flex items-center gap-1 bg-white rounded-full px-2.5 py-1.5 shadow-xl cursor-grab active:cursor-grabbing select-none" style={{ touchAction: "none" }}>
        <ChevronLeft className="w-3.5 h-3.5 text-zinc-700" />
        <div className="w-px h-3.5 bg-zinc-300" />
        <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
      </div>
      <div className="absolute bottom-6 right-full mr-3 text-xs font-bold tracking-widest text-white uppercase px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm select-none pointer-events-none">Before</div>
      <div className="absolute bottom-6 left-full ml-3 text-xs font-bold tracking-widest text-white uppercase px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm select-none pointer-events-none">After</div>
    </div>
  );
}

// ── Skin Badge ────────────────────────────────────────────────────────────────

function SkinBadge({ profile, onReset }: { profile: SkinProfile; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
      <div className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0" style={{ backgroundColor: profile.hex }} />
      <span className="text-xs text-white font-medium">{DEPTH_LABELS[profile.depth]} · {UNDERTONE_LABELS[profile.undertone]}</span>
      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
      <button onClick={onReset} className="text-white/50 hover:text-white transition-colors" title="Reset">
        <RefreshCw className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

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

// ── Guided overlay panel (shows on camera) ─────────────────────────────────────

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
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-4">
          {/* Step header */}
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
            <div className="flex items-center gap-1.5">
              <VoiceGuide
                text={step.instruction}
                stepName={step.name}
                stepNumber={currentIdx + 1}
                totalSteps={STEP_ORDER.length}
                autoPlay
                className="text-white"
              />
            </div>
          </div>

          {/* Instruction */}
          <p className="text-sm text-white/90 leading-relaxed mb-3">{step.instruction}</p>

          {/* Tool + YouTube reference */}
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

          {/* Navigation */}
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
              Free Mode
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraAreaRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<"after" | "split">("after");
  const [dividerPct, setDividerPct] = useState(50);
  const [masterIntensity, setMasterIntensity] = useState(1.0);

  const [activeSteps, setActiveSteps] = useState<Record<string, number>>({
    base: 1, eyes: 1, brows: 1, lips: 1, cheeks: 1,
  });
  const [stepStates, setStepStates] = useState<Record<string, boolean>>({
    base: true, eyes: true, brows: true, lips: true, cheeks: true,
  });

  // Guided mode
  const [guidedMode, setGuidedMode] = useState(false);
  const [currentGuideStepIdx, setCurrentGuideStepIdx] = useState(0);

  // Shade matching
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [matchedLook, setMatchedLook] = useState<typeof baseLook | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Avatar
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null); // null = use my face

  const activeLook = matchedLook ?? baseLook ?? null;

  const scaledSteps = useMemo(() =>
    Object.fromEntries(Object.entries(activeSteps).map(([k, v]) => [k, v * masterIntensity])),
    [activeSteps, masterIntensity]
  );

  // In guided mode: show only steps up to and including the current one
  const guidedActiveSteps = useMemo(() => {
    if (!guidedMode) return scaledSteps;
    const result: Record<string, number> = {};
    STEP_ORDER.forEach((k, i) => {
      result[k] = i === currentGuideStepIdx ? (scaledSteps[k] ?? 1) : 0;
    });
    return result;
  }, [guidedMode, currentGuideStepIdx, scaledSteps]);

  const { isReady, error, latestLandmarksRef } = useFaceAR(videoRef, canvasRef, guidedActiveSteps, activeLook);

  const handleStepToggle = (stepId: string, checked: boolean) => {
    setStepStates(prev => ({ ...prev, [stepId]: checked }));
    setActiveSteps(prev => ({ ...prev, [stepId]: checked ? 1 : 0 }));
  };

  const handleIntensityChange = (stepId: string, value: number) => {
    setActiveSteps(prev => ({ ...prev, [stepId]: value }));
  };

  const handleShadeMatch = async () => {
    if (!videoRef.current || !latestLandmarksRef.current || !baseLook) return;
    setIsMatching(true);
    try {
      await new Promise(r => setTimeout(r, 80));
      const profile = sampleSkinProfile(videoRef.current, latestLandmarksRef.current);
      const adapted  = matchShadesToSkin(baseLook, profile);
      setSkinProfile(profile);
      setMatchedLook(adapted);
    } catch { /* ignore */ }
    finally { setIsMatching(false); }
  };

  const handleResetShades = () => { setSkinProfile(null); setMatchedLook(null); };

  const captureScreenshot = () => {
    const video = videoRef.current;
    const overlay = canvasRef.current;
    if (!video || !overlay) return;
    if (!video.videoWidth || !video.videoHeight) return;
    const merged = document.createElement("canvas");
    merged.width = video.videoWidth;
    merged.height = video.videoHeight;
    const ctx = merged.getContext("2d");
    if (!ctx) return;
    // Mirror BOTH layers so the screenshot matches what the user sees on screen
    // (the live preview applies CSS scaleX(-1) to both the video and overlay canvas).
    ctx.save();
    ctx.translate(merged.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, merged.width, merged.height);
    ctx.drawImage(overlay, 0, 0, merged.width, merged.height);
    ctx.restore();
    const a = document.createElement("a");
    a.href = merged.toDataURL("image/jpeg", 0.92);
    a.download = `beat-${activeLook?.id || "look"}-${Date.now()}.jpg`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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

  // ── AI photoreal try-on ──────────────────────────────────────────────────
  // Captures the current camera frame and asks Gemini 2.5 Flash Image to
  // repaint it with the selected look applied — produces a photoreal result
  // that follows the user's face structure and lighting (no canvas overlay).
  const aiTryon = useAITryOn();
  const [aiTryonOpen, setAiTryonOpen] = useState(false);
  const runAITryon = () => {
    if (!activeLook) return;
    setAiTryonOpen(true);
    aiTryon.run({ video: videoRef.current, look: activeLook });
  };
  const closeAITryon = () => {
    setAiTryonOpen(false);
    aiTryon.reset();
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

  const stepsList = Object.values(activeLook?.steps ?? baseLook.steps);
  const activeCount = Object.values(stepStates).filter(Boolean).length;
  const progressPercent = (activeCount / stepsList.length) * 100;
  const canvasClip = viewMode === "split" ? `inset(0 ${dividerPct}% 0 0)` : "none";
  const masterPct = Math.round(masterIntensity * 100);
  const currentStepForVoice = guidedMode && activeLook
    ? activeLook.steps[STEP_ORDER[currentGuideStepIdx]]
    : null;

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden flex flex-col md:flex-row">

      {/* ── Camera Area ─────────────────────────────────────────────────────── */}
      <div ref={cameraAreaRef} className="relative flex-grow h-full bg-zinc-950 overflow-hidden z-0">
        {/* Vanity warm light glow */}
        <div className="absolute inset-0 z-10 pointer-events-none vanity-camera-glow" />

        <video
          ref={videoRef}
          style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          autoPlay playsInline muted
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute", width: "100%", height: "100%",
            objectFit: "cover", transform: "scaleX(-1)",
            clipPath: canvasClip,
            transition: viewMode === "split" ? "none" : "clip-path 0.3s ease",
          }}
        />

        {/* Split divider */}
        <AnimatePresence>
          {viewMode === "split" && !guidedMode && (
            <motion.div className="absolute inset-0 z-20 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="pointer-events-auto absolute inset-0">
                <SplitDivider pct={dividerPct} containerRef={cameraAreaRef} onChange={setDividerPct} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar — bottom right corner when selected */}
        <AnimatePresence>
          {selectedAvatar && !guidedMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 16 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-md rounded-2xl p-2 border border-white/20"
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
              look={activeLook ?? undefined}
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
              <h3 className="font-serif text-2xl font-bold">Warming up the studio…</h3>
              <p className="text-muted-foreground mt-2">Loading AR engine</p>
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
            <AnimatePresence>
              {skinProfile && <SkinBadge profile={skinProfile} onReset={handleResetShades} />}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            {/* Avatar picker */}
            <Button
              variant="ghost" size="icon"
              className="rounded-full text-white hover:bg-white/20"
              onClick={() => setShowAvatarSelector(true)}
              title="Choose avatar"
            >
              <User className="w-5 h-5" />
            </Button>
            {/* Split */}
            {!guidedMode && (
              <Button
                variant="ghost" size="icon"
                className={`rounded-full transition-all ${viewMode === "split" ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/20"}`}
                onClick={() => setViewMode(m => m === "split" ? "after" : "split")}
                title="Before / After"
              >
                {viewMode === "split" ? <Maximize2 className="w-5 h-5" /> : <Columns2 className="w-5 h-5" />}
              </Button>
            )}
            {/* Save */}
            <Button
              variant="ghost" size="icon"
              className="rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/10"
              onClick={captureScreenshot} title="Save Photo"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* AI photoreal try-on FAB — bottom centre, above the controls panel */}
        {!guidedMode && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <Button
              onClick={runAITryon}
              disabled={!isReady || aiTryon.state === "capturing" || aiTryon.state === "generating"}
              className="rounded-full gap-2 px-5 py-6 text-sm font-bold shadow-2xl bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground hover:opacity-95 disabled:opacity-60"
              title="Generate a photoreal AI try-on"
            >
              {aiTryon.state === "capturing" || aiTryon.state === "generating" ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Painting…</>
              ) : (
                <><Sparkles className="w-4 h-4" />AI Try-On</>
              )}
            </Button>
          </div>
        )}

        <AITryOnModal
          open={aiTryonOpen}
          state={aiTryon.state}
          imageUrl={aiTryon.result?.imageUrl ?? null}
          error={aiTryon.error}
          lookName={activeLook?.name ?? baseLook.name}
          onClose={closeAITryon}
          onRetry={runAITryon}
        />

        {/* Avatar selector sheet */}
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

      {/* ── Controls Panel ───────────────────────────────────────────────────── */}
      <div className="w-full md:w-96 bg-card/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-border flex flex-col z-20 h-[48vh] md:h-full shrink-0">

        {/* Progress bar */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              {guidedMode ? `Guided — Step ${currentGuideStepIdx + 1} of ${STEP_ORDER.length}` : "Try-On Progress"}
            </h3>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={guidedMode ? ((currentGuideStepIdx + 1) / STEP_ORDER.length) * 100 : progressPercent} className="h-1.5" />
        </div>

        {/* Guided mode toggle */}
        <div className="px-4 py-3 border-b border-border shrink-0 bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm font-semibold">Guided Mode</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">One step at a time with voice walkthrough</p>
            </div>
            {guidedMode ? (
              <Button size="sm" variant="outline" className="text-xs rounded-full" onClick={exitGuidedMode}>Exit Guide</Button>
            ) : (
              <Button size="sm" className="text-xs rounded-full gap-1" onClick={startGuidedMode} disabled={!isReady}>
                <Play className="w-3 h-3" />Start Guide
              </Button>
            )}
          </div>
        </div>

        {/* AI Shade Match */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Pipette className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm font-semibold">AI Shade Match</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {skinProfile
                  ? `${DEPTH_LABELS[skinProfile.depth]}, ${UNDERTONE_LABELS[skinProfile.undertone]} skin`
                  : "Scan skin tone for personalised shades"}
              </p>
            </div>
            <Button
              size="sm" variant={skinProfile ? "outline" : "default"}
              className="shrink-0 gap-1.5 rounded-full text-xs px-3"
              onClick={skinProfile ? handleResetShades : handleShadeMatch}
              disabled={isMatching || !isReady}
            >
              {isMatching ? <><Loader2 className="w-3 h-3 animate-spin" />Scanning…</>
                : skinProfile ? <><RefreshCw className="w-3 h-3" />Reset</>
                : <><Pipette className="w-3 h-3" />Match</>}
            </Button>
          </div>
          <AnimatePresence>
            {skinProfile && matchedLook && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">Your shades:</span>
                  {Object.values(matchedLook.steps).filter(s => s.color && s.color !== "transparent").map(s => (
                    <div key={s.id} className="w-4 h-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: s.color }} title={s.name} />
                  ))}
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Master intensity */}
        <div className="px-4 py-3 border-b border-border shrink-0 bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold">Master Intensity</span>
            <span className="ml-auto text-sm font-bold text-primary tabular-nums">{masterPct}%</span>
          </div>
          <Slider min={0} max={1} step={0.01} value={[masterIntensity]}
            onValueChange={([v]) => setMasterIntensity(v)} className="w-full" />
        </div>

        {/* Per-step controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {stepsList.map((step) => {
            const stepKey = step.id as StepKey;
            return (
              <div key={step.id} className={`space-y-1.5 transition-all duration-300 ${guidedMode && STEP_ORDER[currentGuideStepIdx] !== step.id ? "opacity-40" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: step.color === "transparent" ? "#333" : step.color }}
                    />
                    <h4 className="font-serif font-bold text-base">{step.name}</h4>
                    {guidedMode && STEP_ORDER[currentGuideStepIdx] === step.id && (
                      <Badge className="text-xs py-px px-1.5 h-auto">Now</Badge>
                    )}
                  </div>
                  <Switch
                    checked={stepStates[step.id]}
                    onCheckedChange={(c) => handleStepToggle(step.id, c)}
                    disabled={guidedMode}
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{step.instruction}</p>
                {stepStates[step.id] && !guidedMode && (
                  <div className="pl-7 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground shrink-0">Intensity</span>
                    <Slider max={1} min={0.05} step={0.05}
                      value={[activeSteps[step.id]]}
                      onValueChange={vals => handleIntensityChange(step.id, vals[0])}
                      className="flex-1" />
                  </div>
                )}
                {STEP_ORDER.includes(stepKey) && <ProductPanel stepKey={stepKey} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
