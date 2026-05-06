export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/auth-check
 * Verifica se o usuário está autenticado lendo os cookies de sessão server-side.
 * Usado pelo useAuthGuard para verificar autenticação sem depender do client-side SDK.
 *
 * Retorna 200 se autenticado, 401 se não autenticado.
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  return NextResponse.json({ ok: true, userId: auth.userId, email: auth.email });
}
