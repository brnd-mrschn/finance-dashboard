"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { isEmailAllowed } from "@/lib/auth-config";

/**
 * Página de callback OAuth do Supabase.
 *
 * O Supabase JS client tem detectSessionInUrl=true por padrão,
 * então ele automaticamente detecta o ?code= na URL e troca por sessão.
 * Esta página apenas espera o evento SIGNED_IN e redireciona.
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      window.location.href = "/login";
      return;
    }

    // Verifica se já tem sessão (detectSessionInUrl pode ter resolvido rápido)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email && isEmailAllowed(session.user.email)) {
        window.location.href = "/";
      }
    });

    // Escuta o evento de SIGNED_IN (detectSessionInUrl dispara isso)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user?.email) {
          if (isEmailAllowed(session.user.email)) {
            // Full reload para evitar race conditions com useAuthGuard
            window.location.href = "/";
          } else {
            // Email não autorizado
            supabase.auth.signOut().then(() => {
              setError("Email não autorizado. Contate o administrador.");
              setTimeout(() => { window.location.href = "/login"; }, 3000);
            });
          }
        } else if (event === "SIGNED_OUT") {
          window.location.href = "/login";
        }
      }
    );

    // Timeout de segurança — se nada acontecer em 10s, volta para login
    const timeout = setTimeout(() => {
      setError("Tempo esgotado. Tente novamente.");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#euro_callback)"/>
          <text x="16" y="22.5" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="sans-serif">€</text>
          <defs>
            <linearGradient id="euro_callback" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3ecf8e"/>
              <stop offset="1" stopColor="#2ba86c"/>
            </linearGradient>
          </defs>
        </svg>
        {error ? (
          <>
            <p className="text-sm text-[#ed4245]">{error}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Redirecionando para login...</p>
          </>
        ) : (
          <>
            <svg className="animate-spin h-6 w-6 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">Autenticando...</p>
          </>
        )}
      </div>
    </div>
  );
}
