import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, MapPin, Loader2, Send } from "lucide-react";
import { z } from "zod";

import { settingsQuery } from "@/lib/queries";
import { cart, useCart } from "@/lib/cart-store";
import { money } from "@/lib/format";
import { buildWhatsAppMessage, whatsappLink, type OrderPayload } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(settingsQuery);
  },
  head: () => ({ meta: [{ title: "Checkout — Plaza D'cio" }] }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  order_type: z.enum(["local", "takeaway", "delivery"]),
  table_number: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  payment_method: z.string().min(1),
  cash_amount: z.string().optional(),
  notes: z.string().max(300).optional().or(z.literal("")),
});

function Checkout() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  const orderTypes = settings.order_types_enabled ?? { local: true, takeaway: true, delivery: true };
  const paymentMethods = settings.payment_methods ?? ["Efectivo", "QR", "Transferencia", "Tarjeta"];
  const whatsapp = settings.whatsapp_number ?? "59169346499";
  const deliveryFee = Number(settings.delivery_fee ?? 0);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    order_type: (orderTypes.local ? "local" : orderTypes.takeaway ? "takeaway" : "delivery") as "local" | "takeaway" | "delivery",
    table_number: "",
    address: "",
    payment_method: paymentMethods[0] ?? "Efectivo",
    cash_amount: "",
    notes: "",
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const total = useMemo(
    () => subtotal + (form.order_type === "delivery" ? deliveryFee : 0),
    [subtotal, form.order_type, deliveryFee],
  );

  async function requestGps() {
    if (!navigator.geolocation) {
      toast.error("Tu dispositivo no soporta GPS");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success("Ubicación GPS capturada");
      },
      (err) => {
        setGpsLoading(false);
        toast.error("No se pudo obtener la ubicación: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit() {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisa el formulario");
      return;
    }
    if (form.order_type === "delivery" && !form.address.trim() && !gps) {
      toast.error("Ingresa la dirección o comparte tu ubicación GPS");
      return;
    }
    setSubmitting(true);
    const cashAmount = form.payment_method === "Efectivo" && form.cash_amount
      ? Number(form.cash_amount)
      : null;

    const payload: OrderPayload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || undefined,
      order_type: form.order_type,
      table_number: form.order_type === "local" ? form.table_number.trim() || undefined : undefined,
      address: form.order_type === "delivery" ? form.address.trim() || undefined : undefined,
      gps_lat: form.order_type === "delivery" ? gps?.lat ?? null : null,
      gps_lng: form.order_type === "delivery" ? gps?.lng ?? null : null,
      payment_method: form.payment_method,
      cash_amount: cashAmount,
      notes: form.notes.trim() || undefined,
      items,
      subtotal,
      delivery_fee: form.order_type === "delivery" ? deliveryFee : 0,
      total,
    };

    // Save to DB (best-effort — don't block WhatsApp if it fails)
    const { error } = await supabase.from("orders").insert({
      customer_name: payload.customer_name,
      phone: payload.phone ?? null,
      order_type: payload.order_type,
      table_number: payload.table_number ?? null,
      address: payload.address ?? null,
      gps_lat: payload.gps_lat,
      gps_lng: payload.gps_lng,
      payment_method: payload.payment_method,
      cash_amount: payload.cash_amount,
      notes: payload.notes ?? null,
      items: payload.items as any,
      subtotal: payload.subtotal,
      delivery_fee: payload.delivery_fee,
      total: payload.total,
    });
    if (error) console.warn("order insert failed", error);

    const message = buildWhatsAppMessage(payload);
    const url = whatsappLink(whatsapp, message);
    window.open(url, "_blank");
    cart.clear();
    toast.success("Pedido enviado por WhatsApp");
    setSubmitting(false);
    setTimeout(() => navigate({ to: "/" }), 500);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="text-6xl">🛒</div>
        <h1 className="text-2xl font-black">Tu carrito está vacío</h1>
        <Link to="/" className="text-primary font-semibold hover:underline">
          Volver al menú
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-md hover:bg-accent">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black uppercase">Finalizar pedido</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Items summary */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="text-sm font-bold uppercase text-muted-foreground mb-3">Tu pedido</h2>
          <ul className="space-y-1.5 text-sm">
            {items.map((it) => (
              <li key={it.product_id} className="flex justify-between">
                <span>{it.qty}× {it.name}</span>
                <span className="font-semibold">{money(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Customer */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Datos del cliente</h2>
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} placeholder="Tu nombre" maxLength={80} />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="7XXXXXXX" maxLength={30} />
          </div>
        </section>

        {/* Order type */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Tipo de pedido</h2>
          <RadioGroup value={form.order_type} onValueChange={(v) => update("order_type", v as any)} className="grid grid-cols-3 gap-2">
            {orderTypes.local && <OrderTypeCard value="local" label="En el local" icon="🍽️" checked={form.order_type === "local"} />}
            {orderTypes.takeaway && <OrderTypeCard value="takeaway" label="Para llevar" icon="🥡" checked={form.order_type === "takeaway"} />}
            {orderTypes.delivery && <OrderTypeCard value="delivery" label="Delivery" icon="🛵" checked={form.order_type === "delivery"} />}
          </RadioGroup>

          {form.order_type === "local" && (
            <div>
              <Label htmlFor="table">Número de mesa (opcional)</Label>
              <Input id="table" value={form.table_number} onChange={(e) => update("table_number", e.target.value)} placeholder="Ej: 5" maxLength={20} />
            </div>
          )}
          {form.order_type === "delivery" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Calle, número, referencia..." maxLength={200} rows={2} />
              </div>
              <Button type="button" variant="secondary" onClick={requestGps} disabled={gpsLoading} className="w-full">
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {gps ? "Ubicación GPS capturada ✓" : "Compartir mi ubicación GPS"}
              </Button>
              {gps && (
                <a
                  href={`https://maps.google.com/?q=${gps.lat},${gps.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline block text-center"
                >
                  Ver en Google Maps
                </a>
              )}
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Forma de pago</h2>
          <RadioGroup value={form.payment_method} onValueChange={(v) => update("payment_method", v)} className="grid grid-cols-2 gap-2">
            {paymentMethods.map((m) => (
              <label key={m} className={`cursor-pointer rounded-xl border p-3 text-center font-semibold transition-colors ${form.payment_method === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40"}`}>
                <RadioGroupItem value={m} className="sr-only" />
                {m}
              </label>
            ))}
          </RadioGroup>
          {form.payment_method === "Efectivo" && (
            <div>
              <Label htmlFor="cash">Paga con (opcional)</Label>
              <Input id="cash" inputMode="decimal" value={form.cash_amount} onChange={(e) => update("cash_amount", e.target.value)} placeholder="Ej: 100" />
              {form.cash_amount && Number(form.cash_amount) >= total && (
                <p className="text-xs text-primary mt-1">Vuelto: {money(Number(form.cash_amount) - total)}</p>
              )}
            </div>
          )}
        </section>

        {/* Notes */}
        <section>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Sin cebolla, extra ají, etc." maxLength={300} rows={2} />
        </section>

        {/* Total + submit */}
        <section className="bg-card border border-primary/30 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          {form.order_type === "delivery" && deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span>{money(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{money(total)}</span>
          </div>
        </section>

        <Button
          onClick={submit}
          disabled={submitting}
          className="w-full h-14 text-base font-bold bg-brand-gradient text-primary-foreground hover:opacity-90"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Enviar pedido por WhatsApp
        </Button>
        <p className="text-xs text-center text-muted-foreground pb-6">
          Se abrirá WhatsApp con el pedido listo para enviar al restaurante.
        </p>
      </main>
    </div>
  );
}

function OrderTypeCard({ value, label, icon, checked }: { value: string; label: string; icon: string; checked: boolean }) {
  return (
    <label className={`cursor-pointer rounded-xl border p-3 text-center transition-colors ${checked ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
      <RadioGroupItem value={value} className="sr-only" />
      <div className="text-2xl">{icon}</div>
      <div className={`text-xs font-bold mt-1 ${checked ? "text-primary" : ""}`}>{label}</div>
    </label>
  );
}