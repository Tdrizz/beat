import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { AuthedRoute } from "@/components/AuthedRoute";
import { api, type Conversation } from "@/lib/api";
import { MessageCircle } from "lucide-react";

function MessagesInner() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/conversations"),
    refetchInterval: 10_000,
  });

  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
      <main className="max-w-xl mx-auto px-4 py-6">
        <h1 className="font-serif text-3xl mb-4">Messages</h1>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">No conversations yet.</p>
            <p className="text-xs text-muted-foreground">Tap the message icon on any post to start one.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link href={c.other ? `/messages/${c.other.handle}` : "#"}>
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 cursor-pointer">
                    {c.other?.avatarUrl ? (
                      <img src={c.other.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-base font-bold">
                        {c.other?.displayName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.other?.displayName ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessagePreview ?? "No messages yet."}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function Messages() {
  return (
    <AuthedRoute>
      <MessagesInner />
    </AuthedRoute>
  );
}
