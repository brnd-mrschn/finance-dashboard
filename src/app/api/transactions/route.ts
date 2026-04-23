export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateBody, createTransactionSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { prisma } = await import("@/lib/db");

  const transactions = await prisma.transaction.findMany({
    where: { userId: auth.userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const validation = validateBody(createTransactionSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");

  const transaction = await prisma.transaction.create({
    data: {
      description: validation.data.description,
      date: new Date(validation.data.date),
      amount: validation.data.amount,
      type: validation.data.type,
      originId: validation.data.originId || null,
      categoryId: validation.data.categoryId || null,
      userId: auth.userId,
    },
  });

  return NextResponse.json(transaction);
}
