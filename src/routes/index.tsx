import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShoppingBag, Plus, Minus, Trash2, Phone, MapPin, ShieldCheck } from "lucide-react";

import { categoriesQuery, productsQuery, settingsQuery } from "@/lib/queries";
import { cart, useCart } from "@/lib/cart-store";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
  },
  component: MenuPage,
});

function MenuPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { items, count, subtotal } = useCart();
  const [open, setOpen] = useState(false);

  const byCat = useMemo(() => {
    const m = new Map<string, typeof products>();
    for (const p of products) {
      if (!p.available) continue;
      const arr = m.get(p.category_id ?? "") ?? [];
      arr.push(p);
      m.set(p.category_id ?? "", arr);
    }
    return m;
  }, [products]);

  return (
    <div className="min-h-screen pb-32">
      {/* Header / Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 15% 0%, oklch(0.55 0.18 145 / 0.5), transparent 55%), radial-gradient(circle at 85% 20%, oklch(0.86 0.22 130 / 0.35), transparent 50%)" }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8 sm:pt-14 sm:pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            🌴 {settings.business_tagline ?? "Comida Rápida"}
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-gradient-lime uppercase">
            {settings.business_name ?? "Plaza D'cio"}
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-muted-foreground font-medium italic">
            Lo mejor de la casa!!!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {settings.business_phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-primary" /> {settings.business_phone}
              </span>
            )}
            {settings.business_address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> {settings.business_address}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Category quick nav */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className="shrink-0 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
            >
              <span className="mr-1">{c.icon}</span>
              {c.name}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {categories.map((c) => {
          const list = byCat.get(c.id) ?? [];
          if (!list.length) return null;
          return (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{c.icon}</span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gradient-lime">
                  {c.name}
                </h2>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-primary/60 to-transparent rounded-full" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating cart button */}
      {count > 0 && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-brand-gradient text-primary-foreground font-bold px-6 py-3.5 rounded-full shadow-[0_10px_40px_-10px_oklch(0.86_0.22_130/0.6)] flex items-center gap-3 hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
              <span>{count} {count === 1 ? "ítem" : "ítems"}</span>
              <span className="opacity-70">•</span>
              <span>{money(subtotal)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
            <SheetHeader>
              <SheetTitle className="text-2xl font-black">Tu pedido</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {items.map((it) => (
                <div key={it.product_id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{it.name}</div>
                    <div className="text-sm text-primary font-bold">{money(it.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="secondary" onClick={() => cart.setQty(it.product_id, it.qty - 1)}><Minus className="w-4 h-4" /></Button>
                    <span className="w-6 text-center font-bold">{it.qty}</span>
                    <Button size="icon" variant="secondary" onClick={() => cart.setQty(it.product_id, it.qty + 1)}><Plus className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => cart.remove(it.product_id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <SheetFooter className="border-t border-border pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-black text-primary">{money(subtotal)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center bg-brand-gradient text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition"
                >
                  Continuar con el pedido
                </Link>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground border-t border-border mt-10">
        <div className="flex items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} {settings.business_name ?? "Plaza D'cio"}</span>
          <Link to="/auth" className="inline-flex items-center gap-1 hover:text-primary">
            <ShieldCheck className="w-3 h-3" /> Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const [added, setAdded] = useState(false);
  const add = () => {
    cart.add({ product_id: product.id, name: product.name, price: Number(product.price) });
    setAdded(true);
    toast.success(`${product.name} agregado`, { duration: 1200 });
    setTimeout(() => setAdded(false), 800);
  };
  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden flex hover:border-primary/50 transition-colors">
      <div className="w-24 sm:w-28 shrink-0 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🍽️</span>
        )}
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="font-bold uppercase tracking-tight leading-tight">{product.name}</div>
          {product.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-black text-primary text-lg">{money(product.price)}</span>
          <Button
            size="sm"
            onClick={add}
            className={added ? "scale-95" : ""}
          >
            <Plus className="w-4 h-4" /> Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
