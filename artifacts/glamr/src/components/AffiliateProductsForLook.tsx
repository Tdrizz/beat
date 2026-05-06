import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { api, type Product } from "@/lib/api";
import { ShoppingBag } from "lucide-react";

// Renders affiliate products that match a particular look. Falls back to a
// "popular near this look" list when the look isn't explicitly mapped.
export function AffiliateProductsForLook({ lookId }: { lookId: string }) {
  const { user } = useUser();
  const { data: products } = useQuery({
    queryKey: ["look-products", lookId],
    queryFn: () => api.get<Product[]>(`/products?lookId=${encodeURIComponent(lookId)}`),
  });
  // Show a small fallback set of popular products for unmapped looks so the
  // affiliate panel never looks broken.
  const { data: fallback } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => api.get<Product[]>("/products"),
    enabled: !products || products.length === 0,
  });

  const items = products && products.length > 0 ? products : (fallback ?? []).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="mt-6 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Shop this look</h3>
      </div>
      <div className="space-y-2">
        {items.map((p) => {
          const url = `/api/affiliate/click/${p.id}${user ? `?creator=${encodeURIComponent(user.id)}` : ""}`;
          return (
            <a
              key={p.id}
              href={url}
              target="_blank"
              rel="noopener sponsored"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50"
            >
              <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: p.color ?? "#888" }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                {p.step && <p className="text-xs text-primary uppercase tracking-wide">{p.step}</p>}
              </div>
              <span className="text-sm font-bold text-primary shrink-0">${(p.priceCents / 100).toFixed(2)}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
