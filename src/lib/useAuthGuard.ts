"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

/**
 * Hook de proteção de rota client-side.
 *
 * Com detectSessionInUrl=false, apenas verifica se há sessão
 * no localStorage. A troca PKCE é feita no /auth/callback.
 */
export function useAuthGuard() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    // Modo desenvolvimento: auth desativada
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
      setAuthState("authenticated");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthState("unauthenticated");
      return;
    }

    let cancelled = false;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user?.email && isEmailAllowed(session.user.email)) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
        }
      } catch (err) {
        console.error("[useAuthGuard] Error:", err);
        if (!cancelled) {
          setAuthState("unauthenticated");
        }
      }
    };

    checkAuth();

    // Escuta mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        if (event === "SIGNED_OUT" || !session?.user) {
          setAuthState("unauthenticated");
        } else if (session.user.email && isEmailAllowed(session.user.email)) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}
