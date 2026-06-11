import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Lock, Sparkles } from "lucide-react";
import { AuthedRoute } from "@/components/AuthedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/usePremium";
import { api, CLASS_DIFFICULTIES, CLASS_MOODS, type ClassDifficulty, type ClassMood, type ClassRow } from "@/lib/api";

function HostClassForm() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState(() => {
    // Default to one hour from now, formatted for datetime-local input.
    const d = new Date(Date.now() + 60 * 60_000);
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [durationMin, setDurationMin] = useState(45);
  const [difficulty, setDifficulty] = useState<ClassDifficulty>("beginner");
  const [moodTag, setMoodTag] = useState<ClassMood>("everyday");
  const [coverUrl, setCoverUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [learnings, setLearnings] = useState("");

  const create = useMutation({
    mutationFn: () => api.post<{ class: ClassRow }>("/classes", {
      title,
      description,
      scheduledFor: new Date(scheduledFor).toISOString(),
      durationMin,
      difficulty,
      moodTag,
      coverUrl: coverUrl || null,
      videoUrl: videoUrl || null,
      isPremium,
      learnings: learnings.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10),
    }),
    onSuccess: (resp) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class published", description: "Your class is live in the catalog." });
      navigate(`/classes/${resp.class.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Could not publish", description: err.message, variant: "destructive" });
    },
  });

  const canSubmit = title.length >= 3 && scheduledFor && durationMin >= 5;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Beat Live</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">Host a class</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick a date, share what you'll teach, and your class drops into the catalog instantly.</p>

        <form
          className="mt-8 space-y-5 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) create.mutate(); }}
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Soft Romantic Eye, Three Ways" maxLength={120} />
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Walk students through your signature look — what to bring, what they'll leave with." rows={4} maxLength={2000} />
          </div>

          <div>
            <Label htmlFor="learn">What students will learn (one per line)</Label>
            <Textarea id="learn" value={learnings} onChange={(e) => setLearnings(e.target.value)} placeholder={"How to map blush placement\nA 3-step diffused liner\nLockdown for 12+ hours"} rows={4} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="when">Scheduled for</Label>
              <Input id="when" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dur">Duration (minutes)</Label>
              <Input id="dur" type="number" min={5} max={240} value={durationMin} onChange={(e) => setDurationMin(parseInt(e.target.value, 10) || 30)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="diff">Difficulty</Label>
              <select
                id="diff"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ClassDifficulty)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CLASS_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="mood">Mood tag</Label>
              <select
                id="mood"
                value={moodTag}
                onChange={(e) => setMoodTag(e.target.value as ClassMood)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CLASS_MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="cover">Cover image URL (optional)</Label>
            <Input id="cover" type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div>
            <Label htmlFor="vid">Video URL (optional — paste a YouTube / Vimeo / hosted link)</Label>
            <Input id="vid" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-amber-300/50 bg-amber-50/50 dark:bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <Crown className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Premium-only class</p>
                <p className="text-xs text-muted-foreground">Only Premium members can reserve and watch.</p>
              </div>
            </div>
            <Switch checked={isPremium} onCheckedChange={setIsPremium} />
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Publishing…" : "Publish class"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PremiumGate() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-amber-300/50 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-500/10 dark:to-rose-500/10 p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/30 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-amber-700" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">Hosting is a Premium perk</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Anyone can become an instructor, but broadcasting a class is unlocked with Beat Premium.
        </p>
        <Link href="/premium">
          <Button className="w-full rounded-full mt-5 gap-1.5 bg-amber-400 text-amber-950 hover:bg-amber-300">
            <Sparkles className="w-4 h-4" /> Unlock Premium
          </Button>
        </Link>
        <Link href="/classes" className="block mt-3 text-xs text-muted-foreground hover:underline">
          Back to classes
        </Link>
      </div>
    </div>
  );
}

function HostClassInner() {
  const { active, isLoading } = usePremium();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!active) return <PremiumGate />;
  return <HostClassForm />;
}

export default function HostClass() {
  return <AuthedRoute><HostClassInner /></AuthedRoute>;
}
