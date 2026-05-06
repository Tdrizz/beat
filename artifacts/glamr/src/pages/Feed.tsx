import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Plus, Filter } from "lucide-react";
import { api, type Post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { SEASONS, SEASON_LABELS } from "@/lib/looks";

function PostCard({ post }: { post: Post }) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () =>
      post.likedByMe ? api.del(`/posts/${post.id}/like`) : api.post(`/posts/${post.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        {post.author?.avatarUrl ? (
          <img src={post.author.avatarUrl} className="w-9 h-9 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
            {post.author?.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {post.author && (
            <Link href={`/u/${post.author.handle}`}>
              <p className="text-sm font-semibold hover:underline cursor-pointer">@{post.author.handle}</p>
            </Link>
          )}
          {post.season && <p className="text-xs text-muted-foreground">{post.season}</p>}
        </div>
        {post.author && (
          <Link href={`/messages/${post.author.handle}`}>
            <Button size="sm" variant="ghost" className="rounded-full"><MessageCircle className="w-4 h-4" /></Button>
          </Link>
        )}
      </div>
      <Link href={`/posts/${post.id}`}>
        <img src={post.imageUrl} alt="" className="w-full aspect-square object-cover bg-muted" />
      </Link>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3">
          <button onClick={() => like.mutate()} className="flex items-center gap-1.5 text-sm">
            <Heart className={`w-5 h-5 ${post.likedByMe ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>{post.likeCount}</span>
          </button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" /> {post.commentCount}
          </span>
        </div>
        {post.caption && <p className="text-sm whitespace-pre-wrap">{post.caption}</p>}
        {post.lookId && (
          <Link href={`/try-on/${post.lookId}`}>
            <Button size="sm" variant="outline" className="rounded-full text-xs">Try this look →</Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function Feed() {
  const [season, setSeason] = useState<string | null>(null);
  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed", season],
    queryFn: () => api.get<Post[]>(`/feed${season ? `?season=${encodeURIComponent(season)}` : ""}`),
  });

  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl">Feed</h1>
          <Link href="/upload">
            <Button size="sm" className="rounded-full gap-1.5"><Plus className="w-4 h-4" /> Share</Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Button size="sm" variant={season === null ? "default" : "outline"} className="rounded-full text-xs" onClick={() => setSeason(null)}>All</Button>
          {SEASONS.map((s) => (
            <Button key={s} size="sm" variant={season === s ? "default" : "outline"} className="rounded-full text-xs whitespace-nowrap" onClick={() => setSeason(s)}>{SEASON_LABELS[s]}</Button>
          ))}
        </div>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading feed…</p>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground">No posts yet. Be the first!</p>
            <Link href="/upload"><Button className="rounded-full">Share a look</Button></Link>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </main>
    </div>
  );
}
