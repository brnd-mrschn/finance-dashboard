export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * Rota para popular o banco com dados de exemplo para o usuário autenticado.
 * Use apenas uma vez — chame GET /api/seed enquanto logado.
 * Cria (ou reutiliza) o perfil padrão do usuário e associa todos os dados a ele.
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const { prisma } = await import("@/lib/db");

  // Obtém ou cria o perfil padrão do usuário
  let profile = await prisma.profile.findFirst({
    where: { ownerId: auth.userId },
  });
  if (!profile) {
    profile = await prisma.profile.create({
      data: { name: "Meu Perfil", ownerId: auth.userId },
    });
  }

  // Verifica se o perfil já tem transações
  const existingCount = await prisma.transaction.count({
    where: { profileId: profile.id },
  });

  if (existingCount > 0) {
    return NextResponse.json({
      message: `Perfil "${profile.name}" já possui ${existingCount} transações. Seed não executado.`,
      userId: auth.userId,
      profileId: profile.id,
    });
  }

  // Cria categorias padrão para este perfil se não existem
  const existingCategories = await prisma.category.count({
    where: { profileId: profile.id },
  });
  if (existingCategories === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Salário",      group: "Renda",     subgroup: "Renda Fixa",    type: "INCOME",  color: "#43b581", profileId: profile.id },
        { name: "Freelance",    group: "Renda",     subgroup: "Renda Extra",   type: "INCOME",  color: "#3dcf8e", profileId: profile.id },
        { name: "Alimentação",  group: "Despesas",  subgroup: "Necessidades",  type: "EXPENSE", color: "#ed4245", profileId: profile.id },
        { name: "Moradia",      group: "Despesas",  subgroup: "Necessidades",  type: "EXPENSE", color: "#f5a623", profileId: profile.id },
        { name: "Transporte",   group: "Despesas",  subgroup: "Necessidades",  type: "EXPENSE", color: "#7289da", profileId: profile.id },
        { name: "Lazer",        group: "Despesas",  subgroup: "Desejos",       type: "EXPENSE", color: "#9b59b6", profileId: profile.id },
      ],
    });
  }

  // Cria origens padrão para este perfil se não existem
  const existingOrigins = await prisma.origin.count({
    where: { profileId: profile.id },
  });
  if (existingOrigins === 0) {
    await prisma.origin.createMany({
      data: [
        { name: "Nubank",    profileId: profile.id },
        { name: "Itaú",      profileId: profile.id },
        { name: "Bradesco",  profileId: profile.id },
        { name: "Santander", profileId: profile.id },
        { name: "PICPAY",    profileId: profile.id },
        { name: "Dinheiro",  profileId: profile.id },
      ],
    });
  }

  // Busca categorias e origens do perfil
  const categories = await prisma.category.findMany({ where: { profileId: profile.id } });
  const origins    = await prisma.origin.findMany({   where: { profileId: profile.id } });

  const salaryCat   = categories.find((c) => c.name === "Salário");
  const foodCat     = categories.find((c) => c.name === "Alimentação");
  const housingCat  = categories.find((c) => c.name === "Moradia");
  const transportCat = categories.find((c) => c.name === "Transporte");
  const leisureCat  = categories.find((c) => c.name === "Lazer");
  const freelanceCat = categories.find((c) => c.name === "Freelance");

  const nubank = origins.find((o) => o.name === "Nubank");
  const itau   = origins.find((o) => o.name === "Itaú");

  const now = new Date();
  const data = [
    // Mês atual
    { userId: auth.userId, profileId: profile.id, description: "Salário",            amount: 5000, type: "INCOME"  as const, date: new Date(now.getFullYear(), now.getMonth(),     5),  categoryId: salaryCat?.id    ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Freelance - Website", amount: 1200, type: "INCOME"  as const, date: new Date(now.getFullYear(), now.getMonth(),    10),  categoryId: freelanceCat?.id ?? null, originId: itau?.id   ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Aluguel",             amount: 1500, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(),     1),  categoryId: housingCat?.id   ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Supermercado",        amount:  400, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(),     8),  categoryId: foodCat?.id      ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Gasolina",            amount:  200, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(),    12),  categoryId: transportCat?.id ?? null, originId: itau?.id   ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Cinema",              amount:   80, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(),    15),  categoryId: leisureCat?.id   ?? null, originId: nubank?.id ?? null },
    // Mês anterior
    { userId: auth.userId, profileId: profile.id, description: "Salário",             amount: 5000, type: "INCOME"  as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 5), categoryId: salaryCat?.id    ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Aluguel",             amount: 1500, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), categoryId: housingCat?.id   ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Supermercado",        amount:  350, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 7), categoryId: foodCat?.id      ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Uber",                amount:  120, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 14), categoryId: transportCat?.id ?? null, originId: itau?.id  ?? null },
    // 2 meses atrás
    { userId: auth.userId, profileId: profile.id, description: "Salário",             amount: 5000, type: "INCOME"  as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 5), categoryId: salaryCat?.id    ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Freelance - App",     amount:  800, type: "INCOME"  as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 20), categoryId: freelanceCat?.id ?? null, originId: itau?.id  ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Aluguel",             amount: 1500, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 1), categoryId: housingCat?.id   ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Restaurante",         amount:  250, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 9), categoryId: foodCat?.id      ?? null, originId: nubank?.id ?? null },
    { userId: auth.userId, profileId: profile.id, description: "Netflix + Spotify",   amount:   65, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 15), categoryId: leisureCat?.id  ?? null, originId: nubank?.id ?? null },
  ];

  await prisma.transaction.createMany({ data });

  return NextResponse.json({
    message: `Seed criado para ${auth.email} (perfil "${profile.name}"): ${data.length} transações, ${categories.length} categorias, ${origins.length} origens`,
    userId: auth.userId,
    profileId: profile.id,
  });
}
