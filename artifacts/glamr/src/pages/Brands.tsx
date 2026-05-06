import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api, type Brand, type Product } from "@/lib/api";
import { ExternalLink, Sparkles } from "lucide-react";
import { useArchetype } from "@/hooks/useArchetype";
import { ARCHETYPES, pickFg, type ArchetypeId } from "@/lib/archetypes";

// Per-archetype affinity. Maps each archetype to product categories +
// preferred finish keywords. Curated rather than ML-derived because we
// have a small fixed catalogue and want predictable, on-brand picks.
const ARCHETYPE_AFFINITY: Record<ArchetypeId, { categories: string[]; keywords: string[] }> = {
  romantic:  { categories: ["lips", "cheeks"], keywords: ["balm", "gloss", "blush", "petal", "rose", "peach", "satin"] },
  siren:     { categories: ["eyes", "lips"],   keywords: ["liner", "lipstick", "matte", "smoke", "bronze", "vamp", "wine"] },
  icon:      { categories: ["base", "brows"],  keywords: ["foundation", "concealer", "powder", "brow", "structure", "matte"] },
  muse:      { categories: ["eyes", "cheeks"], keywords: ["shimmer", "glitter", "iridescent", "highlight", "pearl", "lavender"] },
  rebel:     { categories: ["eyes", "lips"],   keywords: ["liner", "kohl", "graphic", "matte", "bold", "neon", "black"] },
  naturalist:{ categories: ["base", "lips"],   keywords: ["tinted", "balm", "stain", "skin", "tint", "sheer", "natural"] },
};

function productMatchesArchetype(p: Product, a: ArchetypeId): boolean {
  const aff = ARCHETYPE_AFFINITY[a];
  if (aff.categories.includes(p.category)) return true;
  const text = `${p.name}`.toLowerCase();
  return aff.keywords.some((k) => text.includes(k));
}

function ProductCard({ p }: { p: Product }) {
  return (
    <a
      href={`/api/affiliate/click/${p.id}`}
      target="_blank"
      rel="noopener sponsored"
      className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full shrink-0 border-2 border-background shadow-sm" style={{ backgroundColor: p.color ?? "#888" }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-tight">{p.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-primary">${(p.priceCents / 100).toFixed(2)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
          </div>
        </div>
      </div>
    </a>
  );
}

export default function Brands() {
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => api.get<Brand[]>("/brands") });
  const { data: products } = useQuery({ queryKey: ["products-all"], queryFn: () => api.get<Product[]>("/products") });
  const { archetype } = useArchetype();

  const arch = archetype ? ARCHETYPES[archetype] : null;
  const archMatches = arch && products
    ? products.filter((p) => productMatchesArchetype(p, archetype as ArchetypeId)).slice(0, 12)
    : [];
  const archIsLight = arch ? pickFg(arch.palette[1] ?? arch.palette[0]) === "light" : false;

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl">Shop the looks</h1>
          <p className="text-sm text-muted-foreground">Affiliate links — every click supports the creator who featured the product.</p>
        </div>

        {arch ? (
          archMatches.length > 0 && (
            <section>
              <div
                className="rounded-2xl overflow-hidden border border-border mb-3"
                style={{ background: `linear-gradient(135deg, ${arch.palette[0]} 0%, ${arch.palette[2]} 100%)` }}
              >
                <div className={`p-4 flex items-center gap-2 ${archIsLight ? "text-white" : "text-black/85"}`}>
                  <Sparkles className="w-4 h-4" />
                  <p className="font-serif text-lg font-bold">For the {arch.name.replace(/^The /, "")}</p>
                  <span className={`text-xs ml-auto ${archIsLight ? "text-white/70" : "text-black/60"}`}>{archMatches.length} picks</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {archMatches.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </section>
          )
        ) : (
          <Link href="/archetype">
            <div className="rounded-2xl border border-dashed border-primary/40 p-4 hover:bg-primary/5 transition-colors cursor-pointer flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-semibold">Take the Iola test</p>
                <p className="text-xs text-muted-foreground">We'll surface products tailored to your archetype here.</p>
              </div>
            </div>
          </Link>
        )}

        {brands?.map((brand) => {
          const items = products?.filter((p) => p.brandId === brand.id) ?? [];
          if (items.length === 0) return null;
          return (
            <section key={brand.id}>
              <h2 className="font-serif text-xl mb-2">{brand.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((p) => (
                  <a
                    key={p.id}
                    href={`/api/affiliate/click/${p.id}`}
                    target="_blank"
                    rel="noopener sponsored"
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full shrink-0 border-2 border-background shadow-sm" style={{ backgroundColor: p.color ?? "#888" }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight">{p.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-primary">${(p.priceCents / 100).toFixed(2)}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
