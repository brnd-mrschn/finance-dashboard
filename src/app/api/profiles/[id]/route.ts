export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * PATCH /api/profiles/[id]
 * Atualiza o nome de um perfil. Apenas o dono pode editar.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const name = (body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const { prisma } = await import("@/lib/db");

  // Verifica se o usuário é dono do perfil
  const profile = await prisma.profile.findFirst({
    where: { id, ownerId: auth.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado ou sem permissão" }, { status: 404 });
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/profiles/[id]
 * Exclui um perfil e todos os dados associados. Apenas o dono pode excluir.
 * Não permite excluir o último perfil do usuário.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prisma } = await import("@/lib/db");

  // Verifica se o usuário é dono do perfil
  const profile = await prisma.profile.findFirst({
    where: { id, ownerId: auth.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado ou sem permissão" }, { status: 404 });
  }

  // Não permite excluir o último perfil
  const count = await prisma.profile.count({ where: { ownerId: auth.userId } });
  if (count <= 1) {
    return NextResponse.json({ error: "Não é possível excluir o único perfil" }, { status: 400 });
  }

  // Exclui em cascata: transações, categorias, origens, acessos
  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { profileId: id } }),
    prisma.category.deleteMany({ where: { profileId: id } }),
    prisma.origin.deleteMany({ where: { profileId: id } }),
    prisma.profileAccess.deleteMany({ where: { profileId: id } }),
    prisma.profile.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
