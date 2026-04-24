"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

/**
 * Hook de proteção de rota client-side.
 *
 * IMPORTANTE: Quando há ?code= na URL (retorno do OAuth PKCE),
 * NÃO redireciona para /login. O Supabase client com
 * detectSessionInUrl=true troca o código automaticamente e
 * dispara o evento SIGNED_IN via onAuthStateChange.
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

    // Detecta se há código PKCE na URL (retorno do OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has("code");

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user?.email && isEmailAllowed(session.user.email)) {
          // Limpa ?code= da URL
          if (hasCode) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setAuthState("authenticated");
        } else if (hasCode) {
          // Há código PKCE mas sessão ainda não foi estabelecida.
          // NÃO redireciona! O detectSessionInUrl vai trocar o código
          // e o onAuthStateChange vai capturar o SIGNED_IN.
          // Mantém como "loading" e aguarda.
          console.log("[useAuthGuard] PKCE code in URL, waiting for session...");
        } else {
          // Sem sessão e sem código — não autenticado
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

    // Escuta mudanças de auth — captura SIGNED_IN após code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        console.log("[useAuthGuard] Auth event:", event);

        if (event === "SIGNED_IN" && session?.user?.email) {
          if (isEmailAllowed(session.user.email)) {
            // Limpa ?code= da URL
            if (window.location.search.includes("code=")) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            setAuthState("authenticated");
          } else {
            supabase.auth.signOut();
            setAuthState("unauthenticated");
          }
        } else if (event === "SIGNED_OUT") {
          setAuthState("unauthenticated");
        }
        // Para outros eventos (TOKEN_REFRESHED, etc), não muda o estado
        // se já está autenticado
      }
    );

    // Timeout de segurança — se após 15s ainda está loading sem sessão,
    // redireciona para login
    const timeout = setTimeout(() => {
      if (!cancelled && authState === "loading") {
        console.log("[useAuthGuard] Timeout — redirecting to login");
        setAuthState("unauthenticated");
      }
    }, 15000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return authState;
}
