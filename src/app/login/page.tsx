"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { FiMail } from "react-icons/fi";

const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  // Lê erro da URL (vindo do callback Route Handler)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      // Limpa ?error= da URL
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  // Se já está logado (verifica via API server-side — lê cookies HttpOnly corretamente)
  useEffect(() => {
    fetch("/api/auth-check").then((res) => {
      if (res.ok) {
        window.location.href = "/";
      }
    }).catch(() => {/* não logado */});
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);

    // Redireciona para /auth/callback — Route Handler server-side
    // faz o PKCE code exchange e seta cookies de sessão.
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!supabase || !magicEmail.trim()) return;
    setMagicLoading(true);
    setErrorMessage(null);
    setMagicSent(false);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setMagicLoading(false);
    } else {
      setMagicSent(true);
      setMagicLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="bg-[var(--surface)] p-8 rounded-lg shadow-lg border border-[var(--border)] w-full max-w-md text-center">
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

        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-[#ed4245]/10 border border-[#ed4245]/30 text-sm text-[#ed4245]">
            {errorMessage}
          </div>
        )}

        {magicSent && (
          <div className="mb-4 p-3 rounded-md bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-sm text-[#3ecf8e]">
            Link enviado para <strong>{magicEmail}</strong>! Verifique sua caixa de entrada.
          </div>
        )}

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
          <div className="space-y-4">
            {/* Magic Link */}
            <div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={magicEmail}
                  onChange={(e) => { setMagicEmail(e.target.value); setMagicSent(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleMagicLink(); }}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button
                  onClick={handleMagicLink}
                  disabled={magicLoading || !magicEmail.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 font-medium text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {magicLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <FiMail size={16} />
                  )}
                  {magicLoading ? "Enviando..." : "Enviar link"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                Enviaremos um link de acesso para seu email.
              </p>
            </div>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--surface)] px-3 text-[var(--muted-foreground)]">ou</span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-white px-5 py-3 font-medium text-gray-700 transition-all hover:bg-gray-100 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? "Entrando..." : "Entrar com Google"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#ed4245] mb-4">
              Serviço de autenticação não configurado.
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Configure as variáveis de ambiente:
            </p>
            <div className="text-left bg-[var(--surface-alt)] rounded-md p-3 text-xs font-mono text-[var(--foreground)] mb-4 space-y-1">
              <p>NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
