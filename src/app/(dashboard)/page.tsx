"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then(setTransactions)
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar dados");
      });

    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // 💰 cálculos
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  // Dados para gráfico de pizza (despesas por categoria)
  const expenseByCategory = categories.map(cat => {
    const total = transactions
      .filter(t => t.categoryId === cat.id && t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Dados para gráfico de barras (receitas vs despesas por mês)
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
    if (t.type === "INCOME") acc[month].income += t.amount;
    else acc[month].expense += t.amount;
    return acc;
  }, {});
  const barData = Object.values(monthlyData);

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
        Dashboard
      </motion.h1>

      {/* 🔥 👉 COLOCA AQUI 👇 */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card
            title="Saldo"
            value={balance.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card
            title="Receitas"
            value={income.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card
            title="Despesas"
            value={expense.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          />
        </motion.div>
      </motion.div>
      {/* 🔥 👆 AQUI */}

      {error && <p className="text-[#ed4245]">{error}</p>}

      {/* Gráficos */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="bg-[#23272a] p-6 rounded-2xl border border-[#2c2f33]">
          <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#5865f2"
                dataKey="value"
                label={false}
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#23272a] p-6 rounded-2xl border border-[#2c2f33]">
          <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Receitas vs Despesas Mensais</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#40444b" />
              <XAxis dataKey="month" stroke="#b9bbbe" />
              <YAxis stroke="#b9bbbe" />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#43b581" name="Receitas" />
              <Bar dataKey="expense" fill="#ed4245" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 📄 lista continua igual */}
      {transactions.length === 0 ? (
        <p className="text-[#b9bbbe]">Nenhuma transação encontrada</p>
      ) : (
        <motion.div 
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {transactions.map((t, index) => (
            <motion.div
              key={t.id}
              className="bg-[#23272a] p-4 rounded-lg flex justify-between items-center border border-[#2c2f33] hover:bg-[#2c2f33] transition-colors"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.01 }}
            >
              <div>
                <p className="font-medium text-[#f2f3f5]">{t.description}</p>
                <p className="text-xs text-[#b9bbbe]">
                  {new Date(t.date).toLocaleDateString()}
                </p>
              </div>

              <p
                className={
                  t.type === "INCOME"
                    ? "text-[#43b581] font-bold"
                    : "text-[#ed4245] font-bold"
                }
              >
                R$ {t.amount}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}