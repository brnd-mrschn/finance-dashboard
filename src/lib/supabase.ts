"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Cliente Supabase browser-side usando @supabase/ssr.
 *
 * Diferença chave: a sessão é persistida em COOKIES (não localStorage).
 * Isso permite que o server-side (Route Handlers, middleware) leia a sessão
 * e elimina race conditions do PKCE flow client-side.
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
    browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          return document.cookie.split(";").map((c) => {
            const [name, ...v] = c.trim().split("=");
            return { name, value: v.join("=") };
          });
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`;
            cookieString += `; path=${options.path ?? "/"}`;
            if (options.maxAge !== undefined) {
              cookieString += `; max-age=${options.maxAge}`;
            }
            if (options.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            if (options.sameSite) {
              cookieString += `; samesite=${options.sameSite}`;
            }
            if (options.secure) {
              cookieString += "; secure";
            }
            document.cookie = cookieString;
          });
        },
      },
    });
  }

  return browserClient;
}
