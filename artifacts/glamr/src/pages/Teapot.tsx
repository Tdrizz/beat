import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Plus, Coffee } from "lucide-react";
import { api, type Post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ShareToDmButton } from "@/components/ShareToDmButton";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { KindnessOverlay, useKindnessCheck } from "@/components/KindnessPrompt";

function TeapotPostCard({ post }: { post: Post }) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () =>
      post.likedByMe ? api.del(`/posts/${post.id}/like`) : api.post(`/posts/${post.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teapot"] }),
  });
  const shareBody = post.lookId
    ? `Try this look on Beat: ${window.location.origin}/try-on/${post.lookId}`
    : `Check this Beat post: ${window.location.origin}/posts/${post.id}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2 p-3">
        {post.author?.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            className="w-9 h-9 rounded-full object-cover"
            alt=""
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
            {post.author?.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {post.author && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/u/${post.author.handle}`}>
                <p className="text-sm font-semibold hover:underline cursor-pointer">
                  @{post.author.handle}
                </p>
              </Link>
              <ArchetypeBadge archetype={post.author.archetype} />
            </div>
          )}
        </div>
        {post.author && (
          <Link href={`/messages/${post.author.handle}`}>
            <Button size="sm" variant="ghost" className="rounded-full">
              <MessageCircle className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>
      <Link href={`/posts/${post.id}`}>
        <img
          src={post.imageUrl}
          alt=""
          className="w-full aspect-square object-cover bg-muted"
        />
      </Link>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => like.mutate()}
            className="flex items-center gap-1.5 text-sm"
            aria-label={post.likedByMe ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`w-5 h-5 ${post.likedByMe ? "fill-rose-500 text-rose-500" : ""}`}
            />
            <span>{post.likeCount}</span>
          </button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" /> {post.commentCount}
          </span>
          <div className="ml-auto">
            <ShareToDmButton shareBody={shareBody} />
          </div>
        </div>
        {post.caption && (
          <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
        )}
        {post.lookId && (
          <Link href={`/try-on/${post.lookId}`}>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-xs"
            >
              Try this look →
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function Teapot() {
  const { showOverlay, dismiss } = useKindnessCheck();
  const { data, isLoading } = useQuery({
    queryKey: ["teapot"],
    queryFn: () => {
      const params = new URLSearchParams({ scope: "foryou" });
      return api.get<{ posts: Post[]; nextCursor: string | null }>(
        `/feed?${params.toString()}`
      );
    },
  });
  const posts = data?.posts;

  return (
    <div className="min-h-screen vanity-bg">
      <KindnessOverlay visible={showOverlay} onDismiss={dismiss} />
      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500">
              <Coffee className="w-5 h-5 text-white" />
            </span>
            <div>
              <h1 className="font-serif text-3xl">The Teapot</h1>
              <p className="text-xs text-muted-foreground">
                Where the community spills the tea
              </p>
            </div>
          </div>
          <Link href="/upload">
            <Button size="sm" className="rounded-full gap-1.5">
              <Plus className="w-4 h-4" /> Spill
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-rose-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-2xl p-4 border border-rose-200/30 dark:border-rose-800/30">
          <p className="text-sm text-foreground/80 leading-relaxed text-center">
            This is our shared space — post your looks, share tips, hype each
            other up, and keep it kind. ☕✨
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">
            Brewing the tea…
          </p>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Coffee className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <p className="font-serif text-xl">The teapot is empty</p>
            <p className="text-sm text-muted-foreground">
              Be the first to spill! Share a look, a selfie, or a beauty tip.
            </p>
            <Link href="/upload">
              <Button className="rounded-full mt-2">
                Share your first post
              </Button>
            </Link>
          </div>
        ) : (
          posts.map((p) => <TeapotPostCard key={p.id} post={p} />)
        )}
      </main>
    </div>
  );
}
