"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then(setTransactions);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="space-y-4">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="bg-zinc-900 p-4 rounded-lg flex justify-between"
          >
            <div>
              <p className="font-medium">{t.description}</p>
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
    </div>
  );
}