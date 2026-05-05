export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, requireProfile } from "@/lib/auth";
import { validateBody, createOriginSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  try {
    const { prisma } = await import("@/lib/db");

    const origins = await prisma.origin.findMany({
      where: { profileId: profileResult.profileId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(origins);
  } catch (error) {
    console.error("GET /api/origins error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const body = await req.json();
  const validation = validateBody(createOriginSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  const origin = await prisma.origin.create({
    data: {
      name: validation.data.name,
      profileId: profileResult.profileId,
    },
  });

  return NextResponse.json(origin);
}
