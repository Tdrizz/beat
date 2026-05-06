import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Bell, Heart, MessageCircle, UserPlus, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, type Notification } from "@/lib/api";

const ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  message: MessageSquare,
  system: Sparkles,
} as const;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function describe(n: Notification): string {
  const who = n.actor ? `@${n.actor.handle}` : "Someone";
  switch (n.kind) {
    case "like":
      return `${who} liked your post`;
    case "comment":
      return `${who} commented: ${n.body || "…"}`;
    case "follow":
      return `${who} started following you`;
    case "message":
      return `${who}: ${n.body || "sent you a message"}`;
    default:
      return n.body || "New notification";
  }
}

function linkFor(n: Notification): string {
  if (n.kind === "message" && n.actor) return `/messages/${n.actor.handle}`;
  if ((n.kind === "like" || n.kind === "comment") && n.postId) return `/posts/${n.postId}`;
  if (n.kind === "follow" && n.actor) return `/u/${n.actor.handle}`;
  return "/feed";
}

export function NotificationsBell() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notif-unread"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    enabled: !!isSignedIn,
    refetchInterval: 30_000,
  });

  const { data: items } = useQuery({
    queryKey: ["notif-list"],
    queryFn: () => api.get<Notification[]>("/notifications?limit=20"),
    enabled: !!isSignedIn && open,
  });

  const markRead = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-unread"] });
      qc.invalidateQueries({ queryKey: ["notif-list"] });
    },
  });

  if (!isSignedIn) return null;
  const count = unread?.count ?? 0;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && count > 0) markRead.mutate();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
          <span className="font-semibold text-sm">Notifications</span>
          <span className="text-xs text-muted-foreground">{count > 0 ? `${count} new` : "All caught up"}</span>
        </div>
        {!items || items.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8 px-4">
            Nothing yet — your likes, follows and DMs will land here.
          </p>
        ) : (
          <ul>
            {items.map((n) => {
              const Icon = ICONS[n.kind] ?? Bell;
              const isUnread = !n.readAt;
              return (
                <li key={n.id}>
                  <Link href={linkFor(n)}>
                    <div
                      className={`flex items-start gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer ${isUnread ? "bg-primary/5" : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      {n.actor?.avatarUrl ? (
                        <img src={n.actor.avatarUrl} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug truncate">{describe(n)}</p>
                        <p className="text-[10px] text-muted-foreground">{relativeTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
