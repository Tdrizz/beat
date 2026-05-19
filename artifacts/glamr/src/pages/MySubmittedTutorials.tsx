import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, ChevronLeft, Plus, ImageOff } from "lucide-react";
import { AuthedRoute } from "@/components/AuthedRoute";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { TUTORIAL_CATEGORY_LABELS, TUTORIAL_DIFFICULTY_LABELS, type SubmittedTutorial } from "@/lib/tutorials";

const STATUS_STYLES: Record<SubmittedTutorial["status"], string> = {
  draft:     "bg-muted text-muted-foreground",
  pending:   "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  featured:  "bg-primary/15 text-primary",
  rejected:  "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<SubmittedTutorial["status"], string> = {
  draft: "Draft", pending: "In review", published: "Published", featured: "Featured", rejected: "Needs changes",
};

function Inner() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-submitted-tutorials"],
    queryFn: () => api.get<{ tutorials: SubmittedTutorial[] }>("/tutorials/submitted/mine"),
  });

  const tutorials = data?.tutorials ?? [];

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link href="/tutorials" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-3.5 h-3.5" /> All tutorials
        </Link>

        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <h1 className="font-serif text-3xl">My tutorials</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Drafts and submissions only you can see. Submit one for review to get it published in the public catalogue.
            </p>
          </div>
          <Link href="/tutorials/submit">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New tutorial</Button>
          </Link>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tutorials.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">You haven't started any tutorials yet.</p>
            <Link href="/tutorials/submit">
              <Button><Plus className="w-4 h-4 mr-1" /> Start your first one</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {tutorials.map((t) => (
              <li key={t.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                <div className="relative aspect-[16/9] sm:w-40 sm:aspect-square bg-muted shrink-0">
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageOff className="w-6 h-6" /></div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {TUTORIAL_CATEGORY_LABELS[t.category]} · {TUTORIAL_DIFFICULTY_LABELS[t.difficulty]} · {t.minutes} min
                    </span>
                  </div>
                  <p className="font-semibold leading-tight">{t.title || <span className="text-muted-foreground italic">Untitled</span>}</p>
                  {t.summary && <p className="text-xs text-muted-foreground line-clamp-2">{t.summary}</p>}
                  {t.status === "rejected" && t.moderationNote && (
                    <p className="text-xs text-destructive">Moderator note: {t.moderationNote}</p>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    {(t.status === "published" || t.status === "featured") ? (
                      <Link href={`/tutorials/${t.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    ) : (
                      <Link href={`/tutorials/submit/${t.id}`}>
                        <Button size="sm" variant="outline">
                          {t.status === "draft" || t.status === "rejected" ? "Edit" : "View"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function MySubmittedTutorials() {
  return <AuthedRoute><Inner /></AuthedRoute>;
}
