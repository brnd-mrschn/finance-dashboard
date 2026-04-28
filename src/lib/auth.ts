import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isEmailAllowed } from "@/lib/auth-config";

export type AuthResult =
  | { authorized: true; userId: string; email: string }
  | { authorized: false; response: NextResponse };

/**
 * Verifica autenticação em API routes.
 *
 * - Se `NEXT_PUBLIC_AUTH_DISABLED=true`, retorna "dev-user" (modo desenvolvimento)
 * - Caso contrário, usa @supabase/ssr createServerClient para ler a sessão
 *   dos cookies e verifica se o e-mail está na lista de permitidos.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  // Modo desenvolvimento: auth desativada
  if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
    return { authorized: true, userId: "dev-user", email: "dev@test.com" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Serviço de autenticação não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env" },
        { status: 500 }
      ),
    };
  }

  // Cria um server client que lê os cookies do request
  // Nota: em API routes, não precisamos setar cookies (setAll é no-op)
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("cookie") ?? "";
        if (!cookieHeader) return [];
        return cookieHeader.split(";").map((c) => {
          const trimmed = c.trim();
          if (!trimmed) return null;
          const [name, ...v] = trimmed.split("=");
          return { name, value: v.join("=") };
        }).filter((c): c is { name: string; value: string } => c !== null && c.name.length > 0);
      },
      setAll() {
        // API routes não precisam setar cookies de sessão
        // (isso é feito pelo Route Handler de callback)
      },
    },
  });

  // Obtém o usuário a partir da sessão nos cookies
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  const email = data.user.email;
  if (!email || !isEmailAllowed(email)) {
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
