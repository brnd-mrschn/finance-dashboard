import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const USER_ID = "dev-user"; // temporário

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    where: { userId: USER_ID },
    orderBy: { date: "desc" },
    include: { category: true },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const body = await req.json();

  const transaction = await prisma.transaction.create({
    data: {
      ...body,
      userId: USER_ID,
    },
  });

  return NextResponse.json(transaction);
}