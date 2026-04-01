import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      id: "dev-user",
      email: "dev@test.com",
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: "dev-user",
        description: "Salário",
        amount: 5000,
        type: "INCOME",
        date: new Date(),
      },
      {
        userId: "dev-user",
        description: "Aluguel",
        amount: 1500,
        type: "EXPENSE",
        date: new Date(),
      },
      {
        userId: "dev-user",
        description: "Mercado",
        amount: 400,
        type: "EXPENSE",
        date: new Date(),
      },
    ],
  });
}

main();