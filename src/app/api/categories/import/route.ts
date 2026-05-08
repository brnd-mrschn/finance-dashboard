export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, requireProfile } from "@/lib/auth";
import { validateBody, importCategoriesSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const body = await req.json();
  const validation = validateBody(importCategoriesSchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  // Busca cores já usadas no perfil
  const existing = await prisma.category.findMany({
    where: { profileId: profileResult.profileId },
    select: { color: true, name: true, group: true, subgroup: true, type: true },
  });
  const usedColors = existing.map((c) => c.color).filter(Boolean) as string[];

  // Cria set para detectar duplicatas (nome+grupo+subgrupo+tipo)
  const existingKeys = new Set(
    existing.map((c) => `${c.name.toLowerCase()}|${c.group.toLowerCase()}|${c.subgroup.toLowerCase()}|${c.type}`)
  );

  const data = [];
  for (const cat of validation.data.categories) {
    const key = `${cat.name.toLowerCase()}|${cat.group.toLowerCase()}|${cat.subgroup.toLowerCase()}|${cat.type}`;
    if (existingKeys.has(key)) continue; // pula duplicata
    existingKeys.add(key);

    const color = pickCategoryColor(usedColors);
    usedColors.push(color);

    data.push({
      name: String(cat.name).slice(0, 100),
      group: String(cat.group).slice(0, 100),
      subgroup: String(cat.subgroup).slice(0, 100),
      type: cat.type === "INCOME" ? ("INCOME" as const) : ("EXPENSE" as const),
      expected: null,
      color,
      profileId: profileResult.profileId,
    });
  }

  if (data.length === 0) {
    return NextResponse.json({ imported: 0, skipped: validation.data.categories.length });
  }

  const result = await prisma.category.createMany({ data });

  return NextResponse.json({
    imported: result.count,
    skipped: validation.data.categories.length - result.count,
  });
}
