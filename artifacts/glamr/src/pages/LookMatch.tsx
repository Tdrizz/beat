import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useFaceAnalysis } from "../hooks/useFaceAnalysis";
import { recommendLooks, ScoredLook } from "../lib/lookRecommender";
import {
  allLooks, eyeLooks, lipLooks,
  trendLooks, moreEyeLooks, moreLipLooks
} from "../lib/looks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Camera, Loader2, Scan, Sparkles,
  Eye, Layers, Heart, ChevronRight, RotateCcw
} from "lucide-react";

const ALL_LOOKS = [
  ...allLooks, ...eyeLooks, ...lipLooks,
  ...trendLooks, ...moreEyeLooks, ...moreLipLooks,
];

// ── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  label, value, sub, icon, color, delay,
}: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex-1 min-w-[140px] bg-card border border-border rounded-2xl p-4 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <div className="text-primary/70 shrink-0">{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border border-border shrink-0" style={{ backgroundColor: color }} />
        <span className="font-serif text-lg font-bold text-foreground leading-none">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>
    </motion.div>
  );
}

// ── Recommended look card ────────────────────────────────────────────────────

function RecoCard({ look, index }: { look: ScoredLook; index: number }) {
  const gradStyle = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };
  const matchPct = Math.min(99, Math.round((look.score / 100) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.06, duration: 0.4 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300"
    >
      <div className="h-28 relative" style={gradStyle}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
        <div className="absolute top-2 right-2">
          <span className="text-xs font-bold bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
            {matchPct}% match
          </span>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-black/50 text-white border-none text-xs">
            {look.difficulty}
          </Badge>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-serif font-bold text-base leading-tight">{look.name}</h3>
          <p className="text-xs text-primary/80 italic">{look.mood}</p>
        </div>
        <div className="space-y-1">
          {look.reasons.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link href={`/looks/${look.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">Details</Button>
          </Link>
          <Link href={`/try-on/${look.id}`} className="flex-1">
            <Button size="sm" className="w-full text-xs bg-primary text-primary-foreground">
              <Camera className="w-3 h-3 mr-1" />Try It
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Scanning overlay ─────────────────────────────────────────────────────────

function ScanningOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-52 h-52 flex items-center justify-center">
        {/* Pulsing rings */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-primary"
            initial={{ width: 80, height: 80, opacity: 0.8 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        {/* Scan icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="z-10 bg-primary rounded-full p-5"
        >
          <Scan className="w-8 h-8 text-primary-foreground" />
        </motion.div>
      </div>
      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="mt-6 text-white font-serif text-xl font-bold tracking-wide"
      >
        Analysing your features…
      </motion.p>
      <p className="text-white/60 text-sm mt-1">Detecting skin tone, eye shape, face structure</p>
    </motion.div>
  );
}

// ── Face detection ring ──────────────────────────────────────────────────────

function FaceRing({ detected }: { detected: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="relative flex items-center justify-center">
        {/* Target reticle */}
        <div className={`w-52 h-64 rounded-[50%] border-2 transition-all duration-500 ${
          detected ? "border-primary shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "border-white/20"
        }`} />
        {detected && (
          <>
            {/* Corner accents */}
            {[
              "top-0 left-0 border-t-2 border-l-2",
              "top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2",
              "bottom-0 right-0 border-b-2 border-r-2",
            ].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 border-primary ${cls} rounded-sm`} />
            ))}
            <motion.div
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary rounded-full px-2 py-0.5"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-xs font-bold text-primary-foreground">Face detected</span>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LookMatch() {
  const { videoRef, state, faceDetected, analysis, error, scan } = useFaceAnalysis();
  const [recommendations, setRecommendations] = useState<ScoredLook[] | null>(null);

  const handleScan = async () => {
    await scan();
  };

  // Build recommendations after analysis arrives
  if (state === "done" && analysis && !recommendations) {
    setRecommendations(recommendLooks(analysis, ALL_LOOKS));
  }

  const reset = () => {
    window.location.reload();
  };

  const eyeColorMap: Record<string, string> = {
    "Almond": "#8a5030", "Round": "#3a6090", "Hooded": "#6a4030",
    "Monolid": "#303838", "Upturned": "#704060", "Downturned": "#5a3820",
  };
  const faceColorMap: Record<string, string> = {
    "Oval": "#c8a060", "Round": "#e0a0a0", "Square": "#a0a0c0",
    "Heart": "#e08090", "Diamond": "#80b0c0", "Oblong": "#c0b080",
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-14 z-30 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-xl font-bold flex items-center gap-2">
            Look Match <Sparkles className="w-4 h-4 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">AI-powered look recommendations</p>
        </div>
        {state === "done" && (
          <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />Rescan
          </Button>
        )}
      </div>

      {/* Error */}
      {state === "error" && (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <Camera className="w-16 h-16 text-destructive mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Camera Required</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
          <Link href="/">
            <Button variant="outline">Go Back Home</Button>
          </Link>
        </div>
      )}

      {/* Loading MediaPipe */}
      {state === "loading" && (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-1">Starting your session</h2>
          <p className="text-muted-foreground text-sm">Loading face analysis engine…</p>
        </div>
      )}

      {/* Camera + scan UI */}
      {(state === "ready" || state === "scanning") && (
        <div className="flex flex-col items-center">
          {/* Camera feed */}
          <div className="relative w-full max-w-lg aspect-[3/4] bg-zinc-900 overflow-hidden">
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
              autoPlay playsInline muted
            />
            <FaceRing detected={faceDetected} />
            <AnimatePresence>
              {state === "scanning" && <ScanningOverlay />}
            </AnimatePresence>
          </div>

          {/* Instructions + scan button */}
          <div className="w-full max-w-lg px-6 py-6 text-center space-y-4">
            {state === "ready" && (
              <>
                <h2 className="font-serif text-2xl font-bold">
                  {faceDetected ? "Ready to scan!" : "Position your face"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {faceDetected
                    ? "We'll analyse your skin tone, eye shape, and face structure to find your perfect looks."
                    : "Make sure your face is centred in the frame and well-lit."}
                </p>
                <Button
                  size="lg"
                  disabled={!faceDetected}
                  onClick={handleScan}
                  className="bg-primary text-primary-foreground px-8 py-6 text-base font-semibold gap-2 disabled:opacity-40 rounded-full"
                >
                  <Scan className="w-5 h-5" />
                  Scan My Face
                </Button>
                <p className="text-xs text-muted-foreground">
                  No images are stored. Analysis happens entirely on-device.
                </p>
              </>
            )}
            {state === "scanning" && (
              <p className="text-sm text-muted-foreground animate-pulse">Please hold still…</p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {state === "done" && analysis && recommendations && (
        <div className="max-w-2xl mx-auto px-4 pb-20">

          {/* Feature cards */}
          <div className="py-6">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-2xl font-bold mb-4 text-center"
            >
              Your Feature Profile
            </motion.h2>
            <div className="flex gap-3 flex-wrap">
              <FeatureCard
                label="Skin Tone"
                value={analysis.skinTone.category}
                sub={`${analysis.skinTone.undertone} undertone · ${analysis.skinTone.description}`}
                icon={<Layers className="w-4 h-4" />}
                color={analysis.skinTone.hex}
                delay={0.1}
              />
              <FeatureCard
                label="Eye Shape"
                value={analysis.eyeShape.type}
                sub={analysis.eyeShape.description}
                icon={<Eye className="w-4 h-4" />}
                color={eyeColorMap[analysis.eyeShape.type] ?? "#8a5030"}
                delay={0.2}
              />
              <FeatureCard
                label="Face Shape"
                value={analysis.faceShape.type}
                sub={analysis.faceShape.description}
                icon={<Sparkles className="w-4 h-4" />}
                color={faceColorMap[analysis.faceShape.type] ?? "#c8a060"}
                delay={0.3}
              />
            </div>
          </div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                  Your Looks <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                </h2>
                <p className="text-sm text-muted-foreground">Matched to your unique features</p>
              </div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  Browse all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendations.map((look, i) => (
                <RecoCard key={look.id} look={look} index={i} />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
