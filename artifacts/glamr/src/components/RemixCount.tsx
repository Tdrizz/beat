import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { api, type RemixStats } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  lookId: string;
}

// "X people tried this" card surfacing recent user posts that referenced this
// catalogue look. Nudges signed-out viewers to share + creates a leaderboard
// loop for the catalogue.
export function RemixCount({ lookId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["remix-stats", lookId],
    queryFn: () => api.get<RemixStats>(`/looks/${lookId}/remix-stats`),
  });

  if (isLoading || !data || data.count === 0) {
    // Hide entirely until at least one person has tried it — empty leaderboards feel sad.
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {data.count} {data.count === 1 ? "person tried" : "people tried"} this look
          </h3>
          <p className="text-xs text-muted-foreground">Tap a result to see it bigger.</p>
        </div>
        <Link href={`/try-on/${lookId}`}>
          <Button size="sm" variant="outline" className="rounded-full">Add yours</Button>
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {data.recent.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary cursor-pointer relative group">
              <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
              {post.author && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <p className="text-[10px] text-white font-semibold truncate">@{post.author.handle}</p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
