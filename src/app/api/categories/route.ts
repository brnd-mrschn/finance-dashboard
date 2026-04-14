export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  const categories = await prisma.category.findMany({
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
      (cat as any).color = color;
    } catch {
      // Ignora erro de backfill para não bloquear o GET
    }
  }

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { prisma } = await import("@/lib/db");
  const { pickCategoryColor } = await import("@/lib/category-colors");

  const body = await req.json();

  // Pega cores já usadas para evitar duplicatas
  const existing = await prisma.category.findMany({ select: { color: true } });
  const usedColors = existing.map((c) => c.color).filter(Boolean) as string[];
  const color = body.color || pickCategoryColor(usedColors);

  const category = await prisma.category.create({
    data: {
      name: body.name,
      group: body.group,
      subgroup: body.subgroup,
      type: body.type,
      expected: body.expected ? parseFloat(body.expected) : null,
      color,
    },
  });

  return NextResponse.json(category);
}