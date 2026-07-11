import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "admin@plazadicio.app";
        const password = "123456789A";

        // If an admin already exists, do nothing.
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin")
          .limit(1);
        if (existing && existing.length > 0) {
          return Response.json({ ok: true, message: "admin already exists" });
        }

        // Try create; if the user exists, look them up.
        let userId: string | undefined;
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createErr && !/already/i.test(createErr.message)) {
          return Response.json({ ok: false, error: createErr.message }, { status: 500 });
        }
        userId = created?.user?.id;
        if (!userId) {
          const { data: list } = await supabaseAdmin.auth.admin.listUsers();
          userId = list?.users.find((u) => u.email === email)?.id;
        }
        if (!userId) {
          return Response.json({ ok: false, error: "no user id" }, { status: 500 });
        }

        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (roleErr && !/duplicate/i.test(roleErr.message)) {
          return Response.json({ ok: false, error: roleErr.message }, { status: 500 });
        }

        return Response.json({ ok: true, email });
      },
    },
  },
});