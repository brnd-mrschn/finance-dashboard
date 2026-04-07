"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Finance() {
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

  // Dados para gráfico de linha (saldo ao longo do tempo)
  const balanceOverTime = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, t) => {
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
      const newBalance = lastBalance + (t.type === "INCOME" ? t.amount : -t.amount);
      acc.push({
        date: new Date(t.date).toLocaleDateString(),
        balance: newBalance
      });
      return acc;
    }, []);

  return (
    <motion.div 
      className="min-h-screen p-0 font-sans"
      style={{ color: 'var(--foreground)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-3xl font-bold mb-8 text-[var(--foreground)] tracking-tight"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Financeiro
      </motion.h1>

      {error && <p className="text-[#ed4245]">{error}</p>}

      <motion.div 
        className="bg-[var(--surface)] p-6 rounded-2xl mb-8 border border-[var(--surface-alt)]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Evolução do Saldo</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={balanceOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-alt)" />
            <XAxis dataKey="date" stroke="var(--foreground)" />
            <YAxis stroke="var(--foreground)" />
            <Tooltip contentStyle={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--surface-alt)' }} />
            <Line type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div 
        className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--surface-alt)]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Resumo Financeiro</h3>
        <p className="text-[var(--foreground)]">Aqui você pode adicionar mais detalhes financeiros, como projeções, metas, etc.</p>
      </motion.div>
    </motion.div>
  );
}