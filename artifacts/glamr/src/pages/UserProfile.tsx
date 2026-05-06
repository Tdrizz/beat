import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { api, type Profile, type Post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

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
