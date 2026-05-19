import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, ChevronLeft, Check, X, Star, ExternalLink } from "lucide-react";
import { AuthedRoute } from "@/components/AuthedRoute";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import NotFound from "@/pages/not-found";
import { TUTORIAL_CATEGORY_LABELS, TUTORIAL_DIFFICULTY_LABELS, type SubmittedTutorial } from "@/lib/tutorials";

function Inner() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["tutorial-admin-flag"],
    queryFn: () => api.get<{ isAdmin: boolean }>("/tutorials/me/admin"),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["tutorial-moderation-queue"],
    queryFn: () => api.get<{ tutorials: SubmittedTutorial[] }>("/tutorials/submitted/queue"),
    enabled: !!meta?.isAdmin,
  });

  const moderate = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "published" | "featured" | "rejected"; note?: string }) =>
      api.post(`/tutorials/submitted/${id}/moderate`, { status, note: note ?? null }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tutorial-moderation-queue"] });
      qc.invalidateQueries({ queryKey: ["submitted-tutorials"] });
      toast({ title: vars.status === "rejected" ? "Sent back to author" : `Marked as ${vars.status}` });
    },
    onError: (e: Error) => toast({ title: "Couldn't update", description: e.message, variant: "destructive" }),
  });

  if (metaLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!meta?.isAdmin) return <NotFound />;

  const queue = data?.tutorials ?? [];

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link href="/tutorials" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-3.5 h-3.5" /> All tutorials
        </Link>
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-3xl">Moderation queue</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {queue.length} {queue.length === 1 ? "tutorial" : "tutorials"} waiting for review.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : queue.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Nothing in the queue right now — nice.
          </div>
        ) : (
          <ul className="space-y-4">
            {queue.map((t) => (
              <QueueRow
                key={t.id}
                tutorial={t}
                onModerate={(status, note) => moderate.mutate({ id: t.id, status, note })}
                disabled={moderate.isPending}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function QueueRow({
  tutorial: t,
  onModerate,
  disabled,
}: {
  tutorial: SubmittedTutorial;
  onModerate: (status: "published" | "featured" | "rejected", note?: string) => void;
  disabled: boolean;
}) {
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/9] sm:w-48 sm:aspect-square bg-muted shrink-0">
          {t.thumbnail && <img src={t.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        </div>
        <div className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
            <span>{TUTORIAL_CATEGORY_LABELS[t.category]}</span>·
            <span>{TUTORIAL_DIFFICULTY_LABELS[t.difficulty]}</span>·
            <span>{t.minutes} min</span>
            {t.author && (
              <>·<Link href={`/u/${t.author.handle}`} className="text-foreground font-semibold hover:underline">@{t.author.handle}</Link></>
            )}
          </div>
          <p className="font-semibold leading-tight">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.summary}</p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {expanded ? "Hide" : "Show"} steps + tools
          </button>
          {expanded && (
            <div className="space-y-2 text-xs pt-2">
              <div>
                <p className="font-semibold mb-0.5">Tools</p>
                <ul className="list-disc pl-5 text-muted-foreground">{t.tools.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
              <div>
                <p className="font-semibold mb-0.5">Steps</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  {t.steps.map((s, i) => (
                    <li key={i}><span className="font-semibold text-foreground">{s.title}</span> — {s.body}</li>
                  ))}
                </ol>
              </div>
              {t.proTip && (
                <p><span className="font-semibold">Pro tip:</span> <span className="text-muted-foreground">{t.proTip}</span></p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border p-3 space-y-2 bg-muted/30">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (shown to the author on rejection)"
          rows={2}
          maxLength={500}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={disabled} onClick={() => onModerate("published")}>
            <Check className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => onModerate("featured")}>
            <Star className="w-3.5 h-3.5 mr-1" /> Approve + feature
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || !note.trim()}
            onClick={() => onModerate("rejected", note.trim())}
            className="text-destructive hover:text-destructive"
            title={!note.trim() ? "Add a note explaining what to fix" : ""}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Send back
          </Button>
          <div className="flex-1" />
          <Link href={`/tutorials/${t.id}`} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            Preview <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function TutorialModeration() {
  return <AuthedRoute><Inner /></AuthedRoute>;
}
