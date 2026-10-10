import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ShieldAlert, Trash2, Ban, X } from "lucide-react";
import { api, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

type Status = "open" | "actioned" | "dismissed";
type Action = "dismiss" | "remove_content" | "ban_user";

interface ReportRow {
  id: string;
  targetType: "post" | "comment" | "message" | "user";
  targetId: string;
  targetUserId: string;
  reason: string;
  details: string;
  snapshot: Record<string, unknown>;
  status: Status;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: Profile | null;
  targetUser: Profile | null;
  openReportsAgainstUser: number;
}

const REASON_LABELS: Record<string, string> = {
  harassment: "Harassment",
  hate: "Hate",
  nudity: "Nudity / sexual",
  violence: "Violence",
  self_harm: "Self-harm",
  minor_safety: "Minor safety",
  impersonation: "Impersonation",
  spam: "Spam",
  other: "Other",
};

function Snapshot({ report }: { report: ReportRow }) {
  const s = report.snapshot as Record<string, string | boolean | undefined>;
  if (report.targetType === "post") {
    return (
      <div className="flex gap-3">
        {typeof s.imageUrl === "string" && (
          <img src={s.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover bg-muted" />
        )}
        <p className="text-sm whitespace-pre-wrap">{(s.caption as string) || <em className="text-muted-foreground">No caption</em>}</p>
      </div>
    );
  }
  if (report.targetType === "user") {
    return (
      <p className="text-sm">
        <strong>{s.displayName as string}</strong> @{s.handle as string}
        {s.bio ? <span className="block text-muted-foreground">{s.bio as string}</span> : null}
      </p>
    );
  }
  return (
    <p className="text-sm whitespace-pre-wrap">
      {(s.body as string) || <em className="text-muted-foreground">(no text)</em>}
      {s.hasImage ? <span className="block text-xs text-muted-foreground">+ photo attachment</span> : null}
    </p>
  );
}

function ReportCard({ report, readOnly }: { report: ReportRow; readOnly: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const resolve = useMutation({
    mutationFn: (action: Action) => api.post(`/admin/reports/${report.id}/resolve`, { action, note: note.trim() || undefined }),
    onSuccess: (_, action) => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: action === "dismiss" ? "Report dismissed" : action === "ban_user" ? "User banned" : "Content removed" });
    },
    onError: (e: Error) => toast({ title: "Couldn't resolve", description: e.message, variant: "destructive" }),
  });
  const confirmBan = () => {
    if (window.confirm(`Ban @${report.targetUser?.handle ?? report.targetUserId}? They will be signed out and unable to sign in.`)) {
      resolve.mutate("ban_user");
    }
  };
  return (
    <li className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
          {REASON_LABELS[report.reason] ?? report.reason}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{report.targetType}</span>
        <span className="text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</span>
        {report.openReportsAgainstUser > 1 && (
          <span className="font-semibold text-amber-700">{report.openReportsAgainstUser} open reports on this user</span>
        )}
      </div>
      <div className="rounded-xl bg-muted/40 p-3">
        <Snapshot report={report} />
      </div>
      <p className="text-xs text-muted-foreground">
        Against{" "}
        {report.targetUser ? <Link href={`/u/${report.targetUser.handle}`} className="underline">@{report.targetUser.handle}</Link> : report.targetUserId}
        {" · "}reported by {report.reporter ? `@${report.reporter.handle}` : "a deleted user"}
      </p>
      {report.details && <p className="text-sm italic">“{report.details}”</p>}
      {readOnly ? (
        <p className="text-xs text-muted-foreground">Resolution: {report.resolutionNote || report.status}</p>
      ) : (
        <>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (optional)" className="text-sm" />
          <div className="flex flex-wrap gap-2">
            {report.targetType !== "user" && (
              <Button size="sm" variant="destructive" className="rounded-full gap-1" disabled={resolve.isPending} onClick={() => resolve.mutate("remove_content")}>
                <Trash2 className="h-3.5 w-3.5" /> Remove {report.targetType}
              </Button>
            )}
            <Button size="sm" variant="outline" className="rounded-full gap-1 text-destructive" disabled={resolve.isPending} onClick={confirmBan}>
              <Ban className="h-3.5 w-3.5" /> Ban user
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full gap-1" disabled={resolve.isPending} onClick={() => resolve.mutate("dismiss")}>
              <X className="h-3.5 w-3.5" /> Dismiss
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

export default function AdminReports() {
  const [status, setStatus] = useState<Status>("open");
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api.get<{ isAdmin: boolean }>("/admin/me"),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => api.get<{ reports: ReportRow[] }>(`/admin/reports?status=${status}`),
    enabled: !!meta?.isAdmin,
  });
  if (metaLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!meta?.isAdmin) return <NotFound />;
  const reports = data?.reports ?? [];
  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <header className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <h1 className="font-serif text-3xl">Reports</h1>
        </header>
        <div className="flex gap-2">
          {(["open", "actioned", "dismissed"] as Status[]).map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} className="rounded-full capitalize" onClick={() => setStatus(s)}>
              {s}
            </Button>
          ))}
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => <ReportCard key={r.id} report={r} readOnly={status !== "open"} />)}
          </ul>
        )}
      </main>
    </div>
  );
}
