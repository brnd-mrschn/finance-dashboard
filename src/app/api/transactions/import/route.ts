export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, requireProfile } from "@/lib/auth";
import { validateBody, importTransactionsSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const body = await req.json();
  const validation = validateBody(importTransactionsSchema, body);
  if (!validation.success) return validation.response;

  const originId = validation.data.originId || null;

  const data = validation.data.transactions.map((t) => ({
    description: String(t.description).slice(0, 500),
    date: new Date(t.date),
    amount: Math.abs(t.amount),
    type: t.type === "INCOME" ? ("INCOME" as const) : ("EXPENSE" as const),
    originId,
    categoryId: null,
    userId: auth.userId,
    profileId: profileResult.profileId,
  }));

  const { prisma } = await import("@/lib/db");

  const result = await prisma.transaction.createMany({ data });

  return NextResponse.json({ imported: result.count });
}
