import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Suporta ambos os nomes: ANON_KEY (legado) e PUBLISHABLE_KEY (novo nome do Supabase)
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Desativa detecção automática de ?code= na URL.
        // A troca PKCE é feita explicitamente no /auth/callback.
        // Isso evita conflitos e race conditions.
        detectSessionInUrl: false,
        // Persiste sessão no localStorage (padrão)
        persistSession: true,
      },
    });
  }

  return browserClient;
}
