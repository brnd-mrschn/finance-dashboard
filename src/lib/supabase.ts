"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Cliente Supabase browser-side usando @supabase/ssr.
 *
 * Usa localStorage para persistir a sessão no browser (padrão do createBrowserClient).
 * O server-side (Route Handlers, callback) usa cookies via createServerClient.
 *
 * Após o PKCE exchange no /auth/callback (server-side), o Supabase seta cookies
 * de sessão na response. O browser client detecta a sessão via INITIAL_SESSION
 * event e a persiste em localStorage para leituras subsequentes.
 */
export function getSupabaseClient() {
  // .trim() remove \r\n de arquivos .env com line endings Windows
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // Suporta ambos os nomes: ANON_KEY (legado) e PUBLISHABLE_KEY (novo nome do Supabase)
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!browserClient) {
    // Sem custom cookie adapter — usa localStorage (padrão do createBrowserClient).
    // O server-side lê os cookies HttpOnly setados pelo callback.
    // O client-side lê o localStorage setado pelo SDK após o INITIAL_SESSION event.
    browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return browserClient;
}
