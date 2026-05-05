export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, requireProfile } from "@/lib/auth";
import { validateBody, createCategorySchema } from "@/lib/validations";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  const categories = await prisma.category.findMany({
    where: { profileId: profileResult.profileId },
    orderBy: { name: "asc" },
  });

  // Backfill: atribui cores a categorias que ainda não têm
  const usedColors = categories.map((c) => c.color).filter(Boolean) as string[];
  const needsColor = categories.filter((c) => !c.color);
  for (const cat of needsColor) {
    try {
      const color = pickCategoryColor(usedColors);
      usedColors.push(color);
      await prisma.category.update({ where: { id: cat.id }, data: { color } });
      cat.color = color;
    } catch {
      // Ignora erro de backfill
    }
  }

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const profileResult = await requireProfile(req, auth.userId);
  if (!profileResult.ok) return profileResult.response;

  const body = await req.json();
  const validation = validateBody(createCategorySchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  const existing = await prisma.category.findMany({
    where: { profileId: profileResult.profileId },
    select: { color: true },
  });
  const usedColors = existing.map((c) => c.color).filter(Boolean) as string[];
  const color = validation.data.color || pickCategoryColor(usedColors);

  const category = await prisma.category.create({
    data: {
      name: validation.data.name,
      group: validation.data.group,
      subgroup: validation.data.subgroup,
      type: validation.data.type,
      expected: validation.data.expected ?? null,
      color,
      profileId: profileResult.profileId,
    },
  });

  return NextResponse.json(category);
}
