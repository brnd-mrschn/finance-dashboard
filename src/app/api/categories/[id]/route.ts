export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateBody, updateCategorySchema } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const validation = validateBody(updateCategorySchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  // Verifica se a categoria existe
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Categoria não encontrada" },
      { status: 404 }
    );
  }

  // Constrói objeto de update apenas com campos válidos
  const validated = validation.data;
  const data: Record<string, unknown> = {};

  if (validated.name !== undefined) data.name = validated.name;
  if (validated.group !== undefined) data.group = validated.group;
  if (validated.subgroup !== undefined) data.subgroup = validated.subgroup;
  if (validated.type !== undefined) data.type = validated.type;
  if (validated.expected !== undefined) data.expected = validated.expected;
  if (validated.color !== undefined) data.color = validated.color;

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return NextResponse.json(category);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prisma } = await import("@/lib/db");

  // Verifica se a categoria existe
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Categoria não encontrada" },
      { status: 404 }
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
