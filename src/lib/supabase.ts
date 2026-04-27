import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

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
    // Usar configuração padrão — detectSessionInUrl=true permite
    // que o Supabase troque o código PKCE automaticamente em qualquer página.
    browserClient = createClient(supabaseUrl, supabaseKey);
  }

  return browserClient;
}
