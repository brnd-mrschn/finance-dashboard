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
      className="min-h-screen p-0 text-[#f2f3f5] font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-3xl font-bold mb-8 text-[#7289da] tracking-tight"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Financeiro
      </motion.h1>

      {error && <p className="text-[#ed4245]">{error}</p>}

      <motion.div 
        className="bg-[#23272a] p-6 rounded-2xl mb-8 border border-[#2c2f33]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Evolução do Saldo</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={balanceOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#40444b" />
            <XAxis dataKey="date" stroke="#b9bbbe" />
            <YAxis stroke="#b9bbbe" />
            <Tooltip />
            <Line type="monotone" dataKey="balance" stroke="#5865f2" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div 
        className="bg-[#23272a] p-6 rounded-2xl border border-[#2c2f33]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Resumo Financeiro</h3>
        <p className="text-[#b9bbbe]">Aqui você pode adicionar mais detalhes financeiros, como projeções, metas, etc.</p>
      </motion.div>
    </motion.div>
  );
}