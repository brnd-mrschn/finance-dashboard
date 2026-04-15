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
  const data = { ...body };
  delete data.id;
  delete data.createdAt;
  delete data.transactions;

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { prisma } = await import("@/lib/db");
  const { id } = await params;

  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
