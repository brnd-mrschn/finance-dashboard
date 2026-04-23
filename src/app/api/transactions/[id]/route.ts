export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateBody, updateTransactionSchema } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const validation = validateBody(updateTransactionSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  // Verifica se a transação pertence ao usuário
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Transação não encontrada" },
      { status: 404 }
    );
  }

  // Constrói objeto de update apenas com campos válidos
  const validated = validation.data;
  const data: Record<string, unknown> = {};

  if (validated.description !== undefined) data.description = validated.description;
  if (validated.amount !== undefined) data.amount = validated.amount;
  if (validated.type !== undefined) data.type = validated.type;
  if (validated.categoryId !== undefined) data.categoryId = validated.categoryId || null;
  if (validated.originId !== undefined) data.originId = validated.originId || null;
  if (validated.date !== undefined) data.date = new Date(validated.date);

  const transaction = await prisma.transaction.update({
    where: { id },
    data,
  });

  return NextResponse.json(transaction);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prisma } = await import("@/lib/db");

  // Verifica se a transação pertence ao usuário
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Transação não encontrada" },
      { status: 404 }
    );
  }

  await prisma.transaction.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
