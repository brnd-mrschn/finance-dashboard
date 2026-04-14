"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
// Import dinâmico para evitar SSR issues
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { Card } from "@/app/components/ui/card";
import { DropdownFilter } from "@/app/components/ui/dropdown-filter";

const SPOTLIGHT_RADIUS = 250;

function SmoothScrollList({ children, className }: { children: React.ReactNode; className?: string }) {
  const wrapperRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let targetScroll = el.scrollTop;
    let currentScroll = el.scrollTop;
    let rafId: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const maxScroll = el.scrollHeight - el.clientHeight;
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY));
    };

    const animate = () => {
      currentScroll = lerp(currentScroll, targetScroll, 0.1);
      if (Math.abs(currentScroll - targetScroll) < 0.5) currentScroll = targetScroll;
      el.scrollTop = currentScroll;
      rafId = requestAnimationFrame(animate);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    rafId = requestAnimationFrame(animate);

    return () => {
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ul ref={wrapperRef} className={className} style={{ overflowY: "auto" }} data-lenis-prevent>
      {children}
    </ul>
  );
}

function SpotlightGrid({ children }: { children: React.ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateCards = useCallback((mx: number, my: number) => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>(".magic-card");
    const proximity = SPOTLIGHT_RADIUS * 0.5;
    const fadeDistance = SPOTLIGHT_RADIUS * 0.75;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.max(0, Math.hypot(mx - cx, my - cy) - Math.max(rect.width, rect.height) / 2);

      let intensity = 0;
      if (dist <= proximity) intensity = 1;
      else if (dist <= fadeDistance) intensity = (fadeDistance - dist) / (fadeDistance - proximity);

      const rx = ((mx - rect.left) / rect.width) * 100;
      const ry = ((my - rect.top) / rect.height) * 100;

      card.style.setProperty("--glow-x", `${rx}%`);
      card.style.setProperty("--glow-y", `${ry}%`);
      card.style.setProperty("--glow-intensity", intensity.toString());
    });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!gridRef.current) return;
        const section = gridRef.current.getBoundingClientRect();
        const inside =
          e.clientX >= section.left &&
          e.clientX <= section.right &&
          e.clientY >= section.top &&
          e.clientY <= section.bottom;

        if (!inside) {
          gridRef.current.querySelectorAll<HTMLElement>(".magic-card").forEach((c) =>
            c.style.setProperty("--glow-intensity", "0")
          );
          return;
        }
        updateCards(e.clientX, e.clientY);
      });
    };

    const onLeave = () => {
      gridRef.current?.querySelectorAll<HTMLElement>(".magic-card").forEach((c) =>
        c.style.setProperty("--glow-intensity", "0")
      );
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [updateCards]);

  return (
    <div ref={gridRef} className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
      {children}
    </div>
  );
}

type Transaction = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  originId?: string | null;
};

type Category = {
  id: string;
  name: string;
  expected?: number | null;
  color?: string | null;
};

type Origin = {
  id: string;
  name: string;
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
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

    fetch("/api/origins")
      .then((res) => res.json())
      .then((data: Origin[]) => setOrigins(data))
      .catch(console.error);
  }, []);

  const getCategoryName = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((category) => category.id === categoryId)?.color ?? null;
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

  const expenseByOrigin = origins
    .map((origin) => {
      const total = filteredTransactions
        .filter(
          (transaction) =>
            transaction.originId === origin.id && transaction.type === "EXPENSE"
        )
        .reduce((accumulator, transaction) => accumulator + transaction.amount, 0);
      return { name: origin.name, value: total };
    })
    .filter((item) => item.value > 0);

  const noOriginExpense = filteredTransactions
    .filter((t) => !t.originId && t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);
  if (noOriginExpense > 0) {
    expenseByOrigin.push({ name: "Sem origem", value: noOriginExpense });
  }

  const originColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];

  const monthlyData = filteredTransactions.reduce<
    Record<string, { month: string; income: number; expense: number }>
  >((accumulator, transaction) => {
    const d = new Date(transaction.date);
    const month = `${d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}/${d.getFullYear()}`;

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
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">


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
              options={[{ value: "", label: "Todos" }, ...uniqueMonths.map((month) => ({ value: String(month), label: new Date(2000, month - 1).toLocaleDateString("pt-BR", { month: "long" }).replace(/^./, (c) => c.toUpperCase()) }))]}
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
                  className="h-full min-w-0 flex-1 bg-transparent pr-7 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
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
        className="mb-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SpotlightGrid>
          <div
            className="magic-card rounded-lg"
            style={{
              "--glow-r": balance > 0 ? 62 : balance < 0 ? 237 : 234,
              "--glow-g": balance > 0 ? 207 : balance < 0 ? 66 : 179,
              "--glow-b": balance > 0 ? 142 : balance < 0 ? 69 : 8,
            } as React.CSSProperties}
          >
            <Card
              title="Saldo"
              value={balance.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              type={balance > 0 ? "success" : balance < 0 ? "danger" : "info"}
            />
          </div>

          <div
            className="magic-card rounded-lg"
            style={{
              "--glow-r": 62,
              "--glow-g": 207,
              "--glow-b": 142,
            } as React.CSSProperties}
          >
            <Card
              title="Receitas"
              value={income.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              type="success"
            />
          </div>

          <div
            className="magic-card rounded-lg"
            style={{
              "--glow-r": 237,
              "--glow-g": 66,
              "--glow-b": 69,
            } as React.CSSProperties}
          >
            <Card
              title="Despesas"
              value={expense.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              type="danger"
            />
          </div>
        </SpotlightGrid>
      </motion.div>

      {error && <p className="text-[#ed4245]">{error}</p>}

      <motion.div
        className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 h-[420px] grid grid-cols-2 gap-4">
          <div className="flex flex-col min-h-0">
            <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              Despesas por Categoria
            </h3>
            <div className="relative flex-1 w-full" style={{ minHeight: 0, minWidth: 0 }}>
              <ApexChart
                type="donut"
                width="100%"
                height="100%"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                series={expenseByCategory.map((item) => item.value)}
                options={{
                  labels: expenseByCategory.map((item) => item.name),
                  colors,
                  legend: { show: true, position: "bottom", labels: { colors: "var(--foreground)" }, fontSize: "11px" },
                  dataLabels: { enabled: false },
                  tooltip: { theme: "dark" },
                  chart: { background: "transparent" },
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: { size: '60%' },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
              Despesas por Origem
            </h3>
            <div className="relative flex-1 w-full" style={{ minHeight: 0, minWidth: 0 }}>
              <ApexChart
                type="donut"
                width="100%"
                height="100%"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                series={expenseByOrigin.map((item) => item.value)}
                options={{
                  labels: expenseByOrigin.map((item) => item.name),
                  colors: originColors,
                  legend: { show: true, position: "bottom", labels: { colors: "var(--foreground)" }, fontSize: "11px" },
                  dataLabels: { enabled: false },
                  tooltip: { theme: "dark" },
                  chart: { background: "transparent" },
                  stroke: { width: 0 },
                  plotOptions: {
                    pie: {
                      donut: { size: '60%' },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 h-[420px]">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
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
                  name: "Real",
                  data: categories
                    .filter((category) =>
                      filteredTransactions.some(
                        (t) => t.categoryId === category.id && t.type === "EXPENSE"
                      )
                    )
                    .map((category) => {
                      const real = filteredTransactions
                        .filter(
                          (t) => t.categoryId === category.id && t.type === "EXPENSE"
                        )
                        .reduce((acc, t) => acc + t.amount, 0);
                      const expected = category.expected ?? 0;
                      return {
                        x: category.name,
                        y: real,
                        goals: expected > 0
                          ? [
                              {
                                name: "Esperado",
                                value: expected,
                                strokeHeight: 5,
                                strokeColor: "#775DD0",
                              },
                            ]
                          : [],
                      };
                    }),
                },
              ]}
              options={{
                chart: { background: "transparent", toolbar: { show: false } },
                theme: { mode: "dark" },
                plotOptions: {
                  bar: {
                    columnWidth: "55%",
                    borderRadius: 6,
                  },
                },
                colors: ["#3ecf8e"],
                dataLabels: { enabled: false },
                xaxis: {
                  labels: {
                    style: { colors: "var(--foreground)", fontSize: "10px" },
                    rotate: -45,
                    trim: true,
                    hideOverlappingLabels: true,
                    maxHeight: 60,
                  },
                  tickPlacement: "on",
                },
                yaxis: { labels: { style: { colors: "var(--foreground)" } } },
                legend: {
                  show: true,
                  showForSingleSeries: true,
                  customLegendItems: ["Real", "Esperado"],
                  markers: { fillColors: ["#3ecf8e", "#775DD0"] },
                  labels: { colors: "var(--foreground)" },
                },
                grid: { borderColor: "#2e2e2e", strokeDashArray: 4 },
                tooltip: { theme: "dark" },
              }}
            />
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 h-[420px]">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
            Receitas vs Despesas Mensais
          </h3>
          <div className="flex-1 w-full overflow-hidden" style={{ minHeight: 0 }}>
            <ApexChart
              type="line"
              width="100%"
              height="100%"
              series={[
                {
                  name: "Receitas",
                  type: "column",
                  data: barData.map((item) => item.income),
                },
                {
                  name: "Despesas",
                  type: "column",
                  data: barData.map((item) => item.expense),
                },
                {
                  name: "Saldo",
                  type: "line",
                  data: barData.map((item) => item.income - item.expense),
                },
              ]}
              options={{
                chart: { background: "transparent", stacked: false, toolbar: { show: false } },
                theme: { mode: "dark" },
                stroke: { width: [1, 1, 3], curve: "smooth" },
                plotOptions: { bar: { borderRadius: 6, columnWidth: "40%" } },
                colors: ["#3ecf8e", "#ed4245", "#3b82f6"],
                dataLabels: { enabled: false },
                xaxis: {
                  categories: barData.map((item) => item.month),
                  labels: { style: { colors: "var(--foreground)" } },
                },
                yaxis: [
                  {
                    seriesName: "Receitas",
                    labels: { style: { colors: "var(--foreground)" } },
                  },
                  {
                    seriesName: "Receitas",
                    show: false,
                  },
                  {
                    seriesName: "Saldo",
                    opposite: true,
                    labels: { style: { colors: "var(--foreground)" } },
                  },
                ],
                legend: {
                  show: false,
                },
                grid: { borderColor: "#2e2e2e", strokeDashArray: 4 },
                tooltip: { theme: "dark" },
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-5 mt-1">
            {[
              { label: "Receitas", color: "#3ecf8e" },
              { label: "Despesas", color: "#ed4245" },
              { label: "Saldo", color: "#3b82f6" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-xs text-[var(--foreground)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[320px] h-[420px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
            Gastos por Categoria
          </h3>
          <SmoothScrollList className="flex-1 overflow-hidden space-y-1">
            {categories.map((category) => (
              <li key={category.id} className="flex justify-between text-[var(--foreground)]">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: category.color || 'var(--muted-foreground)' }} />
                  {category.name}
                </span>
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
          </SmoothScrollList>
        </div>
      </motion.div>

      {filteredTransactions.length === 0 ? (
        <p className="text-[var(--muted)]">Nenhuma transação encontrada</p>
      ) : (
        <div>
          <h2 className="mb-4 text-left text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Gastos recentes</h2>
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
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index, duration: 0.4, ease: "easeOut" }}
                  whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{transaction.description}</p>
                    <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")} ·{" "}
                      {getCategoryColor(transaction.categoryId) ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: getCategoryColor(transaction.categoryId) + '20', color: getCategoryColor(transaction.categoryId)!, border: `1px solid ${getCategoryColor(transaction.categoryId)}40` }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: getCategoryColor(transaction.categoryId)! }} />
                          {getCategoryName(transaction.categoryId)}
                        </span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">{getCategoryName(transaction.categoryId)}</span>
                      )}
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
