import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  morningRoutine, eveningRoutine, weeklyTreatments,
  ingredients, holisticTips, skinTypeGuides,
  type RoutineStep, type Ingredient, type SkinType
} from "../lib/skincare";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft, Sun, Moon, Calendar, Leaf, FlaskConical,
  Heart, Droplets, Star, ChevronDown, ChevronUp, Info
} from "lucide-react";

function RoutineCard({ step, index }: { step: RoutineStep; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-primary">Step {step.step}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{step.duration}</span>
            </div>
            <p className="font-serif font-bold text-base text-foreground">{step.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{step.why}</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
        </button>

        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Why It Matters</p>
                <p className="text-sm text-foreground leading-relaxed">{step.why}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">How To Apply</p>
                <p className="text-sm text-foreground leading-relaxed">{step.how}</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <div className="flex items-start gap-2">
                  <Star className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed"><span className="font-semibold">Pro Tip: </span>{step.tip}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Product Category</p>
                <Badge variant="outline" className="text-xs">{step.productCategory}</Badge>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function IngredientCard({ ingredient, index }: { ingredient: Ingredient; index: number }) {
  const [open, setOpen] = useState(false);

  const categoryColors: Record<string, string> = {
    Hydrator: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Exfoliant: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    Antioxidant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "Cell-Turnover": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Barrier: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Brightener: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    Soothing: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "Anti-Aging": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
            {ingredient.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-serif font-bold text-base">{ingredient.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[ingredient.category] ?? "bg-muted text-muted-foreground"}`}>
                {ingredient.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{ingredient.what}</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>

        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border">
            <div className="p-4 space-y-3">
              <p className="text-sm text-foreground leading-relaxed">{ingredient.what}</p>

              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Benefits</p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredient.benefits.map(b => (
                    <span key={b} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">How to Use</p>
                <p className="text-sm text-foreground leading-relaxed">{ingredient.howToUse}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Pairs Well With</p>
                  <div className="space-y-1">
                    {ingredient.pairedWith.map(p => (
                      <p key={p} className="text-xs text-foreground">✓ {p}</p>
                    ))}
                  </div>
                </div>
                {ingredient.avoidWith.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Avoid Mixing</p>
                    <div className="space-y-1">
                      {ingredient.avoidWith.map(a => (
                        <p key={a} className="text-xs text-foreground">✗ {a}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-xl p-2.5">
                <p className="text-xs text-muted-foreground"><span className="font-semibold">Effective concentration: </span>{ingredient.concentration}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function HolisticCard({ tip, index }: { tip: typeof holisticTips[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const catColor: Record<string, string> = {
    Nutrition: "text-green-600", Hydration: "text-blue-600", Sleep: "text-indigo-600",
    Stress: "text-purple-600", Exercise: "text-orange-600", Environment: "text-teal-600", Habits: "text-pink-600",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">{tip.icon}</div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${catColor[tip.category]}`}>{tip.category}</p>
            <p className="font-serif font-bold text-base leading-snug">{tip.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tip.explanation.slice(0, 100)}…</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border">
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">The Science</p>
                <p className="text-sm text-foreground leading-relaxed">{tip.explanation}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">How To Do It</p>
                <p className="text-sm text-foreground leading-relaxed">{tip.howTo}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Leaf className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed"><span className="font-semibold">Skin Benefit: </span>{tip.skinBenefit}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

const SKIN_TYPES: SkinType[] = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

export default function Skincare() {
  const [selectedSkinType, setSelectedSkinType] = useState<SkinType>("Normal");

  const guide = skinTypeGuides.find(g => g.type === selectedSkinType)!;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold">Skincare Guide</h1>
          <p className="text-xs text-muted-foreground">Science-backed routines & holistic tips</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Tabs defaultValue="morning" className="w-full">
          <div className="overflow-x-auto pb-2 mb-6">
            <TabsList className="bg-card border border-border h-auto p-1 flex-shrink-0">
              <TabsTrigger value="morning" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-xs">
                <Sun className="w-3.5 h-3.5" />Morning
              </TabsTrigger>
              <TabsTrigger value="evening" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-xs">
                <Moon className="w-3.5 h-3.5" />Evening
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-xs">
                <Calendar className="w-3.5 h-3.5" />Weekly
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-xs">
                <FlaskConical className="w-3.5 h-3.5" />Ingredients
              </TabsTrigger>
              <TabsTrigger value="skintype" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-xs">
                <Info className="w-3.5 h-3.5" />Skin Type
              </TabsTrigger>
              <TabsTrigger value="holistic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-xs">
                <Leaf className="w-3.5 h-3.5" />Holistic
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="morning" className="mt-0 space-y-3">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Sun className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">Your morning routine focuses on <strong>protection</strong> — antioxidants, hydration, and SPF shield your skin from the day ahead.</p>
            </div>
            {morningRoutine.map((s, i) => <RoutineCard key={s.id} step={s} index={i} />)}
          </TabsContent>

          <TabsContent value="evening" className="mt-0 space-y-3">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">Your evening routine focuses on <strong>repair and transformation</strong> — active ingredients work overnight while skin regenerates 3x faster than during the day.</p>
            </div>
            {eveningRoutine.map((s, i) => <RoutineCard key={s.id} step={s} index={i} />)}
          </TabsContent>

          <TabsContent value="weekly" className="mt-0 space-y-3">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Calendar className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">Weekly treatments go beyond daily routines — targeted masks, tools, and deep treatments that accelerate your skincare results.</p>
            </div>
            {weeklyTreatments.map((s, i) => <RoutineCard key={s.id} step={s} index={i} />)}
          </TabsContent>

          <TabsContent value="ingredients" className="mt-0 space-y-3">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <FlaskConical className="w-4 h-4 text-violet-600 shrink-0" />
              <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">Understanding ingredients means understanding what actually works — and what doesn't. Every claim is rooted in published clinical research.</p>
            </div>
            {ingredients.map((ing, i) => <IngredientCard key={ing.id} ingredient={ing} index={i} />)}
          </TabsContent>

          <TabsContent value="skintype" className="mt-0">
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">What's your skin type?</p>
              <div className="flex gap-2 flex-wrap">
                {SKIN_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedSkinType(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      selectedSkinType === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {skinTypeGuides.find(g => g.type === t)?.icon} {t}
                  </button>
                ))}
              </div>
            </div>

            {guide && (
              <motion.div key={guide.type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{guide.icon}</span>
                    <div>
                      <h2 className="font-serif text-xl font-bold">{guide.type} Skin</h2>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">{guide.description}</p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Signs You Have {guide.type} Skin</p>
                      <ul className="space-y-1">
                        {guide.signs.map(s => <li key={s} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{s}</li>)}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Avoid</p>
                        <ul className="space-y-1">
                          {guide.avoid.map(a => <li key={a} className="text-xs flex items-start gap-1.5"><span className="text-red-500">✗</span>{a}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Embrace</p>
                        <ul className="space-y-1">
                          {guide.embrace.map(e => <li key={e} className="text-xs flex items-start gap-1.5"><span className="text-green-500">✓</span>{e}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Recommended Products</p>
                      <div className="flex flex-wrap gap-1.5">
                        {guide.topProducts.map(p => (
                          <span key={p} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="holistic" className="mt-0 space-y-3">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Leaf className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">Skincare doesn't start in the bathroom. What you eat, how you sleep, and how you manage stress are the foundations your topical products build upon.</p>
            </div>
            {holisticTips.map((tip, i) => <HolisticCard key={tip.id} tip={tip} index={i} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
