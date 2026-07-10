import type { CartItem } from "./cart-store";
import { money } from "./format";

export type OrderPayload = {
  customer_name: string;
  phone?: string;
  order_type: "local" | "takeaway" | "delivery";
  table_number?: string;
  address?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  payment_method: string;
  cash_amount?: number | null;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
};

const typeLabel = {
  local: "🍽️ En el local",
  takeaway: "🥡 Para llevar",
  delivery: "🛵 Delivery",
} as const;

export function buildWhatsAppMessage(o: OrderPayload) {
  const lines: string[] = [];
  lines.push("🍔 *NUEVO PEDIDO — PLAZA D'CIO*", "");
  lines.push(`👤 *Cliente:* ${o.customer_name}`);
  if (o.phone) lines.push(`📞 *Teléfono:* ${o.phone}`);
  lines.push(`${typeLabel[o.order_type]}`);
  if (o.order_type === "local" && o.table_number) lines.push(`🪑 Mesa: ${o.table_number}`);
  lines.push("", "🧾 *Pedido:*");
  for (const it of o.items) {
    lines.push(`• ${it.qty}x ${it.name} — ${money(it.price * it.qty)}`);
  }
  lines.push("", `💰 *Subtotal:* ${money(o.subtotal)}`);
  if (o.delivery_fee > 0) lines.push(`🛵 Delivery: ${money(o.delivery_fee)}`);
  lines.push(`🧮 *TOTAL: ${money(o.total)}*`);
  let pay = `💳 *Pago:* ${o.payment_method}`;
  if (o.payment_method === "Efectivo" && o.cash_amount) {
    const change = o.cash_amount - o.total;
    pay += ` (paga con ${money(o.cash_amount)}${change >= 0 ? ` → vuelto ${money(change)}` : ""})`;
  }
  lines.push(pay);
  if (o.order_type === "delivery") {
    lines.push("");
    if (o.address) lines.push(`📍 *Dirección:* ${o.address}`);
    if (o.gps_lat && o.gps_lng) {
      lines.push(`🗺️ Ubicación GPS: https://maps.google.com/?q=${o.gps_lat},${o.gps_lng}`);
    }
  }
  if (o.notes) lines.push("", `📝 *Notas:* ${o.notes}`);
  return lines.join("\n");
}

export function whatsappLink(number: string, message: string) {
  const num = number.replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}