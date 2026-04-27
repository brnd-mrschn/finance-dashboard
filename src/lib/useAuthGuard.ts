"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

/**
 * Hook de proteção de rota client-side.
 *
 * Fluxo OAuth: login → Google → Supabase redirecta para /?code=xxx
 * Com detectSessionInUrl=true (padrão), o Supabase client troca
 * o código automaticamente e dispara onAuthStateChange.
 *
 * IMPORTANTE: Quando há ?code= na URL, NÃO redireciona para /login.
 * O Supabase está processando o código — aguardamos o evento SIGNED_IN.
 */
export function useAuthGuard() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const authStateRef = useRef<AuthState>("loading");

  useEffect(() => {
    // Modo desenvolvimento: auth desativada
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
      authStateRef.current = "authenticated";
      setAuthState("authenticated");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      authStateRef.current = "unauthenticated";
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
          authStateRef.current = "authenticated";
          setAuthState("authenticated");
        } else if (hasCode) {
          // Há código PKCE mas sessão ainda não foi estabelecida.
          // NÃO redireciona! O detectSessionInUrl está trocando o código.
          // onAuthStateChange vai capturar o SIGNED_IN.
          console.log("[useAuthGuard] PKCE code in URL, waiting for session...");
          // Mantém estado "loading" — aguarda onAuthStateChange
        } else {
          // Sem sessão e sem código — não autenticado
          authStateRef.current = "unauthenticated";
          setAuthState("unauthenticated");
        }
      } catch (err) {
        console.error("[useAuthGuard] Error:", err);
        if (!cancelled) {
          authStateRef.current = "unauthenticated";
          setAuthState("unauthenticated");
        }
      }
    };

    checkAuth();

    // Escuta mudanças de auth — captura SIGNED_IN após code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        console.log("[useAuthGuard] Auth event:", event, session?.user?.email);

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.email) {
          if (isEmailAllowed(session.user.email)) {
            // Limpa ?code= da URL se ainda presente
            if (window.location.search.includes("code=")) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            authStateRef.current = "authenticated";
            setAuthState("authenticated");
          } else {
            supabase.auth.signOut();
            authStateRef.current = "unauthenticated";
            setAuthState("unauthenticated");
          }
        } else if (event === "SIGNED_OUT") {
          authStateRef.current = "unauthenticated";
          setAuthState("unauthenticated");
        }
      }
    );

    // Timeout de segurança — se após 20s ainda está loading sem sessão,
    // redireciona para login. Usa ref para ler o valor ATUAL do estado.
    const timeout = setTimeout(() => {
      if (!cancelled && authStateRef.current === "loading") {
        console.log("[useAuthGuard] Timeout — redirecting to login");
        authStateRef.current = "unauthenticated";
        setAuthState("unauthenticated");
      }
    }, 20000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return authState;
}
