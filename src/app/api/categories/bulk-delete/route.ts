export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prisma } = await import("@/lib/db");

  const body = await req.json();

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Nenhum ID recebido" }, { status: 400 });
  }

  const result = await prisma.category.deleteMany({
    where: { id: { in: body.ids } },
  });

  return NextResponse.json({ deleted: result.count });
}
