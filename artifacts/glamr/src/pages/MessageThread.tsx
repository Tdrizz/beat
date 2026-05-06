import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthedRoute } from "@/components/AuthedRoute";
import { api, type Profile, type Message } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

interface ThreadResponse {
  conversation: { id: string };
  other: Profile | null;
  messages: Message[];
}

function ThreadInner() {
  const [, params] = useRoute<{ handle: string }>("/messages/:handle");
  const [, navigate] = useLocation();
  const handle = params?.handle ?? "";
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve handle → userId (the API takes userId in the URL).
  const { data: profile } = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => api.get<Profile>(`/profiles/${handle}`),
    enabled: !!handle,
  });

  const otherId = profile?.userId;

  const { data: thread } = useQuery({
    queryKey: ["thread", otherId],
    queryFn: () => api.get<ThreadResponse>(`/conversations/${otherId}/messages`),
    enabled: !!otherId,
    refetchInterval: 4_000,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  const [body, setBody] = useState("");
  const send = useMutation({
    mutationFn: () => api.post<Message>(`/conversations/${otherId}/messages`, { body: body.trim() }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["thread", otherId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (
    <div className="min-h-screen vanity-bg flex flex-col">
      <div className="max-w-xl w-full mx-auto px-4 py-3 flex items-center gap-2 border-b border-border/50">
        <Button size="sm" variant="ghost" onClick={() => navigate("/messages")} className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <p className="font-semibold text-sm">{profile?.displayName ?? handle}</p>
          <p className="text-xs text-muted-foreground">@{handle}</p>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-2 overflow-y-auto">
        {thread?.messages.map((m) => {
          const mine = m.senderId !== otherId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.body}
              </div>
            </div>
          );
        })}
        {thread && thread.messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-12">Say hi 👋</p>
        )}
      </div>
      <form
        className="max-w-xl w-full mx-auto px-4 py-3 flex gap-2 border-t border-border/50 bg-background/80"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim() && otherId) send.mutate();
        }}
      >
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" />
        <Button type="submit" size="sm" className="rounded-full" disabled={!body.trim() || send.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default function MessageThread() {
  return (
    <AuthedRoute>
      <ThreadInner />
    </AuthedRoute>
  );
}
