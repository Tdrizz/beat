import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthedRoute } from "@/components/AuthedRoute";
import { api, ApiError, type Profile, type Message } from "@/lib/api";
import { ModerationMenu } from "@/components/moderation/ModerationMenu";
import { ReportDialog } from "@/components/moderation/ReportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Paperclip, X, Loader2, Flag } from "lucide-react";

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

  const { data: thread, error: threadError } = useQuery({
    queryKey: ["thread", otherId],
    queryFn: () => api.get<ThreadResponse>(`/conversations/${otherId}/messages`),
    enabled: !!otherId,
    refetchInterval: (q) => (q.state.error ? false : 4_000),
    retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
  });
  const blocked = threadError instanceof ApiError && threadError.code === "BLOCKED";
  const blockedByMe = blocked && (threadError.body as { blockedByMe?: boolean }).blockedByMe === true;
  const [reportingId, setReportingId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const send = useMutation({
    mutationFn: async () => {
      if (!otherId) throw new Error("Conversation unavailable");
      let imageUrl: string | undefined;
      if (photo) {
        setUploading(true);
        const upload = await api.post<{ uploadURL: string; objectPath: string }>("/storage/uploads/request-url", {
          name: photo.name || "dm-photo.jpg",
          size: photo.size,
          contentType: photo.type,
        });
        const put = await fetch(upload.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": photo.type },
          body: photo,
        });
        if (!put.ok) throw new Error(`Photo upload failed (${put.status})`);
        await api.post("/storage/uploads/finalize", { objectPath: upload.objectPath, visibility: "private" });
        imageUrl = upload.objectPath;
      }
      return api.post<Message>(`/conversations/${otherId}/messages`, {
        body: body.trim(),
        imageUrl,
      });
    },
    onSuccess: () => {
      setBody("");
      setPhoto(null);
      qc.invalidateQueries({ queryKey: ["thread", otherId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onSettled: () => setUploading(false),
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
        {profile && !blocked && (
          <ModerationMenu
            targetType="user"
            targetId={profile.userId}
            author={profile}
            onBlocked={() => navigate("/messages")}
          />
        )}
      </div>
      <div ref={scrollRef} className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-2 overflow-y-auto">
        {thread?.messages.map((m) => {
          const mine = m.senderId !== otherId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <button
                  type="button"
                  onClick={() => setReportingId(m.id)}
                  className="order-last self-center ml-1 p-1 text-muted-foreground/60 hover:text-foreground"
                  aria-label="Report message"
                >
                  <Flag className="w-3 h-3" />
                </button>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt="Photo shared in this conversation"
                    className="mb-1 max-h-64 w-full rounded-xl object-cover"
                  />
                )}
                {m.body && <p>{m.body}</p>}
              </div>
            </div>
          );
        })}
        {thread && thread.messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-12">Say hi 👋</p>
        )}
        {blocked && (
          <p className="text-center text-sm text-muted-foreground py-12">
            {blockedByMe
              ? "You blocked this account. Unblock them from their profile to message again."
              : "This conversation isn't available."}
          </p>
        )}
      </div>
      {reportingId && (
        <ReportDialog
          open
          onOpenChange={(open) => !open && setReportingId(null)}
          targetType="message"
          targetId={reportingId}
        />
      )}
      {!blocked && <form
        className="max-w-xl w-full mx-auto px-4 py-3 flex gap-2 border-t border-border/50 bg-background/80"
        onSubmit={(e) => {
          e.preventDefault();
          if ((body.trim() || photo) && otherId) send.mutate();
        }}
      >
        <label className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input hover:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          <Paperclip className="h-4 w-4" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={send.isPending}
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="min-w-0 flex-1">
          {photo && (
            <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="truncate">{photo.name}</span>
              <button type="button" aria-label="Remove photo" onClick={() => setPhoto(null)}><X className="h-3 w-3" /></button>
            </div>
          )}
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" />
        </div>
        <Button type="submit" size="sm" className="rounded-full" disabled={(!body.trim() && !photo) || send.isPending}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>}
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
