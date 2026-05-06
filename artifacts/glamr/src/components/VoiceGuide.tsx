import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX, Pause, Play, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceGuideProps {
  text: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  autoPlay?: boolean;
  className?: string;
}

export function VoiceGuide({
  text, stepName, stepNumber, totalSteps, autoPlay = false, className = ""
}: VoiceGuideProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(autoPlay);
  const [supported, setSupported] = useState(false);
  const spokenRef = useRef<string>("");

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((script: string) => {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Prefer a natural-sounding English voice
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return (
        voices.find(v => v.name === "Samantha") ||
        voices.find(v => v.name === "Karen") ||
        voices.find(v => v.name === "Moira") ||
        voices.find(v => v.lang === "en-GB" && !v.name.includes("Google")) ||
        voices.find(v => v.lang.startsWith("en")) ||
        null
      );
    };

    // voices may not be loaded yet
    const trySpeak = () => {
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    }
  }, [supported]);

  // Auto-play when text changes (new step)
  useEffect(() => {
    if (!enabled || !text || !supported) return;
    const key = `${stepNumber}-${text.slice(0, 20)}`;
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    const script = `Step ${stepNumber} of ${totalSteps}: ${stepName}. ${text}`;
    const timer = setTimeout(() => speak(script), 400);
    return () => clearTimeout(timer);
  }, [text, enabled, stepNumber, stepName, totalSteps, speak, supported]);

  // Cleanup on unmount
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  if (!supported) return null;

  const toggleEnabled = () => {
    if (enabled) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setEnabled(e => !e);
  };

  const togglePlay = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const script = `Step ${stepNumber} of ${totalSteps}: ${stepName}. ${text}`;
      speak(script);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button
        size="sm"
        variant={enabled ? "default" : "outline"}
        className={`gap-1.5 rounded-full text-xs px-3 h-8 ${enabled ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        onClick={toggleEnabled}
        title={enabled ? "Turn off voice guide" : "Turn on voice guide"}
      >
        {enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{enabled ? "Guide On" : "Guide Off"}</span>
      </Button>

      {enabled && (
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-full"
          onClick={togglePlay}
          title={isSpeaking ? "Pause" : "Replay instruction"}
        >
          {isSpeaking
            ? <Pause className="w-3.5 h-3.5 text-primary" />
            : <Play className="w-3.5 h-3.5" />
          }
        </Button>
      )}

      {isSpeaking && (
        <div className="flex gap-0.5 items-end h-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary animate-pulse"
              style={{ height: `${8 + (i % 2) * 6}px`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
