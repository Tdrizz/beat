import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BlockRow {
  userId: string;
  blockedAt: string;
  profile: Profile | null;
}

export default function BlockedAccounts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["blocks"],
    queryFn: () => api.get<{ blocks: BlockRow[] }>("/blocks"),
  });
  const unblock = useMutation({
    mutationFn: (userId: string) => api.del(`/blocks/${userId}`),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => toast({ title: "Couldn't unblock", description: e.message, variant: "destructive" }),
  });
  const blocks = data?.blocks ?? [];

  return (
    <div className="min-h-screen vanity-bg">
      <main className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl">Blocked accounts</h1>
            <p className="text-xs text-muted-foreground">They can't see your profile or posts, follow you, or message you.</p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : blocks.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            You haven't blocked anyone.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {blocks.map((b) => (
              <li key={b.userId} className="flex items-center gap-3 p-3">
                {b.profile?.avatarUrl ? (
                  <img src={b.profile.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold">
                    {b.profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.profile?.displayName ?? "Deleted account"}</p>
                  {b.profile && <p className="truncate text-xs text-muted-foreground">@{b.profile.handle}</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={unblock.isPending && unblock.variables === b.userId}
                  onClick={() => unblock.mutate(b.userId)}
                >
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
