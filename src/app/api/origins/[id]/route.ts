export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, requireProfile } from "@/lib/auth";
import { validateBody, updateOriginSchema } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const { id } = await params;
  const body = await req.json();

  const validation = validateBody(updateOriginSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  // Verifica se a origem pertence ao perfil ativo
  const existing = await prisma.origin.findFirst({
    where: { id, profileId: profileResult.profileId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Origem não encontrada" },
      { status: 404 }
    );
  }

  const validated = validation.data;
  const data: Record<string, unknown> = {};
  if (validated.name !== undefined) data.name = validated.name;

  const origin = await prisma.origin.update({
    where: { id },
    data,
  });

  return NextResponse.json(origin);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const { id } = await params;
  const { prisma } = await import("@/lib/db");

  const existing = await prisma.origin.findFirst({
    where: { id, profileId: profileResult.profileId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Origem não encontrada" },
      { status: 404 }
    );
  }

  await prisma.origin.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
