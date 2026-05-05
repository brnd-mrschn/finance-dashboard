export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/profiles
 * Retorna todos os perfis que o usuário autenticado pode acessar
 * (perfis que ele criou + perfis compartilhados com ele).
 * Se não houver nenhum, cria um perfil padrão automaticamente.
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { prisma } = await import("@/lib/db");

  try {
    // Perfis que o usuário é dono
    const ownedProfiles = await prisma.profile.findMany({
      where: { ownerId: auth.userId },
      orderBy: { createdAt: "asc" },
    });

    // Perfis compartilhados com o usuário
    const sharedAccesses = await prisma.profileAccess.findMany({
      where: { userId: auth.userId },
      include: { profile: true },
    });
    const sharedProfiles = sharedAccesses.map((a) => a.profile);

    // Combina e remove duplicatas
    const allProfiles = [...ownedProfiles];
    for (const p of sharedProfiles) {
      if (!allProfiles.find((op) => op.id === p.id)) {
        allProfiles.push(p);
      }
    }

    // Se o usuário não tem nenhum perfil, cria um padrão automaticamente
    if (allProfiles.length === 0) {
      // Garante que o usuário existe no banco antes de criar o perfil
      const existingUser = await prisma.user.findUnique({
        where: { id: auth.userId },
      });
      if (!existingUser) {
        await prisma.user.create({
          data: { id: auth.userId, email: auth.email },
        });
      }

      const defaultProfile = await prisma.profile.create({
        data: {
          name: "Meu Perfil",
          ownerId: auth.userId,
        },
      });
      allProfiles.push(defaultProfile);
    }

    return NextResponse.json(allProfiles);
  } catch (err) {
    console.error("[api/profiles GET] Error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar perfis", detail: String(err) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Cria um novo perfil para o usuário autenticado.
 * Body: { name: string }
 */
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const name = (body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const { prisma } = await import("@/lib/db");

  try {
    const profile = await prisma.profile.create({
      data: { name, ownerId: auth.userId },
    });
    return NextResponse.json(profile);
  } catch (err) {
    console.error("[api/profiles POST] Error:", err);
    return NextResponse.json(
      { error: "Erro ao criar perfil", detail: String(err) },
      { status: 500 }
    );
  }
}
