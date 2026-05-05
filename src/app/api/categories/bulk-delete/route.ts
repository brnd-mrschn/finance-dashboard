export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, requireProfile } from "@/lib/auth";
import { validateBody, bulkDeleteSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const body = await req.json();
  const validation = validateBody(bulkDeleteSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  // Só deleta categorias que pertencem ao perfil ativo
  const result = await prisma.category.deleteMany({
    where: {
      id: { in: validation.data.ids },
      profileId: profileResult.profileId,
    },
  });

  return NextResponse.json({ deleted: result.count });
}
