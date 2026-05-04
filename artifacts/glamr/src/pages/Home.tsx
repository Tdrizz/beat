import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { byEraLooks, celebrityLooks, eyeLooks, lipLooks, allCompleteLooks, Look } from "../lib/looks";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sparkles, Camera, Eye, Smile, Layers, Search, X } from "lucide-react";

type Difficulty = "All" | "Beginner" | "Intermediate" | "Advanced";

function LookCard({ look, index }: { look: Look; index: number }) {
  const gradientStyles = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      layout
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="h-32 w-full relative" style={gradientStyles}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
          <div className="absolute bottom-2 left-2 flex gap-2">
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-none text-xs">
              {look.difficulty}
            </Badge>
            <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-white border-white/20 text-xs">
              {look.timeEstimate}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2 flex-grow">
          <CardTitle className="font-serif text-lg text-foreground leading-snug">{look.name}</CardTitle>
          <CardDescription className="text-muted-foreground flex justify-between items-center">
            <span className="text-xs">{look.era || look.celebrity}</span>
            <span className="italic text-primary/80 text-xs">{look.mood}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link href={`/looks/${look.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full" data-testid={`btn-see-more-${look.id}`}>
              See More
            </Button>
          </Link>
          <Link href={`/try-on/${look.id}`} className="w-full">
            <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid={`btn-try-${look.id}`}>
              <Camera className="w-3 h-3 mr-1.5" />
              Try Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="text-primary">{icon}</div>
      <div>
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{count} look{count !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-3 flex flex-col items-center justify-center py-24 text-center"
    >
      <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <p className="text-lg font-serif text-foreground">No looks match "{query}"</p>
      <p className="text-sm text-muted-foreground mt-1">Try a different name, mood, or difficulty.</p>
    </motion.div>
  );
}

function LookGrid({ looks, query }: { looks: Look[]; query: string }) {
  if (looks.length === 0) return <EmptyState query={query} />;
  return (
    <AnimatePresence mode="popLayout">
      {looks.map((look, i) => (
        <LookCard key={look.id} look={look} index={i} />
      ))}
    </AnimatePresence>
  );
}

const DIFFICULTIES: Difficulty[] = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("All");

  function filterLooks(source: Look[]) {
    return source.filter(l => {
      const matchesQuery =
        query.trim() === "" ||
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.mood.toLowerCase().includes(query.toLowerCase()) ||
        (l.era || "").toLowerCase().includes(query.toLowerCase()) ||
        (l.celebrity || "").toLowerCase().includes(query.toLowerCase());
      const matchesDiff = difficulty === "All" || l.difficulty === difficulty;
      return matchesQuery && matchesDiff;
    });
  }

  const filtered = useMemo(() => ({
    complete: filterLooks(allCompleteLooks),
    era: filterLooks(byEraLooks),
    celebrity: filterLooks(celebrityLooks),
    eyes: filterLooks(eyeLooks),
    lips: filterLooks(lipLooks),
  }), [query, difficulty]);

  const hasQuery = query.trim() !== "" || difficulty !== "All";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">
      <header className="pt-14 pb-8 px-6 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary tracking-tight mb-3 flex items-center justify-center gap-3">
            Beat <Sparkles className="w-8 h-8 text-accent" />
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-light tracking-wide">
            Iconic artistry. Live on your face.
          </p>
        </motion.div>
      </header>

      {/* Search + Filter Bar */}
      <div className="max-w-2xl mx-auto px-6 mb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search looks, moods, eras, celebrities…"
            className="pl-9 pr-9 bg-card border-border focus-visible:ring-primary"
            data-testid="input-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="btn-clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              data-testid={`filter-difficulty-${d.toLowerCase()}`}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 ${
                difficulty === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6">
        <Tabs defaultValue="complete" className="w-full">
          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <TabsList className="bg-card border border-border flex-shrink-0 h-auto p-1 gap-1">
              <TabsTrigger
                value="complete"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-sm"
                data-testid="tab-complete"
              >
                <Layers className="w-3.5 h-3.5" />
                All Looks
              </TabsTrigger>
              <TabsTrigger
                value="era"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-sm"
                data-testid="tab-era"
              >
                By Era
              </TabsTrigger>
              <TabsTrigger
                value="celebrity"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-sm"
                data-testid="tab-celebrity"
              >
                Celebrity
              </TabsTrigger>
              <TabsTrigger
                value="eyes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-sm"
                data-testid="tab-eyes"
              >
                <Eye className="w-3.5 h-3.5" />
                Eyes
              </TabsTrigger>
              <TabsTrigger
                value="lips"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-sm"
                data-testid="tab-lips"
              >
                <Smile className="w-3.5 h-3.5" />
                Lips
              </TabsTrigger>
            </TabsList>
          </div>

          {(["complete", "era", "celebrity", "eyes", "lips"] as const).map(tab => {
            const sectionMap = {
              complete: { looks: filtered.complete, icon: <Layers className="w-5 h-5" />, title: "Complete Makeup Styles" },
              era: { looks: filtered.era, icon: <Sparkles className="w-5 h-5" />, title: "By Era" },
              celebrity: { looks: filtered.celebrity, icon: <Sparkles className="w-5 h-5" />, title: "Celebrity Icons" },
              eyes: { looks: filtered.eyes, icon: <Eye className="w-5 h-5" />, title: "Eye Styles" },
              lips: { looks: filtered.lips, icon: <Smile className="w-5 h-5" />, title: "Lip Styles" },
            };
            const { looks, icon, title } = sectionMap[tab];
            return (
              <TabsContent key={tab} value={tab} className="mt-0">
                <SectionHeader icon={icon} title={title} count={looks.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <LookGrid looks={looks} query={query} />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}
