import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { allLooks } from "../lib/looks";
import { useFaceAR } from "../hooks/useFaceAR";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download, Eye, EyeOff, Loader2, Camera as CameraIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TryOn() {
  const { lookId } = useParams();
  const look = allLooks.find((l) => l.id === lookId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showBefore, setShowBefore] = useState(false);
  const [activeSteps, setActiveSteps] = useState<Record<string, number>>({
    base: 1,
    eyes: 1,
    brows: 1,
    lips: 1,
    cheeks: 1
  });
  
  const [stepStates, setStepStates] = useState<Record<string, boolean>>({
    base: true,
    eyes: true,
    brows: true,
    lips: true,
    cheeks: true
  });

  const { isReady, error } = useFaceAR(
    videoRef, 
    canvasRef, 
    showBefore ? { base: 0, eyes: 0, brows: 0, lips: 0, cheeks: 0 } : activeSteps, 
    look || null
  );

  const handleStepToggle = (stepId: string, checked: boolean) => {
    setStepStates(prev => ({ ...prev, [stepId]: checked }));
    setActiveSteps(prev => ({ ...prev, [stepId]: checked ? 1 : 0 }));
  };

  const handleIntensityChange = (stepId: string, value: number) => {
    setActiveSteps(prev => ({ ...prev, [stepId]: value }));
  };

  const captureScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Create an offscreen canvas to merge video + AR canvas
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = videoRef.current.videoWidth;
    mergedCanvas.height = videoRef.current.videoHeight;
    const ctx = mergedCanvas.getContext("2d");
    if (!ctx) return;

    // Flip context horizontally because video/canvas are mirrored via CSS
    ctx.translate(mergedCanvas.width, 0);
    ctx.scale(-1, 1);
    
    // Draw video
    ctx.drawImage(videoRef.current, 0, 0, mergedCanvas.width, mergedCanvas.height);
    
    // Draw AR layer if not in "before" mode
    if (!showBefore) {
      ctx.drawImage(canvasRef.current, 0, 0, mergedCanvas.width, mergedCanvas.height);
    }
    
    // Download
    const dataUrl = mergedCanvas.toDataURL("image/jpeg", 0.9);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `glamr-${look?.id || "look"}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!look) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-serif">Look not found</h2>
        <Link href="/">
          <Button variant="outline" className="mt-4">Return Home</Button>
        </Link>
      </div>
    );
  }

  const stepsList = Object.values(look.steps);
  const activeCount = Object.values(stepStates).filter(Boolean).length;
  const progressPercent = (activeCount / stepsList.length) * 100;

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden flex flex-col md:flex-row">
      {/* Video & Canvas Area */}
      <div className="relative flex-grow h-full bg-zinc-900 overflow-hidden z-0">
        <video 
          ref={videoRef} 
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
          autoPlay 
          playsInline 
          muted 
        />
        <canvas 
          ref={canvasRef} 
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
        />
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {!isReady && !error && (
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-primary"
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <h3 className="font-serif text-2xl font-bold">Warming up the studio...</h3>
              <p className="text-muted-foreground mt-2">Loading AR engine</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center p-6">
            <CameraIcon className="w-16 h-16 text-destructive mb-4" />
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Camera Access Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Link href={`/looks/${look.id}`}>
              <Button variant="outline">Go Back</Button>
            </Link>
          </div>
        )}

        {/* Top Controls Overlay */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent pt-safe">
          <Link href={`/looks/${look.id}`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="text-center drop-shadow-md">
            <h2 className="font-serif text-xl font-bold text-white tracking-wide">{look.name}</h2>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full ${showBefore ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-white/20'}`}
              onClick={() => setShowBefore(!showBefore)}
              title={showBefore ? "Show AR" : "Show Before"}
            >
              {showBefore ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/10"
              onClick={captureScreenshot}
              title="Save Photo"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-full md:w-96 bg-card/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-border flex flex-col z-20 h-[40vh] md:h-full transition-all shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Try-On Progress</h3>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {stepsList.map((step) => (
            <div key={step.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: step.color === 'transparent' ? '#333' : step.color }} 
                  />
                  <h4 className="font-serif font-bold text-lg">{step.name}</h4>
                </div>
                <Switch 
                  checked={stepStates[step.id]} 
                  onCheckedChange={(c) => handleStepToggle(step.id, c)}
                />
              </div>
              <p className="text-sm text-muted-foreground pl-7">{step.instruction}</p>
              
              {stepStates[step.id] && (
                <div className="pl-7 pt-2 flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">Intensity</span>
                  <Slider 
                    defaultValue={[1]} 
                    max={1} 
                    min={0.1} 
                    step={0.1}
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
