export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

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
    data: {
      description: body.description,
      date: new Date(body.date),
      amount: parseFloat(body.amount),
      type: body.type,
      categoryId: body.categoryId || null,
      userId: body.userId ?? "dev-user",
    },
  });

  return NextResponse.json(transaction);
}