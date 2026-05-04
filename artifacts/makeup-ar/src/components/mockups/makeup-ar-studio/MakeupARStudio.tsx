import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, ChevronLeft, Share2, Download, SlidersHorizontal, 
  Sparkles, X, ChevronRight, Play, Eye, Maximize, CheckCircle2,
  Undo2
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./_group.css";

// --- Data ---
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type Category = "Era" | "Icon";

interface Step {
  id: number;
  title: string;
  description: string;
  products: { name: string; hex: string }[];
}

interface Look {
  id: string;
  name: string;
  subtitle: string;
  category: Category;
  mood: string;
  difficulty: Difficulty;
  timeEstimate: string;
  history: string;
  imageColor: string;
  steps: Step[];
}

const LOOKS: Look[] = [
  {
    id: "era-1920",
    name: "1920s Flapper",
    subtitle: "The Jazz Age",
    category: "Era",
    mood: "Dramatic",
    difficulty: "Advanced",
    timeEstimate: "35 mins",
    history: "Defined by dark, smoldering eyes, deeply rouged cheeks, and the iconic 'Cupid's bow' lips. This look rebelled against the modest Victorian era.",
    imageColor: "from-rose-900 to-slate-900",
    steps: [
      { id: 1, title: "Base", description: "Matte, porcelain finish", products: [{ name: "Ivory Powder", hex: "#f5e6d3" }] },
      { id: 2, title: "Eyes", description: "Smudged kohl all around the eye", products: [{ name: "Kohl Liner", hex: "#1a1a1a" }, { name: "Charcoal Shadow", hex: "#333333" }] },
      { id: 3, title: "Brows", description: "Thin, drawn downwards past the eye", products: [{ name: "Ebony Pencil", hex: "#2a2a2a" }] },
      { id: 4, title: "Lips", description: "Exaggerated Cupid's bow in deep red", products: [{ name: "Crimson Rouge", hex: "#8a0303" }] },
      { id: 5, title: "Cheeks", description: "Round circles of rouge on the apples", products: [{ name: "Rose Blush", hex: "#b33951" }] },
    ]
  },
  {
    id: "era-1950",
    name: "1950s Hollywood",
    subtitle: "Golden Age Glamour",
    category: "Era",
    mood: "Classic",
    difficulty: "Intermediate",
    timeEstimate: "25 mins",
    history: "The era of Marilyn Monroe and Grace Kelly. Defined by flawless matte skin, defined arched brows, winged eyeliner, and a bold red lip.",
    imageColor: "from-red-900 to-stone-900",
    steps: [
      { id: 1, title: "Base", description: "Flawless, matte pancake foundation", products: [{ name: "Velvet Matte Base", hex: "#e8c39e" }] },
      { id: 2, title: "Eyes", description: "Neutral lid with sharp black winged liner", products: [{ name: "Vanilla Shadow", hex: "#f2e3d5" }, { name: "Liquid Black Liner", hex: "#000000" }] },
      { id: 3, title: "Brows", description: "Strong, high arch", products: [{ name: "Taupe Pomade", hex: "#6b543f" }] },
      { id: 4, title: "Lips", description: "Overlined, glossy cherry red", products: [{ name: "Cherry Red", hex: "#d11141" }] },
      { id: 5, title: "Cheeks", description: "Subtle contour, minimal blush", products: [{ name: "Peach Glow", hex: "#e08d79" }] },
    ]
  },
  {
    id: "era-1990",
    name: "1990s Supermodel",
    subtitle: "The Matte Era",
    category: "Era",
    mood: "Sultry",
    difficulty: "Beginner",
    timeEstimate: "15 mins",
    history: "Inspired by Cindy, Naomi, and Linda. Earthy tones, matte brown lips with a darker liner, and soft smokey eyes.",
    imageColor: "from-amber-900 to-stone-900",
    steps: [
      { id: 1, title: "Base", description: "Velvet matte finish", products: [{ name: "Soft Matte Foundation", hex: "#d4a373" }] },
      { id: 2, title: "Eyes", description: "Cool-toned matte browns", products: [{ name: "Cocoa Shadow", hex: "#7a5c4d" }] },
      { id: 3, title: "Brows", description: "Natural, slightly thin", products: [{ name: "Ash Pencil", hex: "#5c4d42" }] },
      { id: 4, title: "Lips", description: "Dark brown liner with lighter nude center", products: [{ name: "Chestnut Liner", hex: "#5c3a21" }, { name: "Taupe Lipstick", hex: "#b5836d" }] },
      { id: 5, title: "Cheeks", description: "Matte bronzer instead of blush", products: [{ name: "Warm Bronze", hex: "#9e6c4b" }] },
    ]
  },
  {
    id: "icon-audrey",
    name: "Audrey Hepburn",
    subtitle: "Breakfast at Tiffany's (1961)",
    category: "Icon",
    mood: "Elegant",
    difficulty: "Intermediate",
    timeEstimate: "20 mins",
    history: "A timeless, elegant look featuring strong, thick brows, a soft cut crease, and delicate peach-toned lips.",
    imageColor: "from-teal-900 to-emerald-900",
    steps: [
      { id: 1, title: "Base", description: "Soft, luminous skin", products: [{ name: "Luminous Silk Base", hex: "#f0d5b6" }] },
      { id: 2, title: "Eyes", description: "Soft cut crease with short kitten wing", products: [{ name: "Dove Grey Shadow", hex: "#a19c98" }, { name: "Gel Liner", hex: "#111111" }] },
      { id: 3, title: "Brows", description: "Thick, straight, filled-in brows", products: [{ name: "Dark Brunette Powder", hex: "#4a3728" }] },
      { id: 4, title: "Lips", description: "Soft peach or coral lipstick", products: [{ name: "Coral Pink", hex: "#e88c7d" }] },
      { id: 5, title: "Cheeks", description: "Soft flush on the high apples", products: [{ name: "Soft Peach Blush", hex: "#f0a699" }] },
    ]
  },
  {
    id: "icon-zendaya",
    name: "Zendaya",
    subtitle: "2020s Ethereal",
    category: "Icon",
    mood: "Radiant",
    difficulty: "Beginner",
    timeEstimate: "15 mins",
    history: "The modern 'glass skin' look. Dewy, highlighted skin, brushed up fluffy brows, and a glossy nude lip.",
    imageColor: "from-purple-900 to-indigo-900",
    steps: [
      { id: 1, title: "Base", description: "Sheer tint with liquid highlighter", products: [{ name: "Dewy Tint", hex: "#d69e71" }, { name: "Champagne Glow", hex: "#fcecd2" }] },
      { id: 2, title: "Eyes", description: "Wash of shimmer, mascara", products: [{ name: "Bronze Shimmer", hex: "#b87c4f" }] },
      { id: 3, title: "Brows", description: "Laminated, fluffy brows", products: [{ name: "Clear Brow Gel", hex: "#ffffff" }] },
      { id: 4, title: "Lips", description: "Clear gloss over natural lip", products: [{ name: "Glass Lip Gloss", hex: "#fcdceb" }] },
      { id: 5, title: "Cheeks", description: "Cream blush high on the cheekbones", products: [{ name: "Berry Cream", hex: "#cc6677" }] },
    ]
  }
];

export function MakeupARStudio() {
  const [activeScreen, setActiveScreen] = useState<"library" | "try-on">("library");
  const [selectedLook, setSelectedLook] = useState<Look | null>(null);
  const [previewLook, setPreviewLook] = useState<Look | null>(null);
  
  // Try-on State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [intensities, setIntensities] = useState<Record<number, number>>({});
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  const currentStep = selectedLook?.steps[currentStepIndex];

  const handleStartTryOn = (look: Look) => {
    setSelectedLook(look);
    setPreviewLook(null);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setIntensities({});
    setActiveScreen("try-on");
  };

  const handleMarkDone = () => {
    if (!currentStep) return;
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps([...completedSteps, currentStep.id]);
    }
    if (currentStepIndex < (selectedLook?.steps.length || 0) - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const isAllComplete = selectedLook && completedSteps.length === selectedLook.steps.length;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30 overflow-hidden relative">
      
      {/* --- Screen 1: Library --- */}
      <AnimatePresence mode="wait">
        {activeScreen === "library" && (
          <motion.div 
            key="library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-10 flex flex-col"
          >
            {/* Header */}
            <header className="px-8 py-10 z-20 relative text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent -z-10" />
              <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-4">
                <span className="gold-gradient">The Studio</span>
              </h1>
              <p className="text-white/60 tracking-widest uppercase text-sm max-w-md mx-auto">
                Iconic artistry mapped to your face
              </p>
            </header>

            {/* Grid */}
            <ScrollArea className="flex-1 px-8 pb-24 z-10">
              <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Era Category */}
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-serif">By Era</h2>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {LOOKS.filter(l => l.category === "Era").map(look => (
                      <LookCard 
                        key={look.id} 
                        look={look} 
                        onClick={() => setPreviewLook(look)} 
                      />
                    ))}
                  </div>
                </section>

                {/* Icons Category */}
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-serif">Celebrity Icons</h2>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {LOOKS.filter(l => l.category === "Icon").map(look => (
                      <LookCard 
                        key={look.id} 
                        look={look} 
                        onClick={() => setPreviewLook(look)} 
                      />
                    ))}
                  </div>
                </section>

              </div>
            </ScrollArea>
            
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-600/10 blur-[120px] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Preview Modal --- */}
      <Dialog open={!!previewLook} onOpenChange={(open) => !open && setPreviewLook(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-2xl p-0 overflow-hidden shadow-2xl shadow-black">
          {previewLook && (
            <div className="flex flex-col md:flex-row h-full md:h-[600px]">
              {/* Left Image Area */}
              <div className={`md:w-1/2 relative bg-gradient-to-br ${previewLook.imageColor} p-8 flex flex-col justify-end`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 space-y-2">
                  <Badge variant="outline" className="text-white/80 border-white/20 backdrop-blur-md mb-2">
                    {previewLook.difficulty} • {previewLook.timeEstimate}
                  </Badge>
                  <h2 className="text-4xl font-serif leading-none">{previewLook.name}</h2>
                  <p className="text-white/70">{previewLook.subtitle}</p>
                </div>
              </div>
              
              {/* Right Content Area */}
              <div className="md:w-1/2 p-8 flex flex-col">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm uppercase tracking-widest text-amber-500 mb-2">History</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{previewLook.history}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm uppercase tracking-widest text-amber-500 mb-4">The Process</h3>
                      <div className="space-y-4">
                        {previewLook.steps.map((step, i) => (
                          <div key={step.id} className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/50 shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{step.title}</p>
                              <p className="text-white/60 text-xs">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <Button 
                    className="w-full bg-white text-black hover:bg-amber-100 rounded-none h-12 text-sm tracking-wider uppercase"
                    onClick={() => handleStartTryOn(previewLook)}
                  >
                    Start Try-On <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* --- Screen 2: AR Try-On --- */}
      <AnimatePresence mode="wait">
        {activeScreen === "try-on" && selectedLook && (
          <motion.div 
            key="try-on"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20 flex flex-col bg-zinc-950"
          >
            {/* Header */}
            <header className="h-20 px-6 flex items-center justify-between z-30 glass-panel border-b border-white/5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 rounded-full"
                onClick={() => setActiveScreen("library")}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="text-center">
                <h2 className="font-serif text-lg">{selectedLook.name}</h2>
                <p className="text-xs text-white/50 tracking-widest uppercase">
                  Step {currentStepIndex + 1} of {selectedLook.steps.length}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                  <Camera className="w-5 h-5" />
                </Button>
              </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 relative flex">
              
              {/* Camera Simulation (Left/Center) */}
              <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                
                {/* Abstract Camera Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-900 to-black z-0" />
                
                {/* Animated Face Gradient (Simulating Skin) */}
                <motion.div 
                  className="absolute w-[80vw] h-[80vw] md:w-[40vw] md:h-[50vw] bg-rose-900/20 blur-[100px] rounded-full z-10"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.6, 0.5]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Simulated AR Tracer ring */}
                {!showBeforeAfter && (
                   <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-30">
                     <div className="w-[300px] h-[400px] border border-white/20 rounded-[100px] animate-pulse-ring" />
                   </div>
                )}

                {/* SVG Face Silhouette Overlay */}
                <div className={`relative z-20 w-full max-w-[400px] px-8 transition-opacity duration-500 ${showBeforeAfter ? 'opacity-20' : 'opacity-100'}`}>
                   <svg viewBox="0 0 100 130" className="w-full h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                     {/* Face Outline */}
                     <path d="M 20 50 Q 20 110, 50 120 Q 80 110, 80 50 Q 80 10, 50 10 Q 20 10, 20 50 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                     
                     {/* Eyebrows */}
                     <path d="M 30 40 Q 38 35, 45 40" fill="none" stroke={currentStep?.title === "Brows" ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.2)"} strokeWidth={currentStep?.title === "Brows" ? "2" : "0.5"} className="transition-all duration-300" />
                     <path d="M 70 40 Q 62 35, 55 40" fill="none" stroke={currentStep?.title === "Brows" ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.2)"} strokeWidth={currentStep?.title === "Brows" ? "2" : "0.5"} className="transition-all duration-300" />
                     
                     {/* Eyes */}
                     <path d="M 30 50 Q 38 45, 45 50 Q 38 55, 30 50 Z" fill={currentStep?.title === "Eyes" ? "rgba(251,191,36,0.2)" : "none"} stroke={currentStep?.title === "Eyes" ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.2)"} strokeWidth="0.5" className="transition-all duration-300" />
                     <path d="M 70 50 Q 62 45, 55 50 Q 62 55, 70 50 Z" fill={currentStep?.title === "Eyes" ? "rgba(251,191,36,0.2)" : "none"} stroke={currentStep?.title === "Eyes" ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.2)"} strokeWidth="0.5" className="transition-all duration-300" />
                     
                     {/* Cheeks */}
                     <ellipse cx="32" cy="70" rx="8" ry="12" fill={currentStep?.title === "Cheeks" ? "rgba(251,191,36,0.2)" : "none"} className="transition-all duration-300 blur-sm" />
                     <ellipse cx="68" cy="70" rx="8" ry="12" fill={currentStep?.title === "Cheeks" ? "rgba(251,191,36,0.2)" : "none"} className="transition-all duration-300 blur-sm" />
                     
                     {/* Lips */}
                     <path d="M 40 90 Q 50 85, 60 90 Q 50 98, 40 90 Z" fill={currentStep?.title === "Lips" ? "rgba(251,191,36,0.3)" : "none"} stroke={currentStep?.title === "Lips" ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.2)"} strokeWidth="0.5" className="transition-all duration-300" />
                   </svg>
                   
                   {/* Scanning Line overlay when active */}
                   <div className="absolute inset-0 overflow-hidden rounded-[100px] pointer-events-none opacity-20 mask-image:linear-gradient(to_bottom,transparent,black,transparent)">
                     <div className="w-full h-1 bg-amber-400 animate-face-scan shadow-[0_0_10px_#fbbf24]" />
                   </div>
                </div>

                {/* Overlays / Controls */}
                <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`rounded-full w-12 h-12 bg-black/50 border-white/20 backdrop-blur-md text-white transition-colors ${showBeforeAfter ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'hover:bg-white/20'}`}
                    onPointerDown={() => setShowBeforeAfter(true)}
                    onPointerUp={() => setShowBeforeAfter(false)}
                    onPointerLeave={() => setShowBeforeAfter(false)}
                  >
                    <Undo2 className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Look Applied Banner (if all complete) */}
                <AnimatePresence>
                  {isAllComplete && !showBeforeAfter && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute top-8 left-1/2 -translate-x-1/2 z-30 glass-panel px-6 py-3 rounded-full flex items-center gap-3 border-amber-500/30"
                    >
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span className="text-sm font-medium tracking-wide">Look Complete</span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Sidebar Guide (Right) */}
              <div className="w-full md:w-[400px] bg-zinc-950/80 backdrop-blur-2xl border-l border-white/5 flex flex-col z-30 flex-shrink-0">
                <div className="p-6 border-b border-white/5">
                  <Progress 
                    value={(completedSteps.length / selectedLook.steps.length) * 100} 
                    className="h-1 bg-white/10 mb-4" 
                    // indicator color is overridden via Tailwind classes if needed, 
                    // standard shadcn usually handles it but we want gold
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/50 uppercase tracking-widest">Progress</span>
                    <span className="text-xs text-amber-500 font-mono">{completedSteps.length} / {selectedLook.steps.length}</span>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                  <AnimatePresence mode="wait">
                    {currentStep && (
                      <motion.div 
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                      >
                        <div>
                          <h3 className="text-3xl font-serif mb-2">{currentStep.title}</h3>
                          <p className="text-white/60 text-sm leading-relaxed">{currentStep.description}</p>
                        </div>

                        {/* Palettes */}
                        <div className="space-y-4">
                          <h4 className="text-xs uppercase tracking-widest text-white/40">Shades Used</h4>
                          <div className="flex gap-4">
                            {currentStep.products.map(prod => (
                              <div key={prod.name} className="flex flex-col items-center gap-2">
                                <div 
                                  className="w-12 h-12 rounded-full border border-white/10 shadow-lg shadow-black"
                                  style={{ backgroundColor: prod.hex }}
                                />
                                <span className="text-[10px] text-white/50 text-center max-w-[60px]">{prod.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs uppercase tracking-widest text-white/40">Intensity</h4>
                            <span className="text-xs font-mono text-white/80">{intensities[currentStep.id] || 50}%</span>
                          </div>
                          <Slider 
                            defaultValue={[50]} 
                            max={100} 
                            step={1}
                            onValueChange={(v) => setIntensities(prev => ({...prev, [currentStep.id]: v[0]}))}
                            className="w-full"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isAllComplete && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                       className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                     >
                        <div className="w-20 h-20 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500/10">
                          <CheckCircle2 className="w-10 h-10 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif mb-2">Gorgeous</h3>
                          <p className="text-white/60 text-sm">You've mastered this look.</p>
                        </div>
                        <div className="flex gap-4 w-full">
                          <Button variant="outline" className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 rounded-none h-12">
                            <Download className="w-4 h-4 mr-2" /> Save
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10 rounded-none h-12">
                            <Share2 className="w-4 h-4 mr-2" /> Share
                          </Button>
                        </div>
                     </motion.div>
                  )}
                </ScrollArea>

                {/* Footer Action */}
                {!isAllComplete && (
                  <div className="p-6 border-t border-white/5 bg-black/40">
                    <Button 
                      className="w-full bg-white text-black hover:bg-amber-100 rounded-none h-14 text-sm tracking-wider uppercase transition-colors"
                      onClick={handleMarkDone}
                    >
                      {completedSteps.includes(currentStep?.id || 0) ? "Next Step" : "Mark as Done"} 
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

function LookCard({ look, onClick }: { look: Look; onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${look.imageColor} rounded-sm border border-white/10`}>
        {/* Abstract shape representing the look */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
           <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <circle cx="50" cy="50" r="40" fill="url(#grad)" />
              <defs>
                <radialGradient id="grad">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="black" stopOpacity="0" />
                </radialGradient>
              </defs>
           </svg>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="secondary" className="bg-black/50 text-white border-white/10 backdrop-blur-md font-normal">
            {look.mood}
          </Badge>
        </div>

        {/* Hover action */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center text-white bg-black/50">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs text-amber-500/80 uppercase tracking-widest mb-1">{look.subtitle}</p>
          <h3 className="text-2xl font-serif text-white">{look.name}</h3>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <span>{look.difficulty}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{look.timeEstimate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
