"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
// Import dinâmico para evitar SSR issues
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { Card } from "@/app/components/ui/card";

function ShineCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setPos({ x: -100, y: -100 }); }}
      className="relative overflow-hidden rounded-lg"
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.06) 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      />
    </div>
  );
}
import { DropdownFilter } from "@/app/components/ui/dropdown-filter";

type Transaction = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  expected?: number | null;
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Fecha a busca ao clicar fora se estiver vazia
  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        searchTerm.trim() === ""
      ) {
        setSearchOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen, searchTerm]);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data: Transaction[]) => setTransactions(data))
      .catch((fetchError) => {
        console.error(fetchError);
        setError("Erro ao carregar dados");
      });

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(console.error);
  }, []);

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";
  };

  const matchesSearch = (transaction: Transaction, rawTerm: string) => {
    const term = rawTerm.trim().toLowerCase();

    if (!term) {
      return false;
    }

    const description = transaction.description?.toLowerCase() ?? "";
    const category = getCategoryName(transaction.categoryId).toLowerCase();
    const formattedDate = new Date(transaction.date).toLocaleDateString("pt-BR");
    const isoDate = new Date(transaction.date).toISOString().slice(0, 10);
    const amount = transaction.amount.toString();
    const formattedAmount = transaction.amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return (
      description.includes(term) ||
      category.includes(term) ||
      formattedDate.includes(term) ||
      isoDate.includes(term) ||
      amount.includes(term) ||
      formattedAmount.toLowerCase().includes(term)
    );
  };

  const runSearch = (term: string) => {
    const normalizedTerm = term.trim();

    if (!normalizedTerm) {
      setSearchResults([]);
      setShowModal(false);
      return;
    }

    const results = transactions.filter((transaction) => matchesSearch(transaction, normalizedTerm));
    setSearchResults(results);
    setShowModal(true);
  };

  const uniqueYears = Array.from(
    new Set(transactions.map((transaction) => new Date(transaction.date).getFullYear()))
  );
  const uniqueMonths = Array.from(
    new Set(transactions.map((transaction) => new Date(transaction.date).getMonth() + 1))
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    const yearMatch = selectedYear ? date.getFullYear().toString() === selectedYear : true;
    const monthMatch = selectedMonth ? (date.getMonth() + 1).toString() === selectedMonth : true;
    const categoryMatch = selectedCategory ? transaction.categoryId === selectedCategory : true;

    return yearMatch && monthMatch && categoryMatch;
  });

  const liveSearchResults = searchTerm.trim()
    ? transactions.filter((transaction) => matchesSearch(transaction, searchTerm))
    : [];
  const suggestionResults = liveSearchResults.slice(0, 6);

  const income = filteredTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((accumulator, transaction) => accumulator + transaction.amount, 0);
  const expense = filteredTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((accumulator, transaction) => accumulator + transaction.amount, 0);
  const balance = income - expense;

  const expenseByCategory = categories
    .map((category) => {
      const total = filteredTransactions
        .filter(
          (transaction) =>
            transaction.categoryId === category.id && transaction.type === "EXPENSE"
        )
        .reduce((accumulator, transaction) => accumulator + transaction.amount, 0);

      return { name: category.name, value: total };
    })
    .filter((item) => item.value > 0);

  const monthlyData = filteredTransactions.reduce<
    Record<string, { month: string; income: number; expense: number }>
  >((accumulator, transaction) => {
    const month = new Date(transaction.date).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });

    if (!accumulator[month]) {
      accumulator[month] = { month, income: 0, expense: 0 };
    }

    if (transaction.type === "INCOME") {
      accumulator[month].income += transaction.amount;
    } else {
      accumulator[month].expense += transaction.amount;
    }

    return accumulator;
  }, {});

  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  const barData = Object.values(monthlyData);

  return (
    <motion.div
      className="min-h-screen p-0 font-sans text-[var(--foreground)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <motion.h1
          className="text-3xl font-bold tracking-tight text-[var(--foreground)]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Dashboard
        </motion.h1>


        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-end">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 shadow-sm h-14 min-h-[56px]">
            <DropdownFilter
              label="Ano"
              value={selectedYear}
              onChange={setSelectedYear}
              options={[{ value: "", label: "Todos" }, ...uniqueYears.map((year) => ({ value: String(year), label: String(year) }))]}
            />
            <DropdownFilter
              label="Mês"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={[{ value: "", label: "Todos" }, ...uniqueMonths.map((month) => ({ value: String(month), label: String(month).padStart(2, "0") }))]}
            />
            <DropdownFilter
              label="Categoria"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[{ value: "", label: "Todas" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
            />
          </div>

          <div
            ref={searchRef}
            className={`relative flex h-14 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-[width] duration-300 ${
              searchOpen ? "w-full lg:w-[23rem]" : "w-14"
            }`}
          >
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center text-[var(--foreground)]"
              onClick={() => {
                if (searchOpen) {
                  setSearchOpen(false);
                  setSearchTerm("");
                  return;
                }

                setSearchOpen(true);
              }}
              aria-label="Abrir busca"
            >
              <FiSearch className="text-xl" />
            </button>

            {searchOpen && (
              <>
                <input
                  autoFocus
                  type="text"
                  className="h-full w-full bg-transparent pr-12 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                  placeholder="Buscar por descrição, data, categoria ou valor"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchOpen(false);
                      setSearchTerm("");
                    }

                    if (event.key === "Enter") {
                      runSearch(searchTerm);
                    }
                  }}
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-alt)]"
                    onClick={() => setSearchTerm("")}
                    aria-label="Limpar busca"
                  >
                    <FiX className="text-base" />
                  </button>
                )}

                {searchTerm.trim() && (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between px-1 text-xs text-[var(--muted-foreground)] opacity-40">
                      <span>{liveSearchResults.length} resultado(s)</span>
                      <span>Enter abre todos</span>
                    </div>

                    {suggestionResults.length === 0 ? (
                      <p className="px-1 py-3 text-sm text-[var(--muted-foreground)]">
                        Nenhuma correspondência encontrada.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {suggestionResults.map((transaction) => (
                          <button
                            key={transaction.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-left transition-colors hover:bg-[var(--surface-alt)]"
                            onClick={() => runSearch(searchTerm)}
                          >
                            <div>
                              <p className="font-medium text-[var(--foreground)]">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {new Date(transaction.date).toLocaleDateString("pt-BR")} · {getCategoryName(transaction.categoryId)}
                              </p>
                            </div>
                            <span
                              className={
                                transaction.type === "INCOME"
                                  ? "font-bold text-[#43b581]"
                                  : "font-bold text-[#ed4245]"
                              }
                            >
                              {transaction.amount.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg md:p-8">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-alt)]"
              onClick={() => setShowModal(false)}
              aria-label="Fechar resultados"
            >
              <FiX className="text-2xl" />
            </button>

            <div className="mb-6 pr-12">
              <p className="text-sm text-[var(--muted-foreground)]">Busca independente dos filtros</p>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">Resultados da busca</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {searchResults.length} resultado(s) para "{searchTerm.trim()}"
              </p>
            </div>

            {searchResults.length === 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-8 text-center text-[var(--foreground)]">
                Nenhum resultado encontrado.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {transaction.description}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="mt-1 text-sm text-[var(--foreground)]">
                        Categoria: {getCategoryName(transaction.categoryId)}
                      </p>
                    </div>
                    <p
                      className={
                        transaction.type === "INCOME"
                          ? "text-lg font-bold text-[#43b581]"
                          : "text-lg font-bold text-[#ed4245]"
                      }
                    >
                      {transaction.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <motion.div
        className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ShineCard>
          <Card
            title="Saldo"
            value={balance.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            icon={<span role="img" aria-label="Saldo">💰</span>}
            type={balance >= 0 ? "success" : "danger"}
          />
        </ShineCard>

        <ShineCard>
          <Card
            title="Receitas"
            value={income.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            icon={<span role="img" aria-label="Receitas">🟢</span>}
            type="success"
          />
        </ShineCard>

        <ShineCard>
          <Card
            title="Despesas"
            value={expense.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            icon={<span role="img" aria-label="Despesas">🔴</span>}
            type="danger"
          />
        </ShineCard>
      </motion.div>

      {error && <p className="text-[#ed4245]">{error}</p>}

      <motion.div
        className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2"
        style={{ gridTemplateColumns: '1fr 1fr' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >

        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 h-[420px]">
          <h3 className="mb-4 text-center text-lg font-semibold text-[var(--foreground)]">
            Despesas por Categoria
          </h3>
          <div className="relative flex-1 w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
            <ApexChart
              type="donut"
              width="100%"
              height="100%"
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              series={expenseByCategory.map((item) => item.value)}
              options={{
                labels: expenseByCategory.map((item) => item.name),
                colors,
                legend: { show: true, labels: { colors: "var(--foreground)" } },
                dataLabels: { enabled: false },
                tooltip: { theme: "dark" },
                chart: { background: "transparent" },
                stroke: { width: 0 },
                plotOptions: {
                  pie: {
                    donut: { size: '65%' },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 h-[420px]">
          <h3 className="mb-4 text-center text-lg font-semibold text-[var(--foreground)]">
            Gastos Esperados vs Gastos Reais
          </h3>
          <div className="relative flex-1 w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
            <ApexChart
              type="bar"
              width="100%"
              height="100%"
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              series={[ 
                {
                  name: "Esperado",
                  data: categories.map((category) => category.expected ?? 0),
                },
                {
                  name: "Real",
                  data: categories.map((category) =>
                    filteredTransactions
                      .filter(
                        (transaction) =>
                          transaction.categoryId === category.id && transaction.type === "EXPENSE"
                      )
                      .reduce((accumulator, transaction) => accumulator + transaction.amount, 0)
                  ),
                },
              ]}
              options={{
                chart: { background: "transparent", stacked: false, toolbar: { show: false } },
                theme: { mode: "dark" },
                xaxis: {
                  categories: categories.map((category) => category.name),
                  labels: {
                    style: { colors: "var(--foreground)", fontSize: '10px' },
                    rotate: -45,
                    trim: true,
                    hideOverlappingLabels: true,
                    showDuplicates: false,
                    maxHeight: 60,
                  },
                  tickPlacement: 'on',
                },
                yaxis: { labels: { style: { colors: "var(--foreground)" } } },
                legend: { labels: { colors: "var(--foreground)" } },
                colors: ["#666666", "#ed4245"],
                grid: { borderColor: "#2e2e2e", strokeDashArray: 4 },
                tooltip: { theme: "dark" },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', barHeight: '80%' } },
              }}
            />
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 h-[420px]">
          <h3 className="mb-4 text-center text-lg font-semibold text-[var(--foreground)]">
            Receitas vs Despesas Mensais
          </h3>
          <div className="relative flex-1 w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
            <ApexChart
              type="bar"
              width="100%"
              height="100%"
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              series={[ 
                {
                  name: "Receitas",
                  data: barData.map((item) => item.income),
                },
                {
                  name: "Despesas",
                  data: barData.map((item) => item.expense),
                },
              ]}
              options={{
                chart: { background: "transparent", stacked: false, toolbar: { show: false } },
                theme: { mode: "dark" },
                xaxis: {
                  categories: barData.map((item) => item.month),
                  labels: { style: { colors: "var(--foreground)" } },
                },
                yaxis: { labels: { style: { colors: "var(--foreground)" } } },
                legend: { labels: { colors: "var(--foreground)" } },
                colors: ["#43b581", "#ed4245"],
                grid: { borderColor: "#2e2e2e", strokeDashArray: 4 },
                tooltip: { theme: "dark" },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '40%' } },
              }}
            />
          </div>
        </div>

        <div className="min-h-[320px] h-[420px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col">
          <h3 className="mb-4 text-center text-lg font-semibold text-[var(--foreground)]">
            Gastos por Categoria
          </h3>
          <ul className="flex-1 overflow-y-auto space-y-1">
            {categories.map((category) => (
              <li key={category.id} className="flex justify-between text-[var(--foreground)]">
                <span>{category.name}</span>
                <span className="pr-6">
                  {filteredTransactions
                    .filter(
                      (transaction) =>
                        transaction.categoryId === category.id && transaction.type === "EXPENSE"
                    )
                    .reduce((accumulator, transaction) => accumulator + transaction.amount, 0)
                    .toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {filteredTransactions.length === 0 ? (
        <p className="text-[var(--muted)]">Nenhuma transação encontrada</p>
      ) : (
        <div>
          <h2 className="mb-4 text-xl font-bold text-[var(--foreground)] text-left">Gastos recentes</h2>
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[...filteredTransactions]
              .filter((t) => t.type === "EXPENSE")
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-alt)]"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{transaction.description}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")} · {getCategoryName(transaction.categoryId)}
                    </p>
                  </div>

                  <p className="font-bold text-[#ed4245]">
                    {transaction.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </motion.div>
              ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
