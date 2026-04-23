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

    const initAuth = async () => {
      // Se existe um código PKCE na URL, troca por sessão primeiro
      // Usa window.location.search para evitar necessidade de Suspense boundary
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[useAuthGuard] Code exchange error:", error.message);
            if (!cancelled) {
              setAuthState("unauthenticated");
              router.replace("/login");
            }
            return;
          }
          // Limpa o código da URL sem recarregar a página
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error("[useAuthGuard] Code exchange exception:", err);
          if (!cancelled) {
            setAuthState("unauthenticated");
            router.replace("/login");
          }
          return;
        }
      }

      // Verifica se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email || !isEmailAllowed(user.email)) {
        if (!cancelled) {
          setAuthState("unauthenticated");
          router.replace("/login");
        }
        return;
      }

      if (!cancelled) {
        setAuthState("authenticated");
      }
    };

    initAuth();

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
