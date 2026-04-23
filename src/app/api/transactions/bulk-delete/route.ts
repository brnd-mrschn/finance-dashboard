export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateBody, bulkDeleteSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const validation = validateBody(bulkDeleteSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  // Só deleta transações que pertencem ao usuário autenticado
  const result = await prisma.transaction.deleteMany({
    where: {
      id: { in: validation.data.ids },
      userId: auth.userId,
    },
  });

  return NextResponse.json({ deleted: result.count });
}
