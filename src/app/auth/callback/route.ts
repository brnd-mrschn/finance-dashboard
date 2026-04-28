import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/auth-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route Handler para o callback OAuth do Supabase.
 *
 * O Google OAuth redireciona para /auth/callback?code=xxx.
 * Esta rota troca o código PKCE por uma sessão SERVER-SIDE,
 * seta os cookies de autenticação na response, e redireciona para /.
 *
 * Isso elimina race conditions do client-side code exchange
 * que causavam o redirect loop ("This page couldn't load").
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

  // Erro retornado pelo provedor OAuth
  if (oauthError) {
    const desc = requestUrl.searchParams.get("error_description") || oauthError;
    console.error("[auth/callback] OAuth error:", desc);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(desc)}`
    );
  }

  // Sem código — redireciona para login
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error("[auth/callback] Supabase not configured");
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        "Serviço de autenticação não configurado"
      )}`
    );
  }

  // Cria a response de redirect ANTES do exchange.
  // O callback setAll vai setar os cookies de sessão nesta response.
  const response = NextResponse.redirect(`${requestUrl.origin}/`);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Troca o código PKCE por uma sessão (server-side!)
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      "[auth/callback] Code exchange error:",
      exchangeError.message
    );
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        "Falha na autenticação. Tente novamente."
      )}`
    );
  }

  // Verifica se o email é permitido
  const email = data.session?.user?.email;
  if (!email || !isEmailAllowed(email)) {
    console.warn("[auth/callback] Email not allowed:", email);
    // Limpa cookies de sessão e redireciona com erro
    const errorResponse = NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        "Email não autorizado. Contate o administrador."
      )}`
    );
    response.cookies.getAll().forEach((cookie) => {
      if (cookie.name.includes("sb-")) {
        errorResponse.cookies.delete(cookie.name);
      }
    });
    return errorResponse;
  }

  // Garante que o usuário existe no banco
  try {
    const { prisma } = await import("@/lib/db");
    const existingUser = await prisma.user.findUnique({
      where: { id: data.session!.user.id },
    });
    if (!existingUser) {
      await prisma.user.create({
        data: { id: data.session!.user.id, email },
      });
    }
  } catch (dbError) {
    console.error("[auth/callback] DB error (non-blocking):", dbError);
    // Não bloqueia o login por erro de DB
  }

  console.log("[auth/callback] Success — redirecting to / for:", email);
  return response;
}
