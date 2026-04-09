export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const { prisma } = await import("@/lib/db");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { prisma } = await import("@/lib/db");

  const body = await req.json();

  const category = await prisma.category.create({
    data: {
      name: body.name,
      group: body.group,
      subgroup: body.subgroup,
      type: body.type,
      expected: body.expected ? parseFloat(body.expected) : null,
    },
  });

  return NextResponse.json(category);
}