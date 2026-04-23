"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { getSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [authDisabled, setAuthDisabled] = useState(false);

  useEffect(() => {
    // Modo desenvolvimento: auth desativada
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
      setAuthDisabled(true);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Se já está logado, redireciona para o dashboard
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/");
      }
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          router.replace("/");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="bg-[var(--surface)] p-8 rounded-lg shadow-lg border border-[var(--border)] w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#euro_linear_login)"/>
            <text x="16" y="22.5" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="sans-serif">€</text>
            <defs>
              <linearGradient id="euro_linear_login" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3ecf8e"/>
                <stop offset="1" stopColor="#2ba86c"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Finance Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Faça login para acessar seu dashboard financeiro.
        </p>

        {authDisabled ? (
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Modo desenvolvimento — autenticação desativada.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#30a46c] border border-[#3ecf8e] px-5 py-3 font-semibold text-white transition-all hover:bg-[#2b9260] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
            >
              Entrar no dashboard
            </a>
          </div>
        ) : supabase ? (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={["google"]}
            redirectTo={
              typeof window !== "undefined"
                ? `${window.location.origin}/`
                : undefined
            }
            onlyThirdPartyProviders={true}
          />
        ) : (
          <p className="text-sm text-[#ed4245]">
            Serviço de autenticação não configurado. Verifique as variáveis de ambiente.
          </p>
        )}
      </div>
    </div>
  );
}
