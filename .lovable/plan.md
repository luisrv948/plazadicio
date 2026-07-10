## Plaza D'cio — App de Pedidos

Aplicación completa de pedidos para el restaurante, con envío del pedido por WhatsApp al **+591 69346499** y panel de administración para gestionar el menú.

### 1. Experiencia del cliente (pública)

**Página principal / Menú**
- Diseño inspirado en la imagen que subiste: fondo oscuro, acentos verde lima, tipografía impactante, hojas tropicales sutiles.
- Header con logo "Plaza D'cio — Comida Rápida" y teléfono.
- Menú agrupado por categorías (Hamburguesas, Milanesas, Sandwich Lomito, Pique Macho, Bebidas, Jugos…) con foto, nombre, descripción y precio en Bs.
- Botón "Agregar" en cada ítem, con selector de cantidad.

**Carrito flotante**
- Lista de ítems, cantidades, subtotal, botón para eliminar / modificar.
- Total en Bs.

**Checkout (pantalla de confirmación del pedido)**
- Nombre del cliente (requerido)
- Teléfono del cliente
- Tipo de pedido:
  - En el local (mesa opcional)
  - Para llevar
  - Delivery (muestra campos de dirección + GPS)
- Delivery: dirección escrita + botón "Usar mi ubicación GPS" (Geolocation API → guarda lat/long y genera link de Google Maps).
- Forma de pago: Efectivo / QR / Transferencia / Tarjeta.
- Si es efectivo: campo opcional "Paga con" para calcular vuelto.
- Notas adicionales.
- Resumen del pedido con total.
- Botón **"Enviar pedido por WhatsApp"** → abre `wa.me/59169346499` con un mensaje formateado:

```text
🍔 NUEVO PEDIDO — PLAZA D'CIO

👤 Cliente: Juan Pérez
📞 Teléfono: 71234567
🛵 Tipo: Delivery

🧾 Pedido:
• 2x Cangreburger — 40 Bs.
• 1x Coca-Cola 2LT — 20 Bs.

💰 Total: 60 Bs.
💳 Pago: Efectivo (paga con 100 Bs. → vuelto 40 Bs.)

📍 Dirección: Av. Libertadores #123
🗺️ Ubicación GPS: https://maps.google.com/?q=-17.78,-63.18

📝 Notas: sin cebolla
```

- El pedido también se guarda en la base de datos para historial del admin.

### 2. Panel de administración

**Login protegido** (email + contraseña, con roles).

**Gestión de categorías**
- Crear / editar / eliminar / reordenar categorías (nombre, ícono/emoji, orden).

**Gestión de productos (menú)**
- CRUD completo: nombre, descripción, precio (Bs.), categoría, foto (subida a storage), disponible sí/no, orden.
- Vista previa tal como se muestra al cliente.

**Configuración general**
- Número de WhatsApp del negocio (precargado con +59169346499).
- Nombre del negocio, dirección, teléfono público.
- Activar/desactivar tipos de pedido (local, para llevar, delivery).
- Costo de delivery (opcional, fijo).
- Métodos de pago disponibles.

**Historial de pedidos**
- Listado de pedidos recibidos con filtros por fecha/tipo/estado.
- Detalle completo de cada pedido.

### 3. Detalles técnicos

- **Stack**: TanStack Start + React + Tailwind (ya configurado).
- **Backend**: Lovable Cloud (base de datos, auth, storage para fotos).
- **Tablas**:
  - `categories` (id, name, icon, sort_order)
  - `products` (id, category_id, name, description, price, image_url, available, sort_order)
  - `orders` (id, customer_name, phone, order_type, address, gps_lat, gps_lng, payment_method, cash_amount, notes, subtotal, delivery_fee, total, items JSONB, created_at, status)
  - `settings` (clave/valor: whatsapp, delivery_fee, etc.)
  - `user_roles` (para admin)
- **RLS**:
  - Lectura pública de `categories`, `products` disponibles y `settings`.
  - Escritura solo para rol `admin`.
  - `orders`: inserción pública (para que el cliente registre su pedido), lectura solo admin.
- **WhatsApp**: link `https://wa.me/59169346499?text=<mensaje URL-encoded>` — no requiere API de WhatsApp Business.
- **GPS**: `navigator.geolocation.getCurrentPosition` + link a Google Maps.
- **Fotos**: bucket público en storage; el admin sube desde el formulario.
- **Diseño**: sistema semántico con tokens oklch (fondo oscuro, verde lima primario), inspirado en el flyer que subiste. Sin colores hardcodeados.

### 4. Datos iniciales

Se precarga el menú completo del flyer (Hamburguesas, Milanesas de Pollo, Sandwich Lomito, Pique Macho, Bebidas, Jugos) con precios en Bs., para que la app funcione desde el primer momento. El admin luego puede editar/agregar/eliminar todo.

---

¿Apruebas este plan? Al confirmar, activo Lovable Cloud, creo la base de datos con el menú precargado, y construyo tanto la app del cliente como el panel de administración.