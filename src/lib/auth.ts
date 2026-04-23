import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// E-mails autorizados a acessar o dashboard
const ALLOWED_EMAILS = [
  "monef4xgames@gmail.com",
  "vinicius@dznprojectmedia.com",
];

// Cliente Supabase server-side (singleton)
let serverSupabase: ReturnType<typeof createClient> | null = null;

function getServerSupabase() {
  if (serverSupabase) return serverSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  serverSupabase = createClient(url, key);
  return serverSupabase;
}

export type AuthResult =
  | { authorized: true; userId: string; email: string }
  | { authorized: false; response: NextResponse };

/**
 * Verifica autenticação em API routes.
 *
 * - Se `NEXT_PUBLIC_AUTH_DISABLED=true`, retorna "dev-user" (modo desenvolvimento)
 * - Caso contrário, verifica o token JWT do Supabase no header Authorization
 *   ou nos cookies, e checa se o e-mail está na lista de permitidos.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  // Modo desenvolvimento: auth desativada
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
    return { authorized: true, userId: "dev-user", email: "dev@test.com" };
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Serviço de autenticação não configurado" },
        { status: 500 }
      ),
    };
  }

  // Extrai token do header Authorization
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Fallback: tenta extrair dos cookies do Supabase
  if (!token) {
    token = extractTokenFromCookies(request);
  }

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      ),
    };
  }

  const email = data.user.email;
  if (!email || !ALLOWED_EMAILS.includes(email)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "E-mail não autorizado" },
        { status: 403 }
      ),
    };
  }

  // Garante que o usuário existe no banco
  const { prisma } = await import("@/lib/db");
  const existingUser = await prisma.user.findUnique({
    where: { id: data.user.id },
  });
  if (!existingUser) {
    await prisma.user.create({
      data: { id: data.user.id, email },
    });
  }

  return { authorized: true, userId: data.user.id, email };
}

/**
 * Extrai o access token dos cookies do Supabase.
 * Formato: sb-{ref}-auth-token=URL_ENCODED_JSON
 */
function extractTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";

  // Procura por cookies do Supabase (formato: sb-{ref}-auth-token)
  const sbCookieMatch = cookieHeader.match(
    /sb-[a-zA-Z0-9]+-auth-token=([^;]+)/
  );
  if (!sbCookieMatch) return null;

  try {
    const decoded = decodeURIComponent(sbCookieMatch[1]);
    const parsed = JSON.parse(decoded);
    // O cookie pode ser um array [accessToken, refreshToken, ...] ou um objeto
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    }
    if (parsed?.access_token) {
      return parsed.access_token;
    }
  } catch {
    // Ignora erro de parsing
  }

  return null;
}
