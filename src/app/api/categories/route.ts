export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateBody, createCategorySchema } from "@/lib/validations";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  const hydratedCategories = categories.map((category) => ({ ...category }));

  // Backfill: atribui cores a categorias que ainda não têm
  const usedColors = hydratedCategories.map((category) => category.color).filter(Boolean) as string[];
  const needsColor = hydratedCategories.filter((category) => !category.color);
  for (const cat of needsColor) {
    try {
      const color = pickCategoryColor(usedColors);
      usedColors.push(color);
      await prisma.category.update({ where: { id: cat.id }, data: { color } });
      cat.color = color;
    } catch {
      // Ignora erro de backfill para não bloquear o GET
    }
  }

  return NextResponse.json(hydratedCategories);
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const validation = validateBody(createCategorySchema, body);
  if (!validation.success) return validation.response;

  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  // Pega cores já usadas para evitar duplicatas
  const existing = await prisma.category.findMany({ select: { color: true } });
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
    },
  });

  return NextResponse.json(category);
}
