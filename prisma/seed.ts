import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Encontra o primeiro usuário real (não dev-user)
  let user = await prisma.user.findFirst({
    where: { id: { not: "dev-user" } },
    orderBy: { createdAt: "asc" },
  });

  // Se não há usuário real, usa dev-user
  if (!user) {
    user = await prisma.user.upsert({
      where: { id: "dev-user" },
      update: {},
      create: { id: "dev-user", email: "dev@test.com" },
    });
  }

  // Verifica se o usuário já tem transações
  const existingCount = await prisma.transaction.count({
    where: { userId: user.id },
  });

  if (existingCount > 0) {
    console.log(`Usuário ${user.email} já possui ${existingCount} transações. Pulando seed.`);
    return;
  }

  // Cria categorias padrão se não existem
  const existingCategories = await prisma.category.count();
  if (existingCategories === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Salário", group: "Renda", subgroup: "Renda Fixa", type: "INCOME", color: "#43b581" },
        { name: "Freelance", group: "Renda", subgroup: "Renda Extra", type: "INCOME", color: "#3dcf8e" },
        { name: "Alimentação", group: "Despesas", subgroup: "Necessidades", type: "EXPENSE", color: "#ed4245" },
        { name: "Moradia", group: "Despesas", subgroup: "Necessidades", type: "EXPENSE", color: "#f5a623" },
        { name: "Transporte", group: "Despesas", subgroup: "Necessidades", type: "EXPENSE", color: "#7289da" },
        { name: "Lazer", group: "Despesas", subgroup: "Desejos", type: "EXPENSE", color: "#9b59b6" },
      ],
    });
  }

  // Cria origens padrão se não existem
  const existingOrigins = await prisma.origin.count();
  if (existingOrigins === 0) {
    await prisma.origin.createMany({
      data: [
        { name: "Nubank" },
        { name: "Itaú" },
        { name: "Bradesco" },
        { name: "Santander" },
        { name: "PICPAY" },
        { name: "Dinheiro" },
      ],
    });
  }

  // Busca categorias e origens criadas
  const categories = await prisma.category.findMany();
  const origins = await prisma.origin.findMany();

  const salaryCat = categories.find((c) => c.name === "Salário");
  const foodCat = categories.find((c) => c.name === "Alimentação");
  const housingCat = categories.find((c) => c.name === "Moradia");
  const transportCat = categories.find((c) => c.name === "Transporte");
  const leisureCat = categories.find((c) => c.name === "Lazer");
  const freelanceCat = categories.find((c) => c.name === "Freelance");

  const nubank = origins.find((o) => o.name === "Nubank");
  const itau = origins.find((o) => o.name === "Itaú");

  // Cria transações de exemplo para o usuário
  const now = new Date();
  const data = [
    // Mes atual
    { userId: user.id, description: "Salário", amount: 5000, type: "INCOME" as const, date: new Date(now.getFullYear(), now.getMonth(), 5), categoryId: salaryCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Freelance - Website", amount: 1200, type: "INCOME" as const, date: new Date(now.getFullYear(), now.getMonth(), 10), categoryId: freelanceCat?.id || null, originId: itau?.id || null },
    { userId: user.id, description: "Aluguel", amount: 1500, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(), 1), categoryId: housingCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Supermercado", amount: 400, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(), 8), categoryId: foodCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Gasolina", amount: 200, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(), 12), categoryId: transportCat?.id || null, originId: itau?.id || null },
    { userId: user.id, description: "Cinema", amount: 80, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth(), 15), categoryId: leisureCat?.id || null, originId: nubank?.id || null },
    // Mês anterior
    { userId: user.id, description: "Salário", amount: 5000, type: "INCOME" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 5), categoryId: salaryCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Aluguel", amount: 1500, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 1), categoryId: housingCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Supermercado", amount: 350, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 7), categoryId: foodCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Uber", amount: 120, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 1, 14), categoryId: transportCat?.id || null, originId: itau?.id || null },
    // 2 meses atrás
    { userId: user.id, description: "Salário", amount: 5000, type: "INCOME" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 5), categoryId: salaryCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Freelance - App", amount: 800, type: "INCOME" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 20), categoryId: freelanceCat?.id || null, originId: itau?.id || null },
    { userId: user.id, description: "Aluguel", amount: 1500, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 1), categoryId: housingCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Restaurante", amount: 250, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 9), categoryId: foodCat?.id || null, originId: nubank?.id || null },
    { userId: user.id, description: "Netflix + Spotify", amount: 65, type: "EXPENSE" as const, date: new Date(now.getFullYear(), now.getMonth() - 2, 15), categoryId: leisureCat?.id || null, originId: nubank?.id || null },
  ];

  await prisma.transaction.createMany({ data });
  console.log(`Seed criado para usuário ${user.email} (${user.id}): ${data.length} transações`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
