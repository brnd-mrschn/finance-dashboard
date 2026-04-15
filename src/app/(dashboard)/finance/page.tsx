"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
// ApexCharts precisa ser importado dinamicamente para evitar SSR issues
const ApexAreaChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Transaction = {
  id: string;
  amount: number;
  date: string;
  type: "INCOME" | "EXPENSE";
};

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data: Transaction[]) => setTransactions(data))
      .catch((err) => {
        console.error(err);
        setError("Erro ao carregar dados");
      });
  }, []);

  // Dados para gráfico de área — timeseries irregular com 3 séries
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeIncome = 0;
  let cumulativeExpense = 0;
  let balance = 0;

  const incomeData: [number, number][] = [];
  const expenseData: [number, number][] = [];
  const balanceData: [number, number][] = [];

  sorted.forEach((t) => {
    const ts = new Date(t.date).getTime();
    if (t.type === "INCOME") {
      cumulativeIncome += t.amount;
      balance += t.amount;
      incomeData.push([ts, cumulativeIncome]);
    } else {
      cumulativeExpense += t.amount;
      balance -= t.amount;
      expenseData.push([ts, cumulativeExpense]);
    }
    balanceData.push([ts, balance]);
  });

  return (
    <motion.div 
      className="min-h-screen p-0 font-sans"
      style={{ color: 'var(--foreground)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {error && <p className="text-[#ed4245]">{error}</p>}

      <motion.div 
        className="bg-[var(--surface)] p-6 rounded-lg mb-8 border border-[var(--border)]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Evolução do Saldo</h3>
        <div style={{ width: "100%", height: 400 }}>
          <ApexAreaChart
            type="area"
            height={400}
            width="100%"
            series={[
              { name: "Receitas", data: incomeData },
              { name: "Despesas", data: expenseData },
              { name: "Saldo", data: balanceData },
            ]}
            options={{
              chart: {
                type: "area",
                stacked: false,
                height: 400,
                background: "transparent",
                toolbar: { show: false },
                zoom: { enabled: false },
              },
              theme: { mode: "dark" },
              colors: ["#3ecf8e", "#ed4245", "#666666"],
              dataLabels: { enabled: false },
              markers: { size: 0 },
              fill: {
                type: "gradient",
                gradient: {
                  shadeIntensity: 1,
                  inverseColors: false,
                  opacityFrom: 0.4,
                  opacityTo: 0.05,
                  stops: [20, 100, 100, 100],
                },
              },
              stroke: {
                curve: "smooth",
                width: 2,
              },
              xaxis: {
                type: "datetime",
                labels: {
                  style: { colors: "#888" },
                  datetimeUTC: false,
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              yaxis: {
                labels: {
                  style: { colors: "#888" },
                  formatter: (val: number) =>
                    val.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                    }),
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
              },
              grid: {
                borderColor: "#2e2e2e",
                strokeDashArray: 4,
              },
              tooltip: {
                shared: true,
                theme: "dark",
                x: {
                  format: "dd MMM yyyy",
                },
                y: {
                  formatter: (val: number) =>
                    val.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }),
                },
              },
              legend: {
                position: "top",
                horizontalAlign: "right",
                labels: { colors: "#888" },
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
