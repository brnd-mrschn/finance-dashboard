import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Callback de autenticação OAuth do Supabase.
 * Redireciona para a home com o código PKCE para que o client-side
 * possa trocar o código por uma sessão (o code_verifier está no localStorage).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Se houve erro no OAuth, redireciona para login com mensagem
  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona para a home com o código — o client-side fará o exchange
  if (code) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("code", code);
    return NextResponse.redirect(homeUrl);
  }

  // Sem código — redireciona para login
  return NextResponse.redirect(new URL("/login", request.url));
}
