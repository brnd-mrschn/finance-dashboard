export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isEmailAllowed } from "@/lib/auth-config";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email || !isEmailAllowed(email)) {
    return NextResponse.json({ allowed: false });
  }
  return NextResponse.json({ allowed: true });
}
