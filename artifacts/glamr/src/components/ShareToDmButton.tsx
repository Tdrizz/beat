import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Send, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Conversation } from "@/lib/api";

interface Props {
  /** Pre-filled message body, e.g. "Check out this look: /try-on/foo" */
  shareBody: string;
  /** Element rendered as the trigger; defaults to a small icon button. */
  children?: React.ReactNode;
}

// Tiny modal that lists the user's existing conversations and sends `shareBody`
// to whichever they tap. No new-conversation creation here — keeps the UX
// fast; users discover new threads from the post author's avatar instead.
export function ShareToDmButton({ shareBody, children }: Props) {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/conversations"),
    enabled: !!isSignedIn && open,
  });

  const send = useMutation({
    mutationFn: (handle: string) =>
      api.post(`/conversations/${handle}/messages`, { body: shareBody }),
    onSuccess: (_d, handle) => setSentTo(handle),
  });

  if (!isSignedIn) return null;

  const filtered = (conversations ?? []).filter((c) => {
    if (!c.other) return false;
    const q = query.toLowerCase();
    return (
      !q ||
      c.other.handle.toLowerCase().includes(q) ||
      (c.other.displayName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSentTo(null); }}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="ghost" className="rounded-full" aria-label="Share to DM">
            <Send className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send to a friend</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto -mx-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8 px-4">
              {conversations && conversations.length === 0
                ? "Start a conversation from a friend's profile first."
                : "No matches."}
            </p>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={send.isPending}
                    onClick={() => c.other && send.mutate(c.other.handle)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-muted/50 disabled:opacity-50 text-left"
                  >
                    {c.other?.avatarUrl ? (
                      <img src={c.other.avatarUrl} className="w-9 h-9 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                        {c.other?.displayName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.other?.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">@{c.other?.handle}</p>
                    </div>
                    {sentTo === c.other?.handle && (
                      <span className="text-[10px] font-semibold text-emerald-600">Sent ✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
