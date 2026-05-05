export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Rota de debug para verificar a configuração do Supabase e estado da sessão.
 * Acesse /api/auth-debug enquanto logado para diagnosticar problemas.
 */
export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED;
  const allowedEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS;
  const databaseUrl = process.env.DATABASE_URL;

  const keySource = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      : "none";

  const keyFormat = key
    ? key.startsWith("eyJ")
      ? "JWT (correto)"
      : key.startsWith("sb_publishable_")
        ? "publishable (INCORRETO — precisa ser JWT)"
        : "formato desconhecido"
    : "não configurada";

  // Tenta obter a sessão do usuário via cookies
  let sessionInfo: Record<string, unknown> = { status: "não verificado" };
  let dbInfo: Record<string, unknown> = { status: "não verificado" };

  if (url && key) {
    try {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() {
            const cookieHeader = req.headers.get("cookie") ?? "";
            if (!cookieHeader) return [];
            return cookieHeader.split(";").map((c) => {
              const trimmed = c.trim();
              const [name, ...v] = trimmed.split("=");
              return { name: name.trim(), value: v.join("=") };
            }).filter((c) => c.name.length > 0);
          },
          setAll() {},
        },
      });

      // Tenta getSession() primeiro (funciona com cookies fragmentados .0/.1)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const user = sessionData?.session?.user ?? null;

      if (sessionError) {
        sessionInfo = { status: "erro (getSession)", error: sessionError.message };
      } else if (!user) {
        // Fallback: tenta getUser()
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          sessionInfo = { status: "erro (getUser)", error: userError.message };
        } else if (!userData.user) {
          sessionInfo = { status: "sem sessão — cookies sb-* ausentes ou expirados" };
        } else {
          sessionInfo = {
            status: "autenticado (via getUser)",
            userId: userData.user.id,
            email: userData.user.email,
          };
        }
      } else {
        sessionInfo = {
          status: "autenticado (via getSession)",
          userId: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at ? "sim" : "não",
        };

        // Verifica se o usuário existe no banco
        try {
          const { prisma } = await import("@/lib/db");
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profiles = await (prisma as any).profile.findMany({ where: { ownerId: user.id } });
          dbInfo = {
            status: "conectado",
            userExistsInDb: !!dbUser,
            profileCount: profiles.length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            profiles: profiles.map((p: any) => ({ id: p.id, name: p.name })),
          };
        } catch (dbErr) {
          dbInfo = { status: "erro de conexão", error: String(dbErr) };
        }
      }
    } catch (err) {
      sessionInfo = { status: "exceção", error: String(err) };
    }
  }

  // Lista cookies sb-* presentes (sem valores)
  const cookieHeader = req.headers.get("cookie") ?? "";
  const sbCookies = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((name) => name.includes("sb-"));

  const result = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: url ? url.substring(0, 40) + "..." : "NÃO CONFIGURADO",
      keySource,
      keyFormat,
      keyPrefix: key ? key.substring(0, 20) + "..." : "N/A",
      authDisabled: authDisabled || "não configurado (produção normal)",
      allowedEmails: allowedEmails || "NÃO CONFIGURADO (ninguém pode logar!)",
      databaseUrl: databaseUrl ? databaseUrl.substring(0, 40) + "..." : "NÃO CONFIGURADO",
    },
    session: sessionInfo,
    database: dbInfo,
    cookies: {
      sbCookiesPresent: sbCookies,
      count: sbCookies.length,
    },
  };

  return NextResponse.json(result, { status: 200 });
}
