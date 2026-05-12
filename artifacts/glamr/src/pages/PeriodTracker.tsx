import { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, CalendarDays, Droplets, Moon,
  Sun, Flower2, Sparkles, Heart, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const LS_KEY = "glamr-period-tracker";

interface CycleEntry {
  id: string;
  startDate: string;
  endDate?: string;
  flow: "Light" | "Medium" | "Heavy";
  symptoms: string[];
  notes: string;
}

const SYMPTOM_OPTIONS = [
  "Cramps", "Headache", "Bloating", "Fatigue", "Mood swings",
  "Acne breakout", "Back pain", "Cravings", "Tender skin", "Insomnia",
];

const FLOW_COLORS = { Light: "text-pink-400", Medium: "text-rose-500", Heavy: "text-red-600" };
const FLOW_ICONS = { Light: "🩸", Medium: "🩸🩸", Heavy: "🩸🩸🩸" };

interface PhaseInfo {
  name: string;
  day: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  skinTip: string;
  makeupTip: string;
  selfCare: string;
}

function getPhaseInfo(dayInCycle: number, cycleLength: number): PhaseInfo {
  if (dayInCycle <= 5) {
    return {
      name: "Menstrual",
      day: `Day ${dayInCycle}`,
      icon: <Droplets className="w-5 h-5" />,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      skinTip: "Skin is most sensitive now. Stick to gentle, fragrance-free products. Hydrate heavily — your skin barrier is at its weakest.",
      makeupTip: "Go minimal. A tinted moisturiser, cream blush, and lip balm will feel comfortable without irritating tender skin.",
      selfCare: "Warm compresses, iron-rich foods, and gentle movement. This is your rest phase — honour it.",
    };
  }
  if (dayInCycle <= 13) {
    return {
      name: "Follicular",
      day: `Day ${dayInCycle}`,
      icon: <Flower2 className="w-5 h-5" />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      skinTip: "Rising oestrogen means plumper, glowier skin. Great time to try new actives like vitamin C or gentle exfoliants.",
      makeupTip: "Your skin is glowing naturally — lean into dewy finishes, glass-skin techniques, and sheer washes of colour.",
      selfCare: "Energy is climbing. Try more vigorous workouts, socialise, and experiment with bold new looks.",
    };
  }
  if (dayInCycle <= 16) {
    return {
      name: "Ovulation",
      day: `Day ${dayInCycle}`,
      icon: <Sun className="w-5 h-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      skinTip: "Peak glow! Skin looks its best. Minimal skincare needed — just SPF and hydration. Avoid heavy actives.",
      makeupTip: "This is your 'hot girl' window. Go full glam if you want — your skin can handle bold colour, shimmer, and full coverage.",
      selfCare: "Confidence peaks now. Perfect time for selfies, try-ons, and social events.",
    };
  }
  return {
    name: "Luteal",
    day: `Day ${dayInCycle}`,
    icon: <Moon className="w-5 h-5" />,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    skinTip: "Progesterone rises — expect oilier skin, possible breakouts. Use salicylic acid, niacinamide, and oil-free moisturiser.",
    makeupTip: "Mattifying primer is your best friend. Set with powder, skip heavy cream products, and use oil-blotting sheets.",
    selfCare: "Cravings and mood shifts are normal. Prioritise magnesium-rich foods, calming routines, and earlier bedtimes.",
  };
}

function estimateCycleLength(entries: CycleEntry[]): number {
  if (entries.length < 2) return 28;
  const sorted = [...entries].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i].startDate).getTime() - new Date(sorted[i - 1].startDate).getTime()) / 86400000);
    if (diff >= 18 && diff <= 45) gaps.push(diff);
  }
  if (gaps.length === 0) return 28;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function loadEntries(): CycleEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries: CycleEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

function PhaseCard({ phase }: { phase: PhaseInfo }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      className={`rounded-2xl border border-border overflow-hidden ${phase.bgColor}`}
    >
      <button
        className="w-full p-4 flex items-center gap-3 text-left"
        onClick={() => setExpanded(o => !o)}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phase.color} bg-white/60 dark:bg-white/10`}>
          {phase.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-serif font-bold text-lg ${phase.color}`}>{phase.name} Phase</p>
          <p className="text-xs text-muted-foreground">{phase.day} of your cycle</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <TipRow icon={<Heart className="w-4 h-4 text-pink-500" />} label="Skin" text={phase.skinTip} />
              <TipRow icon={<Sparkles className="w-4 h-4 text-amber-500" />} label="Makeup" text={phase.makeupTip} />
              <TipRow icon={<Moon className="w-4 h-4 text-violet-500" />} label="Self-care" text={phase.selfCare} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TipRow({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function EntryRow({ entry, onDelete }: { entry: CycleEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const d = new Date(entry.startDate);
  const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const duration = entry.endDate
    ? Math.ceil((new Date(entry.endDate).getTime() - d.getTime()) / 86400000) + 1
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <Droplets className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-sm">{dateStr}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={FLOW_COLORS[entry.flow]}>{FLOW_ICONS[entry.flow]} {entry.flow}</span>
            {duration && <span>· {duration} day{duration > 1 ? "s" : ""}</span>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {entry.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.symptoms.map(s => (
                    <span key={s} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
              {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
              <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={onDelete}>
                <Trash2 className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PeriodTracker() {
  const [entries, setEntries] = useState<CycleEntry[]>(loadEntries);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [flow, setFlow] = useState<CycleEntry["flow"]>("Medium");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [entries],
  );

  const cycleLength = useMemo(() => estimateCycleLength(entries), [entries]);

  const currentPhase = useMemo(() => {
    if (sorted.length === 0) return null;
    const latest = sorted[0];
    const days = daysSince(latest.startDate);
    const dayInCycle = (days % cycleLength) + 1;
    return getPhaseInfo(dayInCycle, cycleLength);
  }, [sorted, cycleLength]);

  const nextPeriod = useMemo(() => {
    if (sorted.length === 0) return null;
    const latest = new Date(sorted[0].startDate);
    const next = new Date(latest.getTime() + cycleLength * 86400000);
    const daysUntil = Math.ceil((next.getTime() - Date.now()) / 86400000);
    return { date: next, daysUntil: Math.max(0, daysUntil) };
  }, [sorted, cycleLength]);

  const toggleSymptom = useCallback((s: string) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);

  const formValid = useMemo(() => {
    if (!startDate) return false;
    if (endDate && endDate < startDate) return false;
    return true;
  }, [startDate, endDate]);

  const addEntry = useCallback(() => {
    if (!formValid) return;
    const entry: CycleEntry = {
      id: crypto.randomUUID(),
      startDate,
      endDate: endDate || undefined,
      flow,
      symptoms,
      notes,
    };
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(next);
    setShowForm(false);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setFlow("Medium");
    setSymptoms([]);
    setNotes("");
  }, [startDate, endDate, flow, symptoms, notes, entries]);

  const deleteEntry = useCallback((id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }, [entries]);

  return (
    <div className="min-h-screen vanity-bg pb-28">
      <main className="max-w-xl mx-auto px-4 pt-20 pb-8">
        <Link href="/">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl font-bold mb-1">Cycle Tracker</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Track your cycle, understand your skin, and adapt your beauty routine to each phase.
          </p>
        </motion.div>

        {currentPhase && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <PhaseCard phase={currentPhase} />
          </motion.div>
        )}

        {nextPeriod && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="font-serif font-bold text-sm">Next period</p>
              <p className="text-xs text-muted-foreground">
                {nextPeriod.daysUntil === 0
                  ? "Expected today"
                  : `In ~${nextPeriod.daysUntil} day${nextPeriod.daysUntil > 1 ? "s" : ""} (${nextPeriod.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })})`}
              </p>
            </div>
          </motion.div>
        )}

        {entries.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Info className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="font-serif font-bold text-sm">Average cycle</p>
              <p className="text-xs text-muted-foreground">{cycleLength} days (based on {entries.length} logged periods)</p>
            </div>
          </motion.div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold">Log</h2>
          <Button
            size="sm"
            className="rounded-full gap-1"
            onClick={() => setShowForm(f => !f)}
          >
            <Plus className="w-4 h-4" /> Log period
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-border bg-card p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Start date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">End date <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-2">Flow</label>
                  <div className="flex gap-2">
                    {(["Light", "Medium", "Heavy"] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFlow(f)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                          flow === f
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {FLOW_ICONS[f]} {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-2">Symptoms</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SYMPTOM_OPTIONS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSymptom(s)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                          symptoms.includes(s)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="How are you feeling?"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                  />
                </div>

                {endDate && endDate < startDate && (
                  <p className="text-xs text-destructive">End date cannot be before start date.</p>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1 rounded-full" onClick={addEntry} disabled={!formValid}>
                    Save
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map(e => (
              <EntryRow key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />
            ))}
          </AnimatePresence>

          {sorted.length === 0 && !showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Droplets className="w-10 h-10 mx-auto mb-3 text-rose-300" />
              <p className="font-serif text-lg font-bold mb-1">No periods logged yet</p>
              <p className="text-sm">Tap "Log period" to start tracking your cycle and get personalised beauty tips.</p>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-8 rounded-2xl border border-border bg-card p-4"
        >
          <h3 className="font-serif font-bold text-sm mb-2">How it works</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex gap-2"><span className="text-rose-400 shrink-0">1.</span> Log each period's start date (and optionally end date).</li>
            <li className="flex gap-2"><span className="text-rose-400 shrink-0">2.</span> After 2+ entries, we estimate your average cycle length.</li>
            <li className="flex gap-2"><span className="text-rose-400 shrink-0">3.</span> See which phase you're in and get tailored skin, makeup, and self-care tips.</li>
            <li className="flex gap-2"><span className="text-rose-400 shrink-0">4.</span> Everything stays on your device — nothing is sent to our servers.</li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
