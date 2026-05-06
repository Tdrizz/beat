import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { api, type Brand, type Product } from "@/lib/api";
import { ExternalLink } from "lucide-react";

export default function Brands() {
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => api.get<Brand[]>("/brands") });
  const { data: products } = useQuery({ queryKey: ["products-all"], queryFn: () => api.get<Product[]>("/products") });

  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl">Shop the looks</h1>
          <p className="text-sm text-muted-foreground">Affiliate links — every click supports the creator who featured the product.</p>
        </div>
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
