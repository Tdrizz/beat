import { useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { allLooks, eyeLooks, lipLooks, trendLooks, moreEyeLooks, moreLipLooks } from "../lib/looks";
import { useFaceAR } from "../hooks/useFaceAR";
import { sampleSkinProfile, matchShadesToSkin, DEPTH_LABELS, UNDERTONE_LABELS, type SkinProfile } from "../lib/shadeMatch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Download, Loader2, Camera as CameraIcon,
  Columns2, Maximize2, ChevronLeft, ChevronRight, Zap,
  Pipette, CheckCircle2, RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ALL_LOOKS = [
  ...allLooks, ...eyeLooks, ...lipLooks,
  ...trendLooks, ...moreEyeLooks, ...moreLipLooks
];

// ── Split-view divider ─────────────────────────────────────────────────────────

function SplitDivider({
  pct,
  containerRef,
  onChange,
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

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => { if (dragging.current) updatePos(e.clientX); };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div
      className="absolute inset-y-0 z-30 flex items-center"
      style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/70 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
      <div
        className="relative z-10 flex items-center gap-1 bg-white rounded-full px-2.5 py-1.5 shadow-xl cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: "none" }}
      >
        <ChevronLeft className="w-3.5 h-3.5 text-zinc-700" />
        <div className="w-px h-3.5 bg-zinc-300" />
        <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
      </div>
      <div className="absolute bottom-6 right-full mr-3 text-xs font-bold tracking-widest text-white uppercase px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm select-none pointer-events-none">
        Before
      </div>
      <div className="absolute bottom-6 left-full ml-3 text-xs font-bold tracking-widest text-white uppercase px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm select-none pointer-events-none">
        After
      </div>
    </div>
  );
}

// ── Skin Profile Badge ─────────────────────────────────────────────────────────

function SkinBadge({ profile, onReset }: { profile: SkinProfile; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5"
    >
      <div
        className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
        style={{ backgroundColor: profile.hex }}
      />
      <span className="text-xs text-white font-medium">
        {DEPTH_LABELS[profile.depth]} · {UNDERTONE_LABELS[profile.undertone]}
      </span>
      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
      <button
        onClick={onReset}
        className="text-white/50 hover:text-white transition-colors"
        title="Reset to original shades"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
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

  // Shade matching state
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [matchedLook, setMatchedLook] = useState<typeof baseLook | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // The look currently passed to the AR renderer
  const activeLook = matchedLook ?? baseLook ?? null;

  const scaledSteps = useMemo(
    () => Object.fromEntries(
      Object.entries(activeSteps).map(([k, v]) => [k, v * masterIntensity])
    ),
    [activeSteps, masterIntensity]
  );

  const { isReady, error, latestLandmarksRef } = useFaceAR(videoRef, canvasRef, scaledSteps, activeLook);

  const handleStepToggle = (stepId: string, checked: boolean) => {
    setStepStates(prev => ({ ...prev, [stepId]: checked }));
    setActiveSteps(prev => ({ ...prev, [stepId]: checked ? 1 : 0 }));
  };

  const handleIntensityChange = (stepId: string, value: number) => {
    setActiveSteps(prev => ({ ...prev, [stepId]: value }));
  };

  const toggleViewMode = () => setViewMode(m => m === "split" ? "after" : "split");

  const captureScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const merged = document.createElement("canvas");
    merged.width = videoRef.current.videoWidth;
    merged.height = videoRef.current.videoHeight;
    const ctx = merged.getContext("2d");
    if (!ctx) return;
    ctx.translate(merged.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, merged.width, merged.height);
    ctx.drawImage(canvasRef.current, 0, 0, merged.width, merged.height);
    const url = merged.toDataURL("image/jpeg", 0.92);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beat-${activeLook?.id || "look"}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // AI Shade Match — samples current frame + landmarks → adjusts look colors
  const handleShadeMatch = async () => {
    if (!videoRef.current || !latestLandmarksRef.current || !baseLook) return;
    setIsMatching(true);
    try {
      await new Promise(r => setTimeout(r, 80)); // let UI update
      const profile = sampleSkinProfile(videoRef.current, latestLandmarksRef.current);
      const adapted  = matchShadesToSkin(baseLook, profile);
      setSkinProfile(profile);
      setMatchedLook(adapted);
    } catch (e) {
      console.error("Shade match failed", e);
    } finally {
      setIsMatching(false);
    }
  };

  const handleResetShades = () => {
    setSkinProfile(null);
    setMatchedLook(null);
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

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden flex flex-col md:flex-row">

      {/* ── Camera Area ─────────────────────────────────────────────────────── */}
      <div ref={cameraAreaRef} className="relative flex-grow h-full bg-zinc-900 overflow-hidden z-0">
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
          {viewMode === "split" && (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="pointer-events-auto absolute inset-0">
                <SplitDivider pct={dividerPct} containerRef={cameraAreaRef} onChange={setDividerPct} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {!isReady && !error && (
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-primary"
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
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <Link href={`/looks/${baseLook.id}`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="font-serif text-xl font-bold text-white tracking-wide drop-shadow-md">{baseLook.name}</h2>
            <AnimatePresence>
              {skinProfile && (
                <SkinBadge profile={skinProfile} onReset={handleResetShades} />
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost" size="icon"
              className={`rounded-full transition-all ${viewMode === "split" ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/20"}`}
              onClick={toggleViewMode}
              title={viewMode === "split" ? "Full overlay" : "Before / After split"}
            >
              {viewMode === "split" ? <Maximize2 className="w-5 h-5" /> : <Columns2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost" size="icon"
              className="rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/10"
              onClick={captureScreenshot} title="Save Photo"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Controls Panel ───────────────────────────────────────────────────── */}
      <div className="w-full md:w-96 bg-card/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-border flex flex-col z-20 h-[45vh] md:h-full shrink-0">

        {/* Progress bar */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Try-On Progress</h3>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* AI Shade Match */}
        <div className="px-4 py-3 border-b border-border shrink-0 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Pipette className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">AI Shade Match</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {skinProfile
                  ? `Matched to ${DEPTH_LABELS[skinProfile.depth]}, ${UNDERTONE_LABELS[skinProfile.undertone]} skin`
                  : "Scan your skin tone for personalised shades"}
              </p>
            </div>
            <Button
              size="sm"
              variant={skinProfile ? "outline" : "default"}
              className="shrink-0 gap-1.5 rounded-full text-xs px-3"
              onClick={skinProfile ? handleResetShades : handleShadeMatch}
              disabled={isMatching || !isReady}
            >
              {isMatching ? (
                <><Loader2 className="w-3 h-3 animate-spin" />Scanning…</>
              ) : skinProfile ? (
                <><RefreshCw className="w-3 h-3" />Reset</>
              ) : (
                <><Pipette className="w-3 h-3" />Match</>
              )}
            </Button>
          </div>

          {/* Shade swatches when matched */}
          <AnimatePresence>
            {skinProfile && matchedLook && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">Your shades:</span>
                  {Object.values(matchedLook.steps)
                    .filter(s => s.color && s.color !== "transparent")
                    .map(s => (
                      <div
                        key={s.id}
                        className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: s.color }}
                        title={s.name}
                      />
                    ))
                  }
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Master intensity */}
        <div className="px-4 py-3 border-b border-border shrink-0 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">Master Intensity</span>
            <span className="ml-auto text-sm font-bold text-primary tabular-nums">{masterPct}%</span>
          </div>
          <Slider
            min={0} max={1} step={0.01}
            value={[masterIntensity]}
            onValueChange={([v]) => setMasterIntensity(v)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1.5">Scales the entire look up or down at once.</p>
        </div>

        {/* Per-step controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {stepsList.map((step) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-border/50 shrink-0 transition-all duration-500"
                    style={{ backgroundColor: step.color === "transparent" ? "#333" : step.color }}
                  />
                  <h4 className="font-serif font-bold text-base">{step.name}</h4>
                  {skinProfile && step.colorName === "Skin-Matched" && (
                    <span className="text-xs bg-green-500/15 text-green-600 rounded-full px-1.5 py-0.5 font-medium leading-none">
                      Matched
                    </span>
                  )}
                </div>
                <Switch
                  checked={stepStates[step.id]}
                  onCheckedChange={(c) => handleStepToggle(step.id, c)}
                />
              </div>
              <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{step.instruction}</p>
              {stepStates[step.id] && (
                <div className="pl-7 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground shrink-0">Intensity</span>
                  <Slider
                    max={1} min={0.05} step={0.05}
                    value={[activeSteps[step.id]]}
                    onValueChange={(vals) => handleIntensityChange(step.id, vals[0])}
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
