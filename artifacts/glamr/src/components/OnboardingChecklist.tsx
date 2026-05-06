import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Sparkles, Camera, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { api, type Post, type Profile } from "@/lib/api";

interface FollowStats {
  followers: number;
  following: number;
}

// First-run nudges. Replaces the empty Feed state. Each step looks at real DB
// data so it ticks itself off automatically as the user makes progress.
export function OnboardingChecklist() {
  const { isSignedIn } = useAuth();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Profile>("/me"),
    enabled: !!isSignedIn,
  });
  const { data: follows } = useQuery({
    queryKey: ["follow-stats", me?.handle],
    queryFn: () => api.get<FollowStats>(`/profiles/${me?.handle}/follow-stats`),
    enabled: !!isSignedIn && !!me?.handle,
  });
  const { data: myPosts } = useQuery({
    queryKey: ["my-posts", me?.handle],
    queryFn: () => api.get<Post[]>(`/profiles/${me?.handle}/posts`),
    enabled: !!isSignedIn && !!me?.handle,
  });

  if (!isSignedIn) return null;

  const hasFollowed = (follows?.following ?? 0) >= 5;
  const hasShared = (myPosts?.length ?? 0) >= 1;
  const hasTried = (myPosts ?? []).some((p) => p.lookId);

  const steps = [
    { done: hasFollowed, title: "Follow 5 creators", body: "Build a personalised feed", href: "/brands", icon: Users },
    { done: hasTried, title: "Try a look with AI", body: "See yourself in any palette", href: "/", icon: Camera },
    { done: hasShared, title: "Share your first result", body: "Other beats will heart you", href: "/upload", icon: Sparkles },
  ];

  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div>
        <h2 className="font-serif text-xl">Get the most out of Beat</h2>
        <p className="text-xs text-muted-foreground">{remaining} of {steps.length} steps left</p>
      </div>
      <ul className="space-y-2">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.title}>
              <Link href={s.href}>
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    s.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border hover:bg-muted/40 cursor-pointer"
                  }`}
                >
                  <div className="shrink-0">
                    {s.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.body}</p>
                  </div>
                  {!s.done && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
