import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { LogOut, Plus, Pencil, Trash2, Loader2, ExternalLink, Upload, Shield, ShieldOff, UserPlus, KeyRound } from "lucide-react";

import {
  listUsers,
  createUser,
  updateUserCredentials,
  setUserRole,
  deleteUser,
} from "@/lib/users.functions";

import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { categoriesQuery, productsQuery, settingsQuery, ordersQuery } from "@/lib/queries";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Plaza D'cio" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { loading, isAdmin, email } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/auth" });
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black uppercase text-gradient-lime">Panel Admin</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="text-sm px-3 py-1.5 rounded-md hover:bg-accent flex items-center gap-1">
              <ExternalLink className="w-4 h-4" /> Ver menú
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="w-4 h-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="account"><AccountTab email={email} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- Account ---------------- */
function AccountTab({ email }: { email?: string }) {
  const [newEmail, setNewEmail] = useState(email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => { if (email) setNewEmail(email); }, [email]);

  async function updateEmail() {
    if (!newEmail.trim() || newEmail === email) return;
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Correo actualizado. Verifica tu bandeja si es necesario.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingEmail(false); }
  }

  async function updatePassword() {
    if (newPassword.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      setNewPassword(""); setConfirmPassword("");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingPass(false); }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-bold">Cambiar correo</h3>
        <div>
          <Label>Correo</Label>
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
        <Button onClick={updateEmail} disabled={savingEmail || !newEmail.trim() || newEmail === email}>
          {savingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
          Actualizar correo
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-bold">Cambiar contraseña</h3>
        <div>
          <Label>Nueva contraseña</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
        </div>
        <div>
          <Label>Confirmar contraseña</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} />
        </div>
        <Button onClick={updatePassword} disabled={savingPass || !newPassword}>
          {savingPass && <Loader2 className="w-4 h-4 animate-spin" />}
          Actualizar contraseña
        </Button>
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
    </div>
  );
}

/* ---------------- Orders ---------------- */
function OrdersTab() {
  const { data: orders, isLoading, refetch } = useQuery(ordersQuery);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Pedidos recientes</h2>
        <Button size="sm" variant="secondary" onClick={() => refetch()}>Actualizar</Button>
      </div>
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!isLoading && (orders?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">Aún no hay pedidos.</p>
      )}
      <div className="space-y-2">
        {orders?.map((o: any) => (
          <div key={o.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="font-bold">{o.customer_name} <Badge variant="secondary" className="ml-2">{o.order_type}</Badge></div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()} · {o.payment_method}
                  {o.phone && ` · 📞 ${o.phone}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-primary">{money(o.total)}</div>
              </div>
            </div>
            <ul className="mt-2 text-sm space-y-0.5">
              {(o.items as any[]).map((it, i) => (
                <li key={i} className="text-muted-foreground">• {it.qty}× {it.name}</li>
              ))}
            </ul>
            {o.address && <div className="text-xs mt-2">📍 {o.address}</div>}
            {o.gps_lat && (
              <a href={`https://maps.google.com/?q=${o.gps_lat},${o.gps_lng}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Ver ubicación GPS →
              </a>
            )}
            {o.notes && <div className="text-xs mt-2 italic">📝 {o.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */
function ProductsTab() {
  const { data: products } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Productos ({products?.length ?? 0})</h2>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4" /> Nuevo
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {products?.map((p: any) => {
          const cat = categories?.find((c: any) => c.id === p.category_id);
          return (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <span>🍽️</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">{cat?.name ?? "—"} · {money(p.price)}</div>
                {!p.available && <Badge variant="destructive" className="mt-1 text-xs">No disponible</Badge>}
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => confirm(`¿Eliminar "${p.name}"?`) && del.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
      </div>
      <ProductDialog open={open} onOpenChange={setOpen} product={editing} categories={categories ?? []} />
    </div>
  );
}

function ProductDialog({ open, onOpenChange, product, categories }: any) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    available: true,
    sort_order: 0,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? "",
        description: product.description ?? "",
        price: String(product.price ?? ""),
        category_id: product.category_id ?? "",
        image_url: product.image_url ?? "",
        available: product.available ?? true,
        sort_order: product.sort_order ?? 0,
      });
    } else {
      setForm({ name: "", description: "", price: "", category_id: categories[0]?.id ?? "", image_url: "", available: true, sort_order: 0 });
    }
  }, [product, open, categories]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price) || 0,
        category_id: form.category_id || null,
        image_url: form.image_url.trim() || null,
        available: form.available,
        sort_order: Number(form.sort_order) || 0,
      };
      if (product?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Guardado");
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Imagen subida");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Descripción</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Precio (Bs.)</Label><Input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>Orden</Label><Input inputMode="numeric" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} /></div>
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Elegir categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Imagen</Label>
            <div className="flex gap-2 items-center">
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL o sube abajo" />
            </div>
            <label className="mt-2 flex items-center justify-center gap-2 border border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-primary transition">
              <Upload className="w-4 h-4" />
              <span className="text-sm">{uploading ? "Subiendo..." : "Subir imagen"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </label>
            {form.image_url && <img src={form.image_url} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" />}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="avail">Disponible</Label>
            <Switch id="avail" checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim()}>
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Categories ---------------- */
function CategoriesTab() {
  const { data: categories } = useQuery(categoriesQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🍽️");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: name.trim(),
        icon,
        sort_order: (categories?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setIcon("🍽️"); qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Categoría creada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Eliminada"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-bold mb-3">Nueva categoría</h3>
        <div className="flex gap-2">
          <Input className="w-16" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍔" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <Button onClick={() => name.trim() && add.mutate()} disabled={add.isPending}>Agregar</Button>
        </div>
      </div>
      <div className="space-y-2">
        {categories?.map((c: any) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <span className="font-semibold"><span className="text-xl mr-2">{c.icon}</span>{c.name}</span>
            <Button size="icon" variant="ghost" onClick={() => confirm(`¿Eliminar "${c.name}"?`) && del.mutate(c.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsTab() {
  const { data: settings } = useQuery(settingsQuery);
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const entries: Array<[string, any]> = [
        ["whatsapp_number", form.whatsapp_number ?? ""],
        ["business_name", form.business_name ?? ""],
        ["business_tagline", form.business_tagline ?? ""],
        ["business_address", form.business_address ?? ""],
        ["business_phone", form.business_phone ?? ""],
        ["delivery_fee", Number(form.delivery_fee) || 0],
        ["order_types_enabled", form.order_types_enabled ?? { local: true, takeaway: true, delivery: true }],
        ["payment_methods", form.payment_methods ?? []],
      ];
      for (const [key, value] of entries) {
        const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Ajustes guardados"); },
    onError: (e: any) => toast.error(e.message),
  });

  const ot = form.order_types_enabled ?? { local: true, takeaway: true, delivery: true };
  const pm: string[] = form.payment_methods ?? [];

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-bold">Negocio</h3>
        <div><Label>Nombre</Label><Input value={form.business_name ?? ""} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
        <div><Label>Slogan</Label><Input value={form.business_tagline ?? ""} onChange={(e) => setForm({ ...form, business_tagline: e.target.value })} /></div>
        <div><Label>Dirección</Label><Input value={form.business_address ?? ""} onChange={(e) => setForm({ ...form, business_address: e.target.value })} /></div>
        <div><Label>Teléfono</Label><Input value={form.business_phone ?? ""} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} /></div>
        <div>
          <Label>WhatsApp para pedidos (con código país, sin +)</Label>
          <Input value={form.whatsapp_number ?? ""} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="59169346499" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-bold">Tipos de pedido</h3>
        {(["local", "takeaway", "delivery"] as const).map((k) => (
          <div key={k} className="flex items-center justify-between">
            <Label className="capitalize">{k}</Label>
            <Switch checked={!!ot[k]} onCheckedChange={(v) => setForm({ ...form, order_types_enabled: { ...ot, [k]: v } })} />
          </div>
        ))}
        <div>
          <Label>Costo de delivery (Bs.)</Label>
          <Input inputMode="decimal" value={String(form.delivery_fee ?? 0)} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-bold">Formas de pago</h3>
        <Textarea
          rows={3}
          value={pm.join(", ")}
          onChange={(e) => setForm({ ...form, payment_methods: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          placeholder="Efectivo, QR, Transferencia, Tarjeta"
        />
        <p className="text-xs text-muted-foreground">Separadas por comas.</p>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-brand-gradient text-primary-foreground font-bold">
        {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Guardar ajustes
      </Button>
    </div>
  );
}