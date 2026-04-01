export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// ❗ IMPORTANTE: lazy import
export async function GET() {
  const { prisma } = await import("@/lib/db");

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const { prisma } = await import("@/lib/db");

  const body = await req.json();

  const transaction = await prisma.transaction.create({
    data: body,
  });

  return NextResponse.json(transaction);
}