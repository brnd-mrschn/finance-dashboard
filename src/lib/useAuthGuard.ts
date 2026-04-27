"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

/**
 * Hook de proteção de rota client-side.
 *
 * Verifica se existe uma sessão válida do Supabase.
 * O fluxo OAuth é: login → Google → /auth/callback → redirect to /
 * Aqui apenas checamos se o usuário já tem sessão ativa.
 */
export function useAuthGuard() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  // Ref para o timeout ler o valor atual (evita stale closure)
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

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user?.email && isEmailAllowed(session.user.email)) {
          authStateRef.current = "authenticated";
          setAuthState("authenticated");
        } else {
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

    // Escuta mudanças de auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        console.log("[useAuthGuard] Auth event:", event);

        if (event === "SIGNED_IN" && session?.user?.email) {
          if (isEmailAllowed(session.user.email)) {
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

    // Timeout de segurança — se após 15s ainda está loading sem sessão,
    // redireciona para login. Usa ref para ler o valor ATUAL do estado.
    const timeout = setTimeout(() => {
      if (!cancelled && authStateRef.current === "loading") {
        console.log("[useAuthGuard] Timeout — redirecting to login");
        authStateRef.current = "unauthenticated";
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
