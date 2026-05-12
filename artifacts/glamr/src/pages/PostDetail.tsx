import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { api, type Post, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareToDmButton } from "@/components/ShareToDmButton";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { KindnessOverlay, useKindnessCheck } from "@/components/KindnessPrompt";

interface CommentRow {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: Profile | null;
}

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const qc = useQueryClient();
  const { showOverlay, checkText, dismiss } = useKindnessCheck();
  const [body, setBody] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => api.get<Post>(`/posts/${postId}`),
    enabled: !!postId,
  });

  const { data: comments } = useQuery({
    queryKey: ["post", postId, "comments"],
    queryFn: () => api.get<CommentRow[]>(`/posts/${postId}/comments`),
    enabled: !!postId,
  });

  const like = useMutation({
    mutationFn: () =>
      post?.likedByMe
        ? api.del(`/posts/${postId}/like`)
        : api.post(`/posts/${postId}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post", postId] }),
  });

  const addComment = useMutation({
    mutationFn: (text: string) =>
      api.post<CommentRow>(`/posts/${postId}/comments`, { body: text }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["post", postId, "comments"] });
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || addComment.isPending) return;
    // Block submission and surface the Kindness overlay if the comment
    // trips the mean-content patterns. After the 5s timer the overlay
    // auto-dismisses; the user can then edit the text or resubmit as-is.
    if (checkText(text)) return;
    addComment.mutate(text);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen vanity-bg">
        <main className="max-w-xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen vanity-bg">
        <main className="max-w-xl mx-auto px-4 py-6 space-y-3">
          <p className="text-center text-muted-foreground py-12">Post not found.</p>
          <Link href="/feed">
            <Button variant="outline" className="rounded-full mx-auto block">Back to feed</Button>
          </Link>
        </main>
      </div>
    );
  }

  const shareBody = post.lookId
    ? `Try this look on Beat: ${window.location.origin}/try-on/${post.lookId}`
    : `Check this Beat post: ${window.location.origin}/posts/${post.id}`;

  return (
    <div className="min-h-screen vanity-bg">
      <KindnessOverlay visible={showOverlay} onDismiss={dismiss} />
      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <Link href="/feed">
          <Button variant="ghost" size="sm" className="rounded-full gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Feed
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link href={`/u/${post.author.handle}`}>
                    <p className="text-sm font-semibold hover:underline cursor-pointer">@{post.author.handle}</p>
                  </Link>
                  <ArchetypeBadge archetype={post.author.archetype} />
                </div>
              )}
            </div>
          </div>
          <img src={post.imageUrl} alt="" className="w-full aspect-square object-cover bg-muted" />
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => like.mutate()}
                className="flex items-center gap-1.5 text-sm"
                aria-label={post.likedByMe ? "Unlike post" : "Like post"}
              >
                <Heart className={`w-5 h-5 ${post.likedByMe ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{post.likeCount}</span>
              </button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" /> {post.commentCount}
              </span>
              <div className="ml-auto">
                <ShareToDmButton shareBody={shareBody} />
              </div>
            </div>
            {post.caption && <p className="text-sm whitespace-pre-wrap">{post.caption}</p>}
            {post.lookId && (
              <Link href={`/try-on/${post.lookId}`}>
                <Button size="sm" variant="outline" className="rounded-full text-xs">Try this look →</Button>
              </Link>
            )}
          </div>
        </motion.div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl">Comments</h2>
          <form onSubmit={submitComment} className="flex items-center gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a kind comment…"
              maxLength={500}
              aria-label="Add a comment"
              className="rounded-full"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-full"
              disabled={!body.trim() || addComment.isPending}
            >
              {addComment.isPending ? "Posting…" : "Post"}
            </Button>
          </form>
          {addComment.isError && (
            <p className="text-xs text-red-500">{(addComment.error as Error).message}</p>
          )}
          {comments && comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  {c.author?.avatarUrl ? (
                    <img src={c.author.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                      {c.author?.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {c.author ? (
                      <Link href={`/u/${c.author.handle}`}>
                        <span className="text-sm font-semibold hover:underline cursor-pointer">@{c.author.handle}</span>
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">unknown</span>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet — be the first.</p>
          )}
        </section>
      </main>
    </div>
  );
}
