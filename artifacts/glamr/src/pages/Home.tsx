import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { byEraLooks, celebrityLooks, eyeLooks, lipLooks, allCompleteLooks, Look } from "../lib/looks";
import { useFavorites } from "../hooks/useFavorites";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sparkles, Camera, Eye, Smile, Layers, Search, X, Heart } from "lucide-react";

type Difficulty = "All" | "Beginner" | "Intermediate" | "Advanced";

function LookCard({
  look,
  index,
  isFav,
  onToggleFav,
}: {
  look: Look;
  index: number;
  isFav: boolean;
  onToggleFav: (id: string) => void;
}) {
  const gradientStyles = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      layout
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="h-32 w-full relative" style={gradientStyles}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />

          {/* Favorite heart button */}
          <button
            onClick={e => { e.preventDefault(); onToggleFav(look.id); }}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
            data-testid={`btn-fav-${look.id}`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-all duration-200 ${isFav ? "fill-rose-400 text-rose-400 scale-110" : "text-white"}`}
            />
          </button>

          <div className="absolute bottom-2 left-2 flex gap-1.5">
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

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-3 flex flex-col items-center justify-center py-24 text-center"
    >
      <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-lg font-serif text-foreground">{message}</p>
    </motion.div>
  );
}

function EmptyFavorites() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-3 flex flex-col items-center justify-center py-24 text-center"
    >
      <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-lg font-serif text-foreground">No saved looks yet</p>
      <p className="text-sm text-muted-foreground mt-1">Tap the heart on any look to save it here.</p>
    </motion.div>
  );
}

function LookGrid({
  looks,
  isFav,
  onToggleFav,
  emptyMessage,
}: {
  looks: Look[];
  isFav: (id: string) => boolean;
  onToggleFav: (id: string) => void;
  emptyMessage?: string;
}) {
  if (looks.length === 0) {
    return emptyMessage ? <EmptyState message={emptyMessage} /> : null;
  }
  return (
    <AnimatePresence mode="popLayout">
      {looks.map((look, i) => (
        <LookCard key={look.id} look={look} index={i} isFav={isFav(look.id)} onToggleFav={onToggleFav} />
      ))}
    </AnimatePresence>
  );
}

const DIFFICULTIES: Difficulty[] = ["All", "Beginner", "Intermediate", "Advanced"];
const ALL_LOOKS = [...allCompleteLooks, ...eyeLooks, ...lipLooks];

export default function Home() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("All");
  const { favorites, toggle, isFavorite } = useFavorites();

  function filterLooks(source: Look[]) {
    return source.filter(l => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.mood.toLowerCase().includes(q) ||
        (l.era || "").toLowerCase().includes(q) ||
        (l.celebrity || "").toLowerCase().includes(q);
      const matchesDiff = difficulty === "All" || l.difficulty === difficulty;
      return matchesQuery && matchesDiff;
    });
  }

  const favLooks = useMemo(
    () => filterLooks(ALL_LOOKS.filter(l => favorites.has(l.id))),
    [query, difficulty, favorites]
  );

  const filtered = useMemo(() => ({
    complete:  filterLooks(allCompleteLooks),
    era:       filterLooks(byEraLooks),
    celebrity: filterLooks(celebrityLooks),
    eyes:      filterLooks(eyeLooks),
    lips:      filterLooks(lipLooks),
  }), [query, difficulty]);

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

      {/* Search + Filter */}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              data-testid={`filter-${d.toLowerCase()}`}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
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
              >
                <Layers className="w-3.5 h-3.5" />
                All Looks
              </TabsTrigger>
              <TabsTrigger
                value="era"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-sm"
              >
                By Era
              </TabsTrigger>
              <TabsTrigger
                value="celebrity"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-sm"
              >
                Celebrity
              </TabsTrigger>
              <TabsTrigger
                value="eyes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                Eyes
              </TabsTrigger>
              <TabsTrigger
                value="lips"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-sm"
              >
                <Smile className="w-3.5 h-3.5" />
                Lips
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-3 py-2 text-sm"
                data-testid="tab-favorites"
              >
                <Heart className="w-3.5 h-3.5" />
                Saved
                {favorites.size > 0 && (
                  <span className="ml-1 text-xs bg-rose-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                    {favorites.size}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {(["complete", "era", "celebrity", "eyes", "lips"] as const).map(tab => {
            const meta = {
              complete:  { looks: filtered.complete,  icon: <Layers className="w-5 h-5" />, title: "Complete Makeup Styles" },
              era:       { looks: filtered.era,       icon: <Sparkles className="w-5 h-5" />, title: "By Era" },
              celebrity: { looks: filtered.celebrity, icon: <Sparkles className="w-5 h-5" />, title: "Celebrity Icons" },
              eyes:      { looks: filtered.eyes,      icon: <Eye className="w-5 h-5" />, title: "Eye Styles" },
              lips:      { looks: filtered.lips,      icon: <Smile className="w-5 h-5" />, title: "Lip Styles" },
            };
            const { looks, icon, title } = meta[tab];
            return (
              <TabsContent key={tab} value={tab} className="mt-0">
                <SectionHeader icon={icon} title={title} count={looks.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <LookGrid
                    looks={looks}
                    isFav={isFavorite}
                    onToggleFav={toggle}
                    emptyMessage={`No looks match your search.`}
                  />
                </div>
              </TabsContent>
            );
          })}

          <TabsContent value="favorites" className="mt-0">
            <SectionHeader
              icon={<Heart className="w-5 h-5 text-rose-400" />}
              title="Saved Looks"
              count={favLooks.length}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favLooks.length === 0 && favorites.size === 0 ? (
                <EmptyFavorites />
              ) : (
                <LookGrid
                  looks={favLooks}
                  isFav={isFavorite}
                  onToggleFav={toggle}
                  emptyMessage="No saved looks match your search."
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
