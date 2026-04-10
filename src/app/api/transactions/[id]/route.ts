export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { prisma } = await import("@/lib/db");
  const { id } = await params;
  const body = await req.json();

  // Remove campos que não devem ser atualizados diretamente
  const { id: _id, createdAt, user, category, origin, ...data } = body;

  // Converte date string para Date se necessário
  if (data.date && typeof data.date === "string") {
    data.date = new Date(data.date);
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data,
  });

  return NextResponse.json(transaction);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { prisma } = await import("@/lib/db");
  const { id } = await params;

  await prisma.transaction.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
