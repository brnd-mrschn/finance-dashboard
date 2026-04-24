"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function useAuthGuard() {
  const router = useRouter();
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
      router.replace("/login");
      return;
    }

    let cancelled = false;

    // Verifica se o usuário está autenticado
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user || !user.email || !isEmailAllowed(user.email)) {
        setAuthState("unauthenticated");
        router.replace("/login");
        return;
      }

      setAuthState("authenticated");
    };

    checkAuth();

    // Escuta mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        if (event === "SIGNED_OUT" || !session?.user) {
          setAuthState("unauthenticated");
          router.replace("/login");
        } else if (
          session.user.email &&
          isEmailAllowed(session.user.email)
        ) {
          setAuthState("authenticated");
        } else {
          // Email não autorizado
          setAuthState("unauthenticated");
          router.replace("/login");
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  return authState;
}
