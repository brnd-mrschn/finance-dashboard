export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/db");

    const origins = await prisma.origin.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(origins);
  } catch (error) {
    console.error("GET /api/origins error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { prisma } = await import("@/lib/db");

  const body = await req.json();

  const origin = await prisma.origin.create({
    data: {
      name: body.name,
    },
  });

  return NextResponse.json(origin);
}
