import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Plus, Trash2, Camera, Star, ChevronDown, ChevronUp, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiaryEntry {
  id: string;
  date: string;          // ISO date string
  lookName: string;
  lookId?: string;
  mood: string;
  notes: string;
  rating: number;        // 1–5
  skinCondition: string; // "Good" | "OK" | "Rough"
  products: string[];    // list of products used
  tags: string[];
  screenshot?: string;   // base64 data URL if user took one
}

const MOODS = ["✨ Glowing", "🌸 Soft", "🔥 Fierce", "💪 Confident", "😌 Relaxed", "💫 Radiant", "🎭 Dramatic", "🌿 Natural"];
const SKIN_CONDITIONS = ["Good", "OK", "Rough"];
const CONDITION_COLORS = { Good: "text-green-600", OK: "text-yellow-600", Rough: "text-red-600" };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-xl transition-colors ${(hover || value) >= n ? "text-primary" : "text-muted-foreground/30"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function EntryCard({ entry, onDelete }: { entry: DiaryEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(entry.date);
  const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="shrink-0 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-primary leading-none">{date.getDate()}</span>
            <span className="text-xs text-muted-foreground leading-none">{date.toLocaleDateString("en-GB", { month: "short" })}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="font-serif font-bold text-base leading-tight">{entry.lookName}</p>
            <span className={`text-xs font-medium ${CONDITION_COLORS[entry.skinCondition as keyof typeof CONDITION_COLORS]}`}>
              {entry.skinCondition} skin
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating value={entry.rating} />
            <span className="text-xs text-muted-foreground">{entry.mood}</span>
          </div>
          {entry.notes && <p className="text-xs text-muted-foreground line-clamp-1">{entry.notes}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">{dateStr}</p>
              {entry.notes && (
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-foreground leading-relaxed">{entry.notes}</p>
                </div>
              )}
              {entry.products.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Products Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.products.map(p => <span key={p} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{p}</span>)}
                  </div>
                </div>
              )}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map(t => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">#{t}</span>)}
                </div>
              )}
              {entry.lookId && (
                <Link href={`/try-on/${entry.lookId}`}>
                  <Button size="sm" className="gap-1.5 text-xs rounded-full">
                    <Camera className="w-3 h-3" />Try This Look Again
                  </Button>
                </Link>
              )}
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <Trash2 className="w-3 h-3" />Delete entry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const STORAGE_KEY = "beat-skin-diary";

function loadEntries(): DiaryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveEntries(entries: DiaryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function SkinDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>(loadEntries);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<Omit<DiaryEntry, "id" | "date">>({
    lookName: "",
    mood: MOODS[0],
    notes: "",
    rating: 5,
    skinCondition: "Good",
    products: [],
    tags: [],
  });
  const [productInput, setProductInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const addEntry = () => {
    if (!form.lookName.trim()) return;
    const entry: DiaryEntry = {
      ...form,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setShowForm(false);
    setForm({ lookName: "", mood: MOODS[0], notes: "", rating: 5, skinCondition: "Good", products: [], tags: [] });
    setProductInput("");
    setTagInput("");
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const stats = useMemo(() => ({
    total: entries.length,
    avgRating: entries.length ? (entries.reduce((s, e) => s + e.rating, 0) / entries.length).toFixed(1) : "–",
    topLook: entries.length
      ? (() => {
          const counts: Record<string, number> = {};
          entries.forEach(e => { counts[e.lookName] = (counts[e.lookName] || 0) + 1; });
          return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "–";
        })()
      : "–",
    thisMonth: entries.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  }), [entries]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold">Skin Diary</h1>
            <p className="text-xs text-muted-foreground">Track your looks & skin journey</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? "Cancel" : <><Plus className="w-3.5 h-3.5" />Add Entry</>}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total, icon: BookOpen },
            { label: "Avg Rating", value: stats.avgRating, icon: Star },
            { label: "This Month", value: stats.thisMonth, icon: Calendar },
            { label: "Top Look", value: stats.topLook.split(" ").slice(0, 2).join(" ") || "–", icon: Sparkles },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3 text-center">
              <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="font-bold text-base text-foreground">{String(s.value)}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add Entry Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4"
            >
              <h3 className="font-serif font-bold text-lg">New Entry</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Look Name *</label>
                <Input
                  value={form.lookName}
                  onChange={e => setForm(f => ({ ...f, lookName: e.target.value }))}
                  placeholder="e.g. Soft Glam, Clean Girl, Night Out"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mood</label>
                  <select
                    className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
                    value={form.mood}
                    onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
                  >
                    {MOODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skin Condition</label>
                  <select
                    className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
                    value={form.skinCondition}
                    onChange={e => setForm(f => ({ ...f, skinCondition: e.target.value }))}
                  >
                    {SKIN_CONDITIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</label>
                <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm min-h-[72px] resize-none"
                  placeholder="How did it go? Any tips for next time?"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products Used</label>
                <div className="flex gap-2">
                  <Input
                    value={productInput}
                    onChange={e => setProductInput(e.target.value)}
                    placeholder="e.g. Charlotte Tilbury Pillow Talk"
                    onKeyDown={e => {
                      if (e.key === "Enter" && productInput.trim()) {
                        setForm(f => ({ ...f, products: [...f.products, productInput.trim()] }));
                        setProductInput("");
                      }
                    }}
                  />
                  <Button
                    size="sm" variant="outline"
                    onClick={() => {
                      if (productInput.trim()) {
                        setForm(f => ({ ...f, products: [...f.products, productInput.trim()] }));
                        setProductInput("");
                      }
                    }}
                  >Add</Button>
                </div>
                {form.products.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.products.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setForm(f => ({ ...f, products: f.products.filter((_, j) => j !== i) }))}
                        className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        {p} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value.replace(/\s/g, ""))}
                    placeholder="e.g. date-night, summer, festival"
                    onKeyDown={e => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
                        setTagInput("");
                      }
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (tagInput.trim()) { setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] })); setTagInput(""); }
                  }}>Add</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t, i) => (
                      <button key={i} onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive">
                        #{t} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={addEntry} className="w-full rounded-full" disabled={!form.lookName.trim()}>
                Save Entry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries */}
        {entries.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-14 h-14 text-muted-foreground/25 mb-4" />
            <p className="font-serif text-xl text-foreground mb-1">Your diary is empty</p>
            <p className="text-sm text-muted-foreground mb-4">Start tracking your looks, products, and skin journey.</p>
            <Button onClick={() => setShowForm(true)} className="rounded-full gap-1.5">
              <Plus className="w-4 h-4" />Add First Entry
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map(entry => (
                <EntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
