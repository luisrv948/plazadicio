import { useEffect, useSyncExternalStore } from "react";

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  qty: number;
};

const KEY = "plazadcio_cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: CartItem[] = [];
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
}

function write(items: CartItem[]) {
  cache = items;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(items));
  }
  emit();
}

export const cart = {
  get: () => cache,
  add(item: Omit<CartItem, "qty">, qty = 1) {
    const items = [...cache];
    const i = items.findIndex((x) => x.product_id === item.product_id);
    if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + qty };
    else items.push({ ...item, qty });
    write(items);
  },
  setQty(product_id: string, qty: number) {
    if (qty <= 0) return cart.remove(product_id);
    write(cache.map((x) => (x.product_id === product_id ? { ...x, qty } : x)));
  },
  remove(product_id: string) {
    write(cache.filter((x) => x.product_id !== product_id));
  },
  clear() {
    write([]);
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCart() {
  useEffect(() => {
    if (!hydrated) {
      cache = read();
      hydrated = true;
      emit();
    }
  }, []);
  const items = useSyncExternalStore(
    (l) => {
      const unsub = cart.subscribe(l);
      return () => unsub();
    },
    () => cache,
    () => [] as CartItem[],
  );
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);
  return { items, subtotal, count };
}