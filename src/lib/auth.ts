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
      },
    },
  });

  // Obtém a sessão a partir dos cookies (leitura local, sem round-trip ao Supabase)
  // Nota: getSession() é suficiente para API routes internas — o token já foi
  // validado pelo Supabase no momento do login (callback PKCE).
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    // Fallback: tenta getUser() caso getSession() falhe
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        ),
      };
    }
    const email = userData.user.email;
    if (!email || !isEmailAllowed(email)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "E-mail não autorizado" },
          { status: 403 }
        ),
      };
    }
    const { prisma } = await import("@/lib/db");
    const existingUser = await prisma.user.findUnique({ where: { id: userData.user.id } });
    if (!existingUser) {
      await prisma.user.create({ data: { id: userData.user.id, email } });
    }
    return { authorized: true, userId: userData.user.id, email };
  }

  const user = sessionData.session.user;
  const email = user.email;

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
    where: { id: user.id },
  });
  if (!existingUser) {
    await prisma.user.create({
      data: { id: user.id, email },
    });
  }

  return { authorized: true, userId: user.id, email };
}

/**
 * Extrai e valida o profileId do header x-profile-id.
 * Verifica se o usuário tem acesso ao perfil (dono ou acesso compartilhado).
 * Retorna o profileId ou uma resposta de erro.
 */
export async function requireProfile(
  request: Request,
  userId: string
): Promise<{ ok: true; profileId: string } | { ok: false; response: NextResponse }> {
  const profileId = request.headers.get("x-profile-id");

  if (!profileId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Perfil não selecionado" }, { status: 400 }),
    };
  }

  const { prisma } = await import("@/lib/db");

  // Verifica se o usuário é dono ou tem acesso compartilhado
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      OR: [
        { ownerId: userId },
        { accesses: { some: { userId } } },
      ],
    },
  });

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Perfil não encontrado ou sem acesso" }, { status: 403 }),
    };
  }

  return { ok: true, profileId };
}
