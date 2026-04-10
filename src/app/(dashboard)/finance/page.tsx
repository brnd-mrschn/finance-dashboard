"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
// ApexCharts precisa ser importado dinamicamente para evitar SSR issues
const ApexLineChart = dynamic(() => import("react-apexcharts"), { ssr: false });

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
        className="bg-[var(--surface)] p-6 rounded-lg mb-8 border border-[var(--border)]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Evolução do Saldo</h3>
        <div style={{ width: "100%", height: 400 }}>
          <ApexLineChart
            type="line"
            height={400}
            width="100%"
            series={[{
              name: "Saldo",
              data: balanceOverTime.map((item: any) => item.balance)
            }]}
            options={{
              chart: {
                id: "saldo-evolucao",
                background: "transparent",
                toolbar: { show: false },
                zoom: { enabled: false },
              },
              theme: {
                mode: "dark"
              },
              xaxis: {
                categories: balanceOverTime.map((item: any) => item.date),
                labels: { style: { colors: "var(--foreground)" } },
              },
              yaxis: {
                labels: { style: { colors: "var(--foreground)" } },
              },
              stroke: {
                curve: "smooth",
                width: 3,
                colors: ["#3ecf8e"]
              },
              colors: ["#3ecf8e"],
              grid: {
                borderColor: "#2e2e2e",
                strokeDashArray: 4,
              },
              tooltip: {
                theme: "dark",
                style: { fontFamily: "inherit" },
              },
            }}
          />
        </div>
      </motion.div>

      <motion.div 
        className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)]"
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
