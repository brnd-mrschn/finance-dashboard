"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

/**
 * Hook de proteção de rota client-side.
 *
 * Verifica autenticação de duas formas:
 * 1. Via API server-side (/api/auth-check) — lê cookies HttpOnly corretamente
 * 2. Via Supabase client-side como fallback (para eventos de sign-out)
 *
 * Fluxo: login → Google → /auth/callback (server) → / (com cookies de sessão)
 * Aqui: chama /api/auth-check → authenticated ou unauthenticated.
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

    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Verifica autenticação via API server-side (lê cookies HttpOnly)
        const res = await fetch("/api/auth-check");
        if (cancelled) return;

        if (res.ok) {
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

    // Escuta mudanças de auth via Supabase client (ex: sign out)
    const supabase = getSupabaseClient();
    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (cancelled) return;
        console.log("[useAuthGuard] Auth event:", event);

        if (event === "SIGNED_OUT") {
          authStateRef.current = "unauthenticated";
          setAuthState("unauthenticated");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Re-verifica via API para garantir que o email está na whitelist
          checkAuth();
        }
      });
      subscription = data.subscription;
    }

    // Timeout de segurança — se após 15s ainda está loading, redireciona para login
    const timeout = setTimeout(() => {
      if (!cancelled && authStateRef.current === "loading") {
        console.log("[useAuthGuard] Timeout — redirecting to login");
        authStateRef.current = "unauthenticated";
        setAuthState("unauthenticated");
      }
    }, 15000);

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return authState;
}
