import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, Crown, Video, Users, Plus } from "lucide-react";
import { api, type ClassRow } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClassesResponse { classes: ClassRow[] }

// Every filter pill is paired with a small model thumbnail so the rail
// itself doubles as a visual mood board. Imagery is intentionally
// diverse — African American, Latina, Asian, SWANA, South Asian — so the
// catalog's first impression reflects Beat's audience.
type WhenFilter = "upcoming" | "past";
const WHEN_TABS: { value: WhenFilter; label: string; image: string }[] = [
  { value: "upcoming", label: "Upcoming", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=160&q=80&auto=format&fit=crop" },
  { value: "past",     label: "Past",     image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=160&q=80&auto=format&fit=crop" },
];

type MoodFilter = "all" | "everyday" | "soft" | "bold" | "editorial" | "bridal" | "drag" | "pageant" | "party";
const MOOD_TABS: { value: MoodFilter; label: string; image: string }[] = [
  { value: "all",       label: "All",       image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=160&q=80&auto=format&fit=crop" },
  { value: "everyday",  label: "Everyday",  image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80&auto=format&fit=crop" },
  { value: "soft",      label: "Soft",      image: "https://images.unsplash.com/photo-1592621385612-4d7129426394?w=160&q=80&auto=format&fit=crop" },
  { value: "bold",      label: "Bold",      image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=160&q=80&auto=format&fit=crop" },
  { value: "editorial", label: "Editorial", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&q=80&auto=format&fit=crop" },
  { value: "bridal",    label: "Bridal",    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&q=80&auto=format&fit=crop" },
  { value: "drag",      label: "Drag",      image: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=160&q=80&auto=format&fit=crop" },
  { value: "pageant",   label: "Pageant",   image: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=160&q=80&auto=format&fit=crop" },
  { value: "party",     label: "Party",     image: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=160&q=80&auto=format&fit=crop" },
];

function ImagePill<T extends string>({
  active, label, image, onClick,
}: { active: boolean; label: string; image: string; onClick: () => void } & { _t?: T }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all shrink-0 ${
        active
          ? "border-primary bg-primary/10 text-foreground shadow-sm"
          : "border-border/60 bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        className="w-7 h-7 rounded-full object-cover ring-1 ring-border/40"
      />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const abs = Math.abs(diffMs);
  const day = 86_400_000;
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (abs < day) {
    if (diffMs >= 0) return `Today · ${time}`;
    return `Earlier today · ${time}`;
  }
  if (diffMs >= 0 && diffMs < 2 * day) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
}

function ClassCard({ c }: { c: ClassRow }) {
  const upcoming = new Date(c.scheduledFor).getTime() > Date.now();
  return (
    <Link href={`/classes/${c.id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        className="group relative cursor-pointer rounded-3xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-lg hover:border-primary/40 transition-all"
      >
        {/* Cover (or gradient fallback) */}
        <div
          className="aspect-[4/5] relative overflow-hidden"
          style={c.coverUrl
            ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(135deg,#f9c5d1 0%,#c4b6f6 50%,#9ad6e4 100%)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <Badge
              variant={c.isPremium ? "default" : "secondary"}
              className={`rounded-full text-[10px] tracking-wide uppercase ${c.isPremium ? "bg-amber-400 text-amber-950 hover:bg-amber-400" : ""}`}
            >
              {c.isPremium ? <><Crown className="w-3 h-3 mr-0.5" /> Premium</> : "Free"}
            </Badge>
            {!upcoming && (
              <Badge variant="outline" className="rounded-full text-[10px] bg-background/80">Past</Badge>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{c.moodTag} · {c.difficulty}</p>
            <h3 className="font-serif text-lg leading-tight font-semibold drop-shadow-sm">{c.title}</h3>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {c.instructor?.avatarUrl && <AvatarImage src={c.instructor.avatarUrl} alt={c.instructor.handle} />}
              <AvatarFallback className="text-[10px]">{(c.instructor?.handle ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">@{c.instructor?.handle ?? "creator"}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{formatWhen(c.scheduledFor)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{c.durationMin}m</span>
          </div>
          {(c.reservationCount > 0 || c.canWatch) && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {c.reservationCount > 0 && (
                <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{c.reservationCount} attending</span>
              )}
              {c.canWatch && c.videoUrl && (
                <span className="inline-flex items-center gap-1 text-primary"><Video className="w-3 h-3" />Watchable</span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function Classes() {
  const [when, setWhen] = useState<WhenFilter>("upcoming");
  const [mood, setMood] = useState<MoodFilter>("all");
  const { data, isLoading } = useQuery<ClassesResponse>({
    queryKey: ["classes", when, mood],
    queryFn: () => {
      const params = new URLSearchParams({ when });
      if (mood !== "all") params.set("mood", mood);
      return api.get<ClassesResponse>(`/classes?${params.toString()}`);
    },
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="max-w-6xl mx-auto px-4 pt-6 sm:pt-10 pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Beat Live</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold">Classes</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              Step-by-step makeup tutorials taught by Beat creators. Reserve a seat, learn live, or upgrade to host your own.
            </p>
          </div>
          <Link href="/host-class">
            <Button className="rounded-full gap-1.5">
              <Plus className="w-4 h-4" /> Host a class
            </Button>
          </Link>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {WHEN_TABS.map((t) => (
            <ImagePill
              key={t.value}
              active={when === t.value}
              label={t.label}
              image={t.image}
              onClick={() => setWhen(t.value)}
            />
          ))}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {MOOD_TABS.map((t) => (
            <ImagePill
              key={t.value}
              active={mood === t.value}
              label={t.label}
              image={t.image}
              onClick={() => setMood(t.value)}
            />
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (data?.classes.length ?? 0) === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-serif text-lg">No {when} classes yet</p>
            <p className="text-sm mt-1">Be the first — host one for the community.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {data!.classes.map((c) => <ClassCard key={c.id} c={c} />)}
          </div>
        )}
      </main>
    </div>
  );
}
