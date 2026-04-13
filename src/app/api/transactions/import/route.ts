export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prisma } = await import("@/lib/db");

  const body = await req.json();

  if (!Array.isArray(body.transactions) || body.transactions.length === 0) {
    return NextResponse.json({ error: "Nenhuma transação recebida" }, { status: 400 });
  }

  if (body.transactions.length > 5000) {
    return NextResponse.json({ error: "Máximo de 5000 transações por importação" }, { status: 400 });
  }

  const originId = body.originId || null;

  const data = body.transactions.map((t: { date: string; description: string; amount: number; type: string }) => ({
    description: String(t.description).slice(0, 500),
    date: new Date(t.date),
    amount: Math.abs(parseFloat(String(t.amount))),
    type: t.type === "INCOME" ? "INCOME" as const : "EXPENSE" as const,
    originId,
    categoryId: null,
    userId: "dev-user",
  }));

  const result = await prisma.transaction.createMany({ data });

  return NextResponse.json({ imported: result.count });
}
