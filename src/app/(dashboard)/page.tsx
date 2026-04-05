"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then(setTransactions)
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar dados");
      });
  }, []);

  // 💰 cálculos
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* 🔥 👉 COLOCA AQUI 👇 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          title="Saldo"
          value={balance.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />

        <Card
          title="Receitas"
          value={income.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />

        <Card
          title="Despesas"
          value={expense.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
      </div>
      {/* 🔥 👆 AQUI */}

      {error && <p className="text-red-500">{error}</p>}

      {/* 📄 lista continua igual */}
      {transactions.length === 0 ? (
        <p className="text-zinc-400">Nenhuma transação encontrada</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-900 p-4 rounded-lg flex justify-between"
            >
              <div>
                <p>{t.description}</p>
                <p className="text-sm text-zinc-400">
                  {new Date(t.date).toLocaleDateString()}
                </p>
              </div>

              <p
                className={
                  t.type === "INCOME"
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                R$ {t.amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}