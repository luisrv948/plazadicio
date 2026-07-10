import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean; email?: string }>({
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (mounted) setState({ loading: false, isAdmin: false });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      const isAdmin = !!roles?.some((r) => r.role === "admin");
      if (mounted)
        setState({
          loading: false,
          isAdmin,
          email: sess.session.user.email ?? undefined,
        });
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}