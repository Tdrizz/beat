import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Star, Clock, ChevronLeft, Sparkles, ImageOff, Trash2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/api";
import NotFound from "@/pages/not-found";
import {
  getTutorial,
  resolveTutorialMediaUrl,
  TUTORIAL_CATEGORY_LABELS,
  TUTORIAL_DIFFICULTY_LABELS,
} from "@/lib/tutorials";

interface Review {
  id: string;
  tutorialId: string;
  authorId: string;
  rating: number;
  body: string;
  createdAt: string;
  author: Profile | null;
}

interface ReviewsResponse {
  averageRating: number;
  reviewCount: number;
  mine: Review | null;
  reviews: Review[];
}

export default function TutorialDetail() {
  const params = useParams<{ id: string }>();
  const tutorialId = params.id ?? "";
  const tutorial = getTutorial(tutorialId);
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [broken, setBroken] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tutorial-reviews", tutorialId],
    queryFn: () => api.get<ReviewsResponse>(`/tutorials/${tutorialId}/reviews`),
    enabled: !!tutorial,
  });

  if (!tutorial) return <NotFound />;

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All tutorials
          </Link>
        </div>

        <header className="space-y-3">
          <div className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl ${broken ? "bg-gradient-to-br from-primary/30 to-accent/30" : "bg-muted"}`}>
            {!broken ? (
              <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                onError={() => setBroken(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/70">
                <ImageOff className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
              {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold uppercase tracking-wider">
              {TUTORIAL_DIFFICULTY_LABELS[tutorial.difficulty]}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {tutorial.minutes} min
            </span>
            {(data?.reviewCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                {data!.averageRating.toFixed(1)}
                <span className="text-muted-foreground font-normal">
                  ({data!.reviewCount} {data!.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl leading-tight">{tutorial.title}</h1>
          <p className="text-sm text-muted-foreground">
            by <span className="font-semibold text-foreground">{tutorial.instructor}</span>
          </p>
          <p className="text-sm">{tutorial.summary}</p>
        </header>

        {/* What you need */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">What you'll need</h2>
          <ul className="text-sm space-y-1">
            {tutorial.tools.map((tool, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{tool}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Step by step</h2>
          <ol className="space-y-3">
            {tutorial.steps.map((s, i) => (
              <li key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.title}</p>
                  {s.videoUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden bg-black aspect-video">
                      <video
                        src={resolveTutorialMediaUrl(s.videoUrl)}
                        poster={resolveTutorialMediaUrl(s.videoPoster)}
                        controls
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-cover"
                        aria-label={`Demo clip for step ${i + 1}: ${s.title}`}
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {tutorial.proTip && (
          <section className="bg-accent/15 border border-accent/40 rounded-2xl p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Pro tip</p>
              <p className="text-sm text-muted-foreground mt-1">{tutorial.proTip}</p>
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Reviews
            </h2>
            {(data?.reviewCount ?? 0) > 0 && (
              <span className="text-sm text-muted-foreground">
                {data!.averageRating.toFixed(1)} / 5 · {data!.reviewCount}
              </span>
            )}
          </div>

          {isSignedIn ? (
            <ReviewForm
              tutorialId={tutorialId}
              existing={data?.mine ?? null}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["tutorial-reviews", tutorialId] });
                qc.invalidateQueries({ queryKey: ["tutorial-stats"] });
                toast({ title: "Review saved" });
              }}
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground text-center">
              <Link href="/sign-in" className="text-primary font-semibold hover:underline">Sign in</Link>{" "}
              to leave a review.
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reviews…</p>
          ) : (data?.reviews ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No reviews yet — be the first to share how it went.
            </p>
          ) : (
            <ul className="space-y-3">
              {data!.reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function ReviewForm({
  tutorialId,
  existing,
  onSaved,
}: {
  tutorialId: string;
  existing: Review | null;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [hover, setHover] = useState(0);
  const qc = useQueryClient();
  const { toast } = useToast();

  // Sync form state when the existing review loads after mount.
  useEffect(() => {
    if (existing) {
      setRating(existing.rating);
      setBody(existing.body);
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () => api.post(`/tutorials/${tutorialId}/reviews`, { rating, body: body.trim() }),
    onSuccess: onSaved,
    onError: (e: Error) => toast({ title: "Couldn't save review", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: () => api.del(`/tutorials/${tutorialId}/reviews/mine`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutorial-reviews", tutorialId] });
      qc.invalidateQueries({ queryKey: ["tutorial-stats"] });
      setRating(0);
      setBody("");
      toast({ title: "Review deleted" });
    },
    onError: (e: Error) => toast({ title: "Couldn't delete review", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold mb-2">{existing ? "Update your review" : "Rate this tutorial"}</p>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className="p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star className={`w-7 h-7 transition-colors ${filled ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
              </button>
            );
          })}
        </div>
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional: tell others what worked, what to skip, what you'd tweak…"
        maxLength={1000}
        rows={3}
        aria-label="Review text"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1" />
        {existing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => save.mutate()}
          disabled={rating === 0 || save.isPending}
        >
          {save.isPending ? "Saving…" : existing ? "Update review" : "Post review"}
        </Button>
      </div>
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const handle = review.author?.handle;
  const name = review.author?.displayName ?? review.author?.handle ?? "Someone";
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <li className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2">
        {review.author?.avatarUrl ? (
          <img
            src={review.author.avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {handle ? (
            <Link href={`/u/${handle}`} className="font-semibold text-sm hover:underline truncate block">
              {name}
            </Link>
          ) : (
            <p className="font-semibold text-sm truncate">{name}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`w-3.5 h-3.5 ${n <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"}`}
            />
          ))}
        </div>
      </div>
      {review.body && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">{review.body}</p>
      )}
    </li>
  );
}
