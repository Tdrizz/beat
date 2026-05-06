import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { specialProducts, SPECIAL_PRODUCT_CATEGORIES, PRICE_RANGES, type ProductCategory } from "../lib/specialProducts";
import { ArrowLeft, Search, X, Star, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ProductCard({ product, index }: { product: typeof specialProducts[0]; index: number }) {
  const [open, setOpen] = useState(false);

  const priceColors = {
    Budget: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Mid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Luxury: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "Ultra-Luxury": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <div className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all">
        {/* Colour accent bar */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${product.hex}88, ${product.hex})` }} />

        <button
          className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/20 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <div
            className="w-11 h-11 rounded-xl shrink-0 border-2 border-background shadow-sm"
            style={{ backgroundColor: product.hex }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{product.brand}</p>
                <p className="font-serif font-bold text-base leading-snug">{product.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-primary">{product.price}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priceColors[product.priceRange]}`}>
                {product.priceRange}
              </span>
              <span className="text-xs text-muted-foreground">{product.subCategory}</span>
              {product.isHeroProduct && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />Hero
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{product.whatItDoes}</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
        </button>

        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">What It Does</p>
                <p className="text-sm text-foreground leading-relaxed">{product.whatItDoes}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Key Ingredients</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.keyIngredients.map(ing => (
                    <span key={ing} className="text-xs bg-muted text-foreground px-2 py-0.5 rounded-full font-medium">{ing}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">How To Use</p>
                <p className="text-sm text-foreground leading-relaxed">{product.howToUse}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">When Results Show</p>
                  <p className="text-sm font-medium text-foreground">{product.resultTimeline}</p>
                </div>
                <div className="rounded-xl bg-primary/5 p-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-base font-bold text-foreground">{product.rating}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Best For</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.bestFor.map(b => (
                    <span key={b} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function SpecialProducts() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [priceRange, setPriceRange] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return specialProducts.filter(p => {
      const matchQ = !q || [p.name, p.brand, p.subCategory, ...p.keyIngredients, ...p.bestFor]
        .some(s => s.toLowerCase().includes(q));
      const matchC = category === "All" || p.category === category;
      const matchP = priceRange === "All" || p.priceRange === priceRange;
      return matchQ && matchC && matchP;
    });
  }, [query, category, priceRange]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold">Special Products</h1>
          <p className="text-xs text-muted-foreground">Serums, gold masks, tools & luxury treatments</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-bold">Premium Skincare</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scientifically formulated treatments — from 24K gold masks to clinical-grade serums and professional LED therapy. Every product reviewed and curated for real results.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by ingredient, brand, concern, or product name…"
            className="pl-9 pr-9"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1.5 min-w-max">
            {["All", ...SPECIAL_PRODUCT_CATEGORIES].map(c => (
              <button
                key={c}
                onClick={() => setCategory(c as ProductCategory | "All")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Price filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...PRICE_RANGES].map(p => (
            <button
              key={p}
              onClick={() => setPriceRange(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                priceRange === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>

        {/* Products */}
        <div className="space-y-3">
          {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground/25 mb-4" />
              <p className="font-serif text-lg">No products match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
