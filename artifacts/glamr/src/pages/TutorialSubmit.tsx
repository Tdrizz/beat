import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "@workspace/object-storage-web";
import { ChevronLeft, Plus, Trash2, ImagePlus, Send, Save, AlertCircle, GraduationCap, ExternalLink } from "lucide-react";
import { AuthedRoute } from "@/components/AuthedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_CATEGORY_LABELS,
  TUTORIAL_DIFFICULTIES,
  TUTORIAL_DIFFICULTY_LABELS,
  type SubmittedTutorial,
  type TutorialCategory,
  type TutorialDifficulty,
  type TutorialStep,
} from "@/lib/tutorials";

// Local draft state — kept loose (strings everywhere, optional fields)
// because the user is mid-edit. We validate at submit time against the
// same Zod schema the server uses.
interface DraftForm {
  title: string;
  category: TutorialCategory;
  difficulty: TutorialDifficulty;
  minutes: string;
  thumbnail: string;
  summary: string;
  tools: string[];
  steps: TutorialStep[];
  proTip: string;
}

const EMPTY_FORM: DraftForm = {
  title: "",
  category: "eyes",
  difficulty: "beginner",
  minutes: "10",
  thumbnail: "",
  summary: "",
  tools: [""],
  steps: [{ title: "", body: "" }, { title: "", body: "" }],
  proTip: "",
};

function payloadFrom(f: DraftForm) {
  return {
    title: f.title.trim(),
    category: f.category,
    difficulty: f.difficulty,
    minutes: Number(f.minutes) || 0,
    thumbnail: f.thumbnail.trim(),
    summary: f.summary.trim(),
    tools: f.tools.map((t) => t.trim()).filter(Boolean),
    steps: f.steps
      .map((s) => ({ title: s.title.trim(), body: s.body.trim() }))
      .filter((s) => s.title || s.body),
    proTip: f.proTip.trim() ? f.proTip.trim() : null,
  };
}

function TutorialSubmitInner() {
  const params = useParams<{ id?: string }>();
  const editingId = params.id;
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);

  // When editing an existing draft, hydrate the form from the server.
  // For new submissions we just start from the empty form.
  const { data: existing, isLoading } = useQuery({
    queryKey: ["submitted-tutorial", editingId],
    queryFn: () => api.get<SubmittedTutorial>(`/tutorials/submitted/${editingId}`),
    enabled: !!editingId,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      category: existing.category,
      difficulty: existing.difficulty,
      minutes: String(existing.minutes),
      thumbnail: existing.thumbnail,
      summary: existing.summary,
      tools: existing.tools.length ? existing.tools : [""],
      steps: existing.steps.length ? existing.steps : EMPTY_FORM.steps,
      proTip: existing.proTip ?? "",
    });
  }, [existing]);

  const locked = existing?.status === "pending"
    || existing?.status === "published"
    || existing?.status === "featured";

  const save = useMutation({
    mutationFn: async () => {
      const body = payloadFrom(form);
      if (editingId) {
        return api.put<SubmittedTutorial>(`/tutorials/submitted/${editingId}`, body);
      }
      return api.post<SubmittedTutorial>("/tutorials/submitted", body);
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["my-submitted-tutorials"] });
      qc.invalidateQueries({ queryKey: ["submitted-tutorial", row.id] });
      toast({ title: "Draft saved" });
      if (!editingId) navigate(`/tutorials/submit/${row.id}`);
    },
    onError: (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });

  const submit = useMutation({
    mutationFn: async () => {
      // Save first so the server is operating on the latest field values.
      const saved = editingId
        ? await api.put<SubmittedTutorial>(`/tutorials/submitted/${editingId}`, payloadFrom(form))
        : await api.post<SubmittedTutorial>("/tutorials/submitted", payloadFrom(form));
      return api.post<SubmittedTutorial>(`/tutorials/submitted/${saved.id}/submit`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-submitted-tutorials"] });
      toast({ title: "Submitted for review", description: "We'll let you know once a moderator approves it." });
      navigate("/tutorials/mine");
    },
    onError: (e: Error) => toast({ title: "Couldn't submit", description: e.message, variant: "destructive" }),
  });

  const issues = useMemo(() => validate(form), [form]);
  const canSubmit = issues.length === 0 && !locked;

  if (editingId && isLoading) {
    return <div className="min-h-screen vanity-bg p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/tutorials/mine" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-3.5 h-3.5" /> My submissions
          </Link>
        </div>

        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-3xl">{editingId ? "Edit tutorial" : "Submit a tutorial"}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Share a step-by-step look or routine with the Glamr community. Submissions are reviewed by a moderator before they appear in the public catalogue.
          </p>
        </header>

        {existing?.status === "rejected" && existing.moderationNote && (
          <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">A moderator sent this back</p>
              <p className="text-muted-foreground mt-0.5">{existing.moderationNote}</p>
            </div>
          </div>
        )}

        {locked && (
          <div className="bg-muted border border-border rounded-xl p-3 text-sm text-muted-foreground">
            This tutorial is {existing?.status === "pending" ? "pending review" : "live"} — editing is disabled.
            {existing?.status === "published" || existing?.status === "featured" ? (
              <> <Link href={`/tutorials/${existing.id}`} className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                View it <ExternalLink className="w-3 h-3" />
              </Link></>
            ) : null}
          </div>
        )}

        <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
          {/* Basics */}
          <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Basics</h2>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 5-minute glazed donut skin"
                maxLength={120}
              />
            </Field>
            <Field label="One-line summary">
              <Input
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="What makes this look special?"
                maxLength={240}
              />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as TutorialCategory })}
                  className="w-full bg-background border border-input rounded-md h-9 px-2 text-sm"
                >
                  {TUTORIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{TUTORIAL_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Difficulty">
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value as TutorialDifficulty })}
                  className="w-full bg-background border border-input rounded-md h-9 px-2 text-sm"
                >
                  {TUTORIAL_DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{TUTORIAL_DIFFICULTY_LABELS[d]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Minutes">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={180}
                  value={form.minutes}
                  onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                />
              </Field>
            </div>
          </section>

          {/* Hero image */}
          <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Hero image</h2>
            <ThumbnailPicker
              value={form.thumbnail}
              onChange={(url) => setForm({ ...form, thumbnail: url })}
              disabled={locked}
            />
          </section>

          {/* Tools */}
          <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">What you'll need</h2>
            <ul className="space-y-2">
              {form.tools.map((tool, i) => (
                <li key={i} className="flex gap-2">
                  <Input
                    value={tool}
                    onChange={(e) => {
                      const next = [...form.tools];
                      next[i] = e.target.value;
                      setForm({ ...form, tools: next });
                    }}
                    placeholder={`Tool ${i + 1}`}
                    maxLength={120}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setForm({ ...form, tools: form.tools.filter((_, j) => j !== i) })}
                    disabled={form.tools.length === 1}
                    aria-label="Remove tool"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({ ...form, tools: [...form.tools, ""] })}
              disabled={form.tools.length >= 20}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add tool
            </Button>
          </section>

          {/* Steps */}
          <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Step by step</h2>
            <ol className="space-y-3">
              {form.steps.map((step, i) => (
                <li key={i} className="border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Step {i + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}
                      disabled={form.steps.length <= 2}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove step ${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={step.title}
                    onChange={(e) => {
                      const next = [...form.steps];
                      next[i] = { ...next[i], title: e.target.value };
                      setForm({ ...form, steps: next });
                    }}
                    placeholder="Step title"
                    maxLength={120}
                  />
                  <Textarea
                    value={step.body}
                    onChange={(e) => {
                      const next = [...form.steps];
                      next[i] = { ...next[i], body: e.target.value };
                      setForm({ ...form, steps: next });
                    }}
                    placeholder="What does the reader do here?"
                    rows={3}
                    maxLength={1000}
                  />
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({ ...form, steps: [...form.steps, { title: "", body: "" }] })}
              disabled={form.steps.length >= 20}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add step
            </Button>
          </section>

          {/* Pro tip */}
          <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Pro tip (optional)</h2>
            <Textarea
              value={form.proTip}
              onChange={(e) => setForm({ ...form, proTip: e.target.value })}
              placeholder="One standout trick that makes the difference."
              rows={2}
              maxLength={500}
            />
          </section>
        </fieldset>

        {!locked && issues.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3 text-sm">
            <p className="font-semibold mb-1">Before submitting, please fix:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
              {issues.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        )}

        {!locked && (
          <div className="flex flex-wrap items-center gap-2 sticky bottom-2 bg-background/80 backdrop-blur border border-border rounded-xl p-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => save.mutate()}
              disabled={save.isPending || submit.isPending}
            >
              <Save className="w-4 h-4 mr-1" /> {save.isPending ? "Saving…" : "Save draft"}
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              onClick={() => submit.mutate()}
              disabled={!canSubmit || submit.isPending}
            >
              <Send className="w-4 h-4 mr-1" /> {submit.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// Mirrors the server-side Zod constraints so the user gets immediate
// feedback (rather than discovering everything at submit time). The server
// re-validates either way — this is purely UX.
function validate(f: DraftForm): string[] {
  const out: string[] = [];
  if (f.title.trim().length < 4) out.push("Title needs at least 4 characters.");
  if (f.summary.trim().length < 10) out.push("Summary needs at least 10 characters.");
  const m = Number(f.minutes);
  if (!Number.isFinite(m) || m < 1 || m > 180) out.push("Minutes must be between 1 and 180.");
  if (!f.thumbnail.trim()) out.push("Add a hero image.");
  if (f.tools.map((t) => t.trim()).filter(Boolean).length < 1) out.push("Add at least one tool.");
  const validSteps = f.steps.filter((s) => s.title.trim() && s.body.trim());
  if (validSteps.length < 2) out.push("Add at least two complete steps.");
  return out;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ThumbnailPicker({
  value, onChange, disabled,
}: { value: string; onChange: (url: string) => void; disabled: boolean }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
          <img src={value} alt="Tutorial hero" className="absolute inset-0 w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 border border-border"
              aria-label="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="aspect-[16/9] w-full rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
          {uploading ? "Uploading…" : "No image yet"}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={10 * 1024 * 1024}
          onGetUploadParameters={async (file) => {
            const presigned = await api.post<{ uploadURL: string; objectPath: string }>(
              "/storage/uploads/request-url",
              { name: file.name ?? `tutorial-${Date.now()}.png`, size: file.size ?? 0, contentType: file.type ?? "image/png" },
            );
            // Stash the eventual public path on the file so onComplete can wire it back.
            (file as unknown as { meta: { objectPath: string } }).meta = { objectPath: presigned.objectPath };
            return { method: "PUT", url: presigned.uploadURL, headers: { "Content-Type": file.type ?? "application/octet-stream" } };
          }}
          onComplete={(res) => {
            setUploading(false);
            const file = res.successful?.[0];
            const op = (file as unknown as { meta?: { objectPath?: string } } | undefined)?.meta?.objectPath;
            if (op) onChange(`/api/storage${op}`);
            else toast({ title: "Upload didn't return a path", variant: "destructive" });
          }}
          buttonClassName="inline-flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 text-sm font-semibold"
        >
          <ImagePlus className="w-4 h-4" /> Upload image
        </ObjectUploader>
        <span className="text-xs text-muted-foreground">or</span>
        <Input
          value={value.startsWith("/api/storage/") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste an https:// image URL"
          className="flex-1 min-w-[180px]"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default function TutorialSubmit() {
  return (
    <AuthedRoute>
      <TutorialSubmitInner />
    </AuthedRoute>
  );
}
