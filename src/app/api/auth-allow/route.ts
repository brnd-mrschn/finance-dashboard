export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const ALLOWED_EMAILS = [
  "monef4xgames@gmail.com",
  "vinicius@dznprojectmedia.com",
];

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email || !ALLOWED_EMAILS.includes(email)) {
    return NextResponse.json({ allowed: false });
  }
  return NextResponse.json({ allowed: true });
}
