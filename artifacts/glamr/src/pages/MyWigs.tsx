import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, Trash2, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  listWigTryons, deleteWigTryon, resolveWigImageUrl, type WigTryon,
} from "../lib/saveWigTryOn";

export default function MyWigs() {
  const { toast } = useToast();
  const [tryons, setTryons] = useState<WigTryon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listWigTryons()
      .then((res) => { if (active) setTryons(res.tryons); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteWigTryon(id);
      setTryons((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      toast({
        title: "Couldn't delete",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-10 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground flex items-center gap-2">
              <Heart className="w-7 h-7 text-primary" />My Wigs
            </h1>
            <p className="text-muted-foreground mt-1.5">Your saved AI wig try-ons.</p>
          </div>
          <Link href="/wigs">
            <Button variant="outline" className="rounded-full gap-1.5">
              <Sparkles className="w-4 h-4" />Browse Wig Studio
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-muted-foreground">{error}</div>
        ) : tryons.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold mb-2">No saved wigs yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try on a wig and tap “My Wigs” on the result to keep your favourite renders here.
            </p>
            <Link href="/wigs">
              <Button className="rounded-full gap-1.5 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground">
                <Sparkles className="w-4 h-4" />Explore wigs
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tryons.map((t) => (
              <div key={t.id} className="group rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm">
                <div className="relative aspect-[3/4] bg-muted">
                  <img
                    src={resolveWigImageUrl(t.imagePath)}
                    alt={`${t.wigName} in ${t.colorName}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    aria-label="Delete saved wig"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                  <Badge className="absolute bottom-2 left-2 bg-black/45 backdrop-blur-md text-white border-0 text-[10px]">
                    {t.angleLabel}
                  </Badge>
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-sm leading-tight truncate">{t.wigName}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.colorName}</p>
                  <Link href={`/wigs/${t.wigId}`}>
                    <Button variant="ghost" size="sm" className="w-full mt-1.5 rounded-full text-xs gap-1 h-7">
                      <Sparkles className="w-3 h-3" />Try again
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
