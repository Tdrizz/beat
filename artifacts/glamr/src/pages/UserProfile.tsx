import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { api, type Profile, type Post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles } from "lucide-react";
import { ARCHETYPES, pickFg, type ArchetypeId } from "@/lib/archetypes";

export default function UserProfile() {
  const [, params] = useRoute<{ handle: string }>("/u/:handle");
  const handle = params?.handle ?? "";
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => api.get<Profile>(`/profiles/${handle}`),
  });
  const { data: posts } = useQuery({
    queryKey: ["profile-posts", handle],
    queryFn: () => api.get<Post[]>(`/profiles/${handle}/posts`),
  });

  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : !profile ? (
          <p className="text-center text-muted-foreground py-12">User not found.</p>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold">
                  {profile.displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-serif text-2xl">{profile.displayName}</h1>
                <p className="text-sm text-muted-foreground">@{profile.handle}</p>
                {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
              </div>
              <Link href={`/messages/${profile.handle}`}>
                <Button size="sm" className="rounded-full gap-1.5"><MessageCircle className="w-4 h-4" /> Message</Button>
              </Link>
            </div>
            {profile.archetype && ARCHETYPES[profile.archetype as ArchetypeId] && (() => {
              const a = ARCHETYPES[profile.archetype as ArchetypeId];
              const isLight = pickFg(a.palette[1] ?? a.palette[0]) === "light";
              return (
                <div className="rounded-2xl overflow-hidden border border-border mb-6"
                     style={{ background: `linear-gradient(135deg, ${a.palette[0]} 0%, ${a.palette[2]} 100%)` }}>
                  <div className={`p-4 flex items-center gap-3 ${isLight ? "text-white" : "text-black/85"}`}>
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] uppercase tracking-[0.22em] ${isLight ? "text-white/65" : "text-black/55"}`}>Iola archetype</p>
                      <p className="font-serif text-xl font-bold leading-none">{a.name}</p>
                      <p className={`text-xs italic mt-0.5 ${isLight ? "text-white/80" : "text-black/70"}`}>{a.tagline}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {a.palette.slice(0, 4).map((hex) => (
                        <div key={hex} className="w-4 h-4 rounded-full ring-1 ring-white/40" style={{ background: hex }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-3 gap-1">
              {posts?.map((p) => (
                <Link key={p.id} href={`/posts/${p.id}`}>
                  <img src={p.imageUrl} alt="" className="aspect-square object-cover w-full bg-muted" />
                </Link>
              ))}
            </div>
            {posts && posts.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">No posts yet.</p>}
          </>
        )}
      </main>
    </div>
  );
}
