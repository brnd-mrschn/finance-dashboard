export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * Rota de debug para verificar a configuração do Supabase.
 * Remove após resolver problemas de auth.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED;
  const allowedEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS;

  const keySource = key ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : publishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : "none";
  const activeKey = key || publishableKey;
  const keyFormat = activeKey
    ? activeKey.startsWith("eyJ")
      ? "JWT (correto)"
      : activeKey.startsWith("sb_publishable_")
        ? "publishable (INCORRETO — precisa ser JWT)"
        : "formato desconhecido"
    : "não configurada";

  const result = {
    supabaseUrl: url || "NÃO CONFIGURADO",
    keySource,
    keyFormat,
    keyPrefix: activeKey ? activeKey.substring(0, 20) + "..." : "N/A",
    authDisabled: authDisabled || "não configurado",
    allowedEmails: allowedEmails || "não configurado (usa padrão: *)",
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(result, { status: 200 });
}
