import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Camera, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFaceConsent } from "@/hooks/useFaceConsent";

const POINTS = [
  {
    icon: Camera,
    text: "Your live camera preview and Look Match face analysis run on your device. Nothing is uploaded until you choose a feature that needs it.",
  },
  {
    icon: Sparkles,
    text: "When you tap AI try-on, that one photo is sent to our AI provider (Google Gemini) to create your result. We don't keep the photo.",
  },
  {
    icon: Trash2,
    text: "Renders are only saved if you save or share them, and you can delete them, or your whole account, at any time.",
  },
  {
    icon: ShieldCheck,
    text: "We never use your face to identify you, and you can withdraw this consent in Settings → Account.",
  },
];

/**
 * Renders `children` (which start the camera) only after the user has
 * explicitly agreed to camera / face-data use. Otherwise shows the consent
 * screen. `onDecline` defaults to going back.
 */
export function FaceConsentGate({
  children,
  onDecline,
  overlay = false,
}: {
  children: ReactNode;
  onDecline?: () => void;
  /** Render the consent screen full-screen over the page (for inline cameras). */
  overlay?: boolean;
}) {
  const { granted, isLoading, grant } = useFaceConsent();
  const [, navigate] = useLocation();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (granted) return <>{children}</>;

  const decline = onDecline ?? (() => (window.history.length > 1 ? window.history.back() : navigate("/")));
  const accept = async () => {
    setSaving(true);
    setError(null);
    try {
      await grant();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        overlay
          ? "fixed inset-0 z-50 overflow-y-auto vanity-bg flex items-center justify-center px-4 py-8"
          : "min-h-[70vh] vanity-bg flex items-center justify-center px-4 py-8"
      }
    >
      <section
        role="dialog"
        aria-labelledby="face-consent-title"
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 space-y-5 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Camera className="h-6 w-6" />
          </div>
          <h1 id="face-consent-title" className="font-serif text-2xl">Before we turn on your camera</h1>
          <p className="text-sm text-muted-foreground">Try-on and Look Match use photos of your face. Here's how we handle them.</p>
        </div>
        <ul className="space-y-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm leading-relaxed">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
          <Checkbox id="face-consent" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <Label htmlFor="face-consent" className="text-sm font-normal leading-snug">
            I agree to the use of my camera and photos of my face as described above and in the{" "}
            <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
          </Label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Button className="rounded-full" disabled={!checked || saving} onClick={accept}>
            {saving ? "Saving…" : "Continue"}
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={decline}>Not now</Button>
        </div>
      </section>
    </div>
  );
}
