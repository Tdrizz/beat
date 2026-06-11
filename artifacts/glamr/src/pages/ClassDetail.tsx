import { useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, Crown, Users, Video, Check, ArrowLeft, Lock, UserPlus } from "lucide-react";
import { useAuth } from "@clerk/react";
import { api, type ClassRow } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/usePremium";

interface ClassDetailResp { class: ClassRow }

export default function ClassDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, navigate] = useLocation();
  const { isSignedIn } = useAuth();
  const { active: isPremium } = usePremium();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<ClassDetailResp>({
    queryKey: ["class", id],
    queryFn: () => api.get<ClassDetailResp>(`/classes/${id}`),
    enabled: !!id,
  });

  const c = data?.class;
  const upcoming = useMemo(() => c ? new Date(c.scheduledFor).getTime() > Date.now() : false, [c]);

  const reserve = useMutation({
    mutationFn: async () => {
      if (c!.reservedByMe) await api.del(`/classes/${id}/reserve`);
      else await api.post(`/classes/${id}/reserve`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class", id] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: c!.reservedByMe ? "Reservation cancelled" : "You're in!", description: c!.reservedByMe ? undefined : "We'll see you in class." });
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes("premium")) {
        toast({ title: "Premium class", description: "Upgrade to reserve this class.", variant: "destructive" });
        navigate("/premium");
      } else {
        toast({ title: "Could not update reservation", description: err.message, variant: "destructive" });
      }
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!c) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>Class not found.</p>
        <Link href="/classes"><Button variant="outline" size="sm" className="rounded-full">Back to classes</Button></Link>
      </div>
    );
  }

  // Server redacts videoUrl when the viewer isn't entitled, so `canWatch`
  // is the source of truth — never gate purely on isPremium client-side.
  const watchableNow = c.canWatch && !!c.videoUrl;
  const lockedPremium = c.isPremium && !c.canWatch;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <Link href="/classes">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2 gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Classes
          </Button>
        </Link>
      </div>

      <header
        className="max-w-3xl mx-auto mt-3 rounded-3xl overflow-hidden border border-border/60 relative"
        style={c.coverUrl
          ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg,#f9c5d1,#c4b6f6,#9ad6e4)" }}
      >
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-10 min-h-[260px] flex flex-col justify-end text-white">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`rounded-full text-[10px] tracking-wide uppercase ${c.isPremium ? "bg-amber-400 text-amber-950 hover:bg-amber-400" : "bg-white/20 hover:bg-white/20"}`}>
              {c.isPremium ? <><Crown className="w-3 h-3 mr-0.5" /> Premium</> : "Free"}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[10px] bg-white/10 border-white/30 text-white">{c.moodTag}</Badge>
            <Badge variant="outline" className="rounded-full text-[10px] bg-white/10 border-white/30 text-white">{c.difficulty}</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold drop-shadow-sm">{c.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-white/90">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(c.scheduledFor).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.durationMin} min</span>
            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.reservationCount} reserved</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
        <div className="space-y-6">
          {c.description && (
            <section>
              <h2 className="font-serif text-xl mb-2">About</h2>
              <p className="text-sm text-foreground/90 whitespace-pre-line">{c.description}</p>
            </section>
          )}

          {c.learnings.length > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-2">What you'll learn</h2>
              <ul className="space-y-2">
                {c.learnings.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-3xl border border-border/60 p-4 bg-card/60 backdrop-blur-sm">
            <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Instructor</h2>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {c.instructor?.avatarUrl && <AvatarImage src={c.instructor.avatarUrl} alt={c.instructor.handle} />}
                <AvatarFallback>{(c.instructor?.handle ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.instructor?.displayName ?? "Beat creator"}</p>
                <p className="text-xs text-muted-foreground truncate">@{c.instructor?.handle ?? "creator"}</p>
              </div>
              {c.instructor && (
                <Link href={`/u/${c.instructor.handle}`}>
                  <Button size="sm" variant="outline" className="rounded-full gap-1">
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </Button>
                </Link>
              )}
            </div>
          </section>
        </div>

        <aside className="sm:w-64 space-y-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/0 p-4">
            {!isSignedIn ? (
              <Link href="/sign-in">
                <Button className="w-full rounded-full">Sign in to reserve</Button>
              </Link>
            ) : lockedPremium ? (
              <Link href="/premium">
                <Button className="w-full rounded-full gap-1.5 bg-amber-400 text-amber-950 hover:bg-amber-300">
                  <Lock className="w-4 h-4" /> Upgrade to Premium
                </Button>
              </Link>
            ) : watchableNow ? (
              <a href={c.videoUrl!} target="_blank" rel="noopener noreferrer">
                <Button className="w-full rounded-full gap-1.5">
                  <Video className="w-4 h-4" /> Watch now
                </Button>
              </a>
            ) : (
              <Button
                className="w-full rounded-full"
                onClick={() => reserve.mutate()}
                disabled={reserve.isPending}
                variant={c.reservedByMe ? "outline" : "default"}
              >
                {reserve.isPending ? "Working…"
                  : c.reservedByMe ? "Cancel reservation"
                  : upcoming ? "Reserve your spot" : "RSVP"}
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              {c.isPremium && !isPremium
                ? "Premium unlocks every premium class plus the ability to host your own."
                : c.reservedByMe ? "You'll be notified before it begins."
                : upcoming ? "Free to reserve. We'll send a reminder."
                : "Catch up on demand."}
            </p>
          </motion.div>
        </aside>
      </main>
    </div>
  );
}
