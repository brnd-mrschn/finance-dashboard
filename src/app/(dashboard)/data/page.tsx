"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FiTrash2, FiPlus, FiChevronUp, FiChevronDown, FiUpload } from "react-icons/fi";
import { parseFile, parseCategoryCSV, readFileAsText, type ParsedTransaction, type ParsedCategory } from "@/lib/import-parser";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/lib/profile-context";
import { DataSkeleton } from "@/app/components/ui/skeleton";
import { useResizableColumns, type ColumnDef } from "@/lib/useResizableColumns";

type TransactionType = "INCOME" | "EXPENSE";

type Transaction = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  originId: string | null;
};

type Category = {
  id: string;
  name: string;
  group: string;
  subgroup: string;
  type: TransactionType;
  expected: number | null;
  color?: string | null;
};

type Origin = {
  id: string;
  name: string;
};

type TransactionForm = {
  description: string;
  date: string;
  amount: string;
  type: TransactionType;
  categoryId: string;
  originId: string;
};

type CategoryForm = {
  name: string;
  group: string;
  subgroup: string;
  type: TransactionType;
  expected: string;
};

type ViewMode = "transactions" | "categories" | "origins";
type SortDirection = "asc" | "desc";
type TransactionSortField = "description" | "date" | "amount" | "type" | "categoryId" | "originId";
type CategorySortField = "name" | "group" | "subgroup" | "type" | "expected";

// ── Definições de colunas (fora do componente para estabilidade de referência) ──
const TX_COLS: ColumnDef[] = [
  { key: "description", label: "Descrição",  defaultWidth: 260, minWidth: 80  },
  { key: "date",        label: "Data",        defaultWidth: 120, minWidth: 70  },
  { key: "amount",      label: "Valor",       defaultWidth: 130, minWidth: 70  },
  { key: "type",        label: "Tipo",        defaultWidth: 100, minWidth: 60  },
  { key: "categoryId",  label: "Categoria",   defaultWidth: 160, minWidth: 80  },
  { key: "originId",    label: "Origem",      defaultWidth: 140, minWidth: 70  },
];

const CAT_COLS: ColumnDef[] = [
  { key: "name",      label: "Nome",     defaultWidth: 220, minWidth: 80  },
  { key: "group",     label: "Grupo",    defaultWidth: 180, minWidth: 70  },
  { key: "subgroup",  label: "Subgrupo", defaultWidth: 180, minWidth: 70  },
  { key: "type",      label: "Tipo",     defaultWidth: 120, minWidth: 60  },
  { key: "expected",  label: "Esperado", defaultWidth: 150, minWidth: 70  },
];

const ORIGIN_COLS: ColumnDef[] = [
  { key: "name",     label: "Nome",        defaultWidth: 340, minWidth: 100 },
  { key: "txCount",  label: "Transações",  defaultWidth: 180, minWidth: 80  },
];

function SortIcon({
  field,
  current,
  dir,
}: {
  field: string;
  current: string;
  dir: SortDirection;
}) {
  return (
    <span className="inline-flex ml-1 opacity-60">
      {current === field ? (
        dir === "asc" ? (
          <FiChevronUp size={12} />
        ) : (
          <FiChevronDown size={12} />
        )
      ) : (
        <FiChevronDown size={10} className="opacity-30" />
      )}
    </span>
  );
}

export default function DataPage() {
  const { activeProfile, loading: profileLoading } = useProfile();

  // Helper: fetch com header x-profile-id injetado automaticamente
  const pfetch = useCallback(
    (url: string, init?: RequestInit) => {
      const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string> | undefined),
        ...(activeProfile ? { "x-profile-id": activeProfile.id } : {}),
      };
      return fetch(url, { ...init, headers });
    },
    [activeProfile]
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [error, setError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingOrigin, setEditingOrigin] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [newTransaction, setNewTransaction] = useState<TransactionForm | null>(null);
  const [newCategory, setNewCategory] = useState<CategoryForm | null>(null);
  const [newOriginName, setNewOriginName] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("transactions");
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [sortField, setSortField] = useState<TransactionSortField>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [catSortField, setCatSortField] = useState<CategorySortField>("name");
  const [catSortDir, setCatSortDir] = useState<SortDirection>("asc");
  const [originSortDir, setOriginSortDir] = useState<SortDirection>("asc");
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState<ParsedTransaction[]>([]);
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importOriginId, setImportOriginId] = useState('');
  const [catImportModal, setCatImportModal] = useState(false);
  const [catImportData, setCatImportData] = useState<ParsedCategory[]>([]);
  const [catImportSelected, setCatImportSelected] = useState<Set<number>>(new Set());
  const [catImporting, setCatImporting] = useState(false);
  const [catImportFileName, setCatImportFileName] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedOrigins, setSelectedOrigins] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);
  const checkboxClassName = "h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-alt)_48%,transparent)] opacity-75 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:opacity-100 hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--primary)_35%,transparent)] checked:border-[var(--primary)] checked:bg-[var(--primary)] checked:opacity-100";

  // ── Colunas redimensionáveis / reordenáveis ──────────────────────────────────
  const txCols  = useResizableColumns("data-cols-tx",     TX_COLS);
  const catCols = useResizableColumns("data-cols-cat",    CAT_COLS);
  const oriCols = useResizableColumns("data-cols-origin", ORIGIN_COLS);

  const showToast = (msg: string, duration = 1800) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), duration);
  };

  const updateNewTransaction = <K extends keyof TransactionForm>(field: K, value: TransactionForm[K]) => {
    setNewTransaction((current) => (current ? { ...current, [field]: value } : current));
  };
  const updateNewCategory = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => {
    setNewCategory((current) => (current ? { ...current, [field]: value } : current));
  };
  const toggleSort = (field: TransactionSortField) => {
    if (sortField === field) setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };
  const toggleCatSort = (field: CategorySortField) => {
    if (catSortField === field) setCatSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    else { setCatSortField(field); setCatSortDir("asc"); }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'description': return dir * a.description.localeCompare(b.description);
      case 'date': return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'amount': return dir * (a.amount - b.amount);
      case 'type': return dir * a.type.localeCompare(b.type);
      case 'categoryId': {
        const categoryA = categories.find((category) => category.id === a.categoryId)?.name || "";
        const categoryB = categories.find((category) => category.id === b.categoryId)?.name || "";
        return dir * categoryA.localeCompare(categoryB);
      }
      case 'originId': {
        const originA = origins.find((origin) => origin.id === a.originId)?.name || "";
        const originB = origins.find((origin) => origin.id === b.originId)?.name || "";
        return dir * originA.localeCompare(originB);
      }
      default: return 0;
    }
  });

  const sortedCategories = [...categories].sort((a, b) => {
    const dir = catSortDir === 'asc' ? 1 : -1;
    switch (catSortField) {
      case 'name': return dir * a.name.localeCompare(b.name);
      case 'group': return dir * (a.group || '').localeCompare(b.group || '');
      case 'subgroup': return dir * (a.subgroup || '').localeCompare(b.subgroup || '');
      case 'type': return dir * a.type.localeCompare(b.type);
      case 'expected': return dir * ((a.expected || 0) - (b.expected || 0));
      default: return 0;
    }
  });

  const sortedOrigins = [...origins].sort((a, b) => {
    const dir = originSortDir === 'asc' ? 1 : -1;
    return dir * a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (!activeProfile) return;
    pfetch("/api/transactions")
      .then((res) => res.json())
      .then((data: Transaction[]) => setTransactions(data))
      .catch(() => setError("Erro ao carregar transações"));
    pfetch("/api/categories")
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setError("Erro ao carregar categorias"));
    pfetch("/api/origins")
      .then((res) => res.json())
      .then((data: Origin[]) => setOrigins(data))
      .catch(() => setError("Erro ao carregar origens"));
  }, [activeProfile, pfetch]);

  if (profileLoading || !activeProfile) return <DataSkeleton />;

  return (
    <motion.div
      className="min-h-screen p-0 font-sans"
      style={{ color: 'var(--foreground)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          <button
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'transactions' ? 'bg-[var(--surface-alt)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)]'}`}
            onClick={() => setView('transactions')}
          >Transações</button>
          <button
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'categories' ? 'bg-[var(--surface-alt)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)]'}`}
            onClick={() => setView('categories')}
          >Categorias</button>
          <button
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'origins' ? 'bg-[var(--surface-alt)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)]'}`}
            onClick={() => setView('origins')}
          >Origens</button>
        </div>
        {view === 'transactions' && (
          <div className="flex gap-2 items-center">
            {selectedTransactions.size > 0 && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#ed4245] text-white border border-[#ed4245] hover:bg-[#d63638] shadow-[0_0_0_0_rgba(237,66,69,0)] hover:shadow-[0_0_8px_0_rgba(237,66,69,0.25)]"
                onClick={() => {
                  setConfirmModal({
                    message: `Tem certeza que deseja remover ${selectedTransactions.size} transação(ões)?`,
                    onConfirm: async () => {
                      setConfirmModal(null);
                      setSaving(true);
                      const ids = Array.from(selectedTransactions);
                      await pfetch('/api/transactions/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids }),
                      });
                      setTransactions((prev) => prev.filter((tr) => !selectedTransactions.has(tr.id)));
                      setSelectedTransactions(new Set());
                      setSaving(false);
                      showToast(`${ids.length} transação(ões) removida(s)!`);
                    },
                  });
                }}
              >
                <FiTrash2 size={12} /> Excluir {selectedTransactions.size}
              </button>
            )}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
              onClick={() => { setImportModal(true); setImportData([]); setImportSelected(new Set()); setImportFileName(''); setImportOriginId(''); }}
            >
              <FiUpload className="text-sm" /> Importar
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
              onClick={() => setNewTransaction({ description: "", date: new Date().toISOString().slice(0, 10), amount: "", type: "EXPENSE", categoryId: "", originId: "" })}
            >
              <FiPlus className="text-sm" /> Nova Transação
            </button>
          </div>
        )}
        {view === 'categories' && (
          <div className="flex gap-2 items-center">
            {selectedCategories.size > 0 && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#ed4245] text-white border border-[#ed4245] hover:bg-[#d63638] shadow-[0_0_0_0_rgba(237,66,69,0)] hover:shadow-[0_0_8px_0_rgba(237,66,69,0.25)]"
                onClick={() => {
                  setConfirmModal({
                    message: `Tem certeza que deseja remover ${selectedCategories.size} categoria(s)?`,
                    onConfirm: async () => {
                      setConfirmModal(null);
                      setSaving(true);
                      const ids = Array.from(selectedCategories);
                      await pfetch('/api/categories/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids }),
                      });
                      setCategories((prev) => prev.filter((cat) => !selectedCategories.has(cat.id)));
                      setSelectedCategories(new Set());
                      setSaving(false);
                      showToast(`${ids.length} categoria(s) removida(s)!`);
                    },
                  });
                }}
              >
                <FiTrash2 size={12} /> Excluir {selectedCategories.size}
              </button>
            )}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
              onClick={() => { setCatImportModal(true); setCatImportData([]); setCatImportSelected(new Set()); setCatImportFileName(''); }}
            >
              <FiUpload className="text-sm" /> Importar
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
              onClick={() => setNewCategory({ name: "", group: "", subgroup: "", type: "EXPENSE", expected: "" })}
            >
              <FiPlus className="text-sm" /> Nova Categoria
            </button>
          </div>
        )}
        {view === 'origins' && (
          <div className="flex gap-2 items-center">
            {selectedOrigins.size > 0 && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#ed4245] text-white border border-[#ed4245] hover:bg-[#d63638] shadow-[0_0_0_0_rgba(237,66,69,0)] hover:shadow-[0_0_8px_0_rgba(237,66,69,0.25)]"
                onClick={() => {
                  setConfirmModal({
                    message: `Tem certeza que deseja remover ${selectedOrigins.size} origem(ns)?`,
                    onConfirm: async () => {
                      setConfirmModal(null);
                      setSaving(true);
                      const ids = Array.from(selectedOrigins);
                      await Promise.all(
                        ids.map((id) =>
                          pfetch(`/api/origins/${id}`, { method: 'DELETE' })
                        )
                      );
                      setOrigins((prev) => prev.filter((o) => !selectedOrigins.has(o.id)));
                      setSelectedOrigins(new Set());
                      setSaving(false);
                      showToast(`${ids.length} origem(ns) removida(s)!`);
                    },
                  });
                }}
              >
                <FiTrash2 size={12} /> Excluir {selectedOrigins.size}
              </button>
            )}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
              onClick={() => setNewOriginName("")}
            >
              <FiPlus className="text-sm" /> Nova Origem
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-[#ed4245]">{error}</p>}
      <div>
        {view === 'transactions' && (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  {txCols.orderedColumns.map((col) => (
                    <col key={col.key} style={{ width: col.width }} />
                  ))}
                  <col style={{ width: 52 }} />
                </colgroup>
                <thead>
                  <tr className="border-y border-[var(--border)]">
                    {txCols.orderedColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors relative group"
                        style={{ width: col.width, overflow: "hidden" }}
                        onClick={() => toggleSort(col.key as TransactionSortField)}
                        draggable
                        onDragStart={(e) => txCols.onDragStart(col.key, e)}
                        onDragOver={txCols.onDragOver}
                        onDrop={(e) => txCols.onDrop(col.key, e)}
                        onDragEnd={txCols.onDragEnd}
                      >
                        <span className="flex items-center gap-0.5 truncate pr-3">
                          {col.label}
                          <SortIcon field={col.key} current={sortField} dir={sortDir} />
                        </span>
                        {/* Resize handle */}
                        <div
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:opacity-100 flex items-center justify-center z-10"
                          onMouseDown={(e) => { e.stopPropagation(); txCols.startResize(col.key, e); }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-px h-4 bg-[var(--border)]" />
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 text-center" style={{ width: 52 }}>
                      <input
                        type="checkbox"
                        className={checkboxClassName}
                        checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                        onChange={() => {
                          if (selectedTransactions.size === transactions.length) setSelectedTransactions(new Set());
                          else setSelectedTransactions(new Set(transactions.map((t) => t.id)));
                        }}
                        aria-label="Selecionar todas as transações"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newTransaction && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      {txCols.orderedColumns.map((col) => (
                        <td key={col.key} className="px-3 py-1.5">
                          {col.key === 'description' && (
                            <input className="edit-field" value={newTransaction.description} onChange={(e) => updateNewTransaction("description", e.target.value)} placeholder="Descrição" autoFocus />
                          )}
                          {col.key === 'date' && (
                            <input type="date" className="edit-field" value={newTransaction.date} onChange={(e) => updateNewTransaction("date", e.target.value)} />
                          )}
                          {col.key === 'amount' && (
                            <input type="number" className="edit-field" value={newTransaction.amount} onChange={(e) => updateNewTransaction("amount", e.target.value)} placeholder="Valor" />
                          )}
                          {col.key === 'type' && (
                            <select className="edit-field" value={newTransaction.type} onChange={(e) => updateNewTransaction("type", e.target.value as TransactionType)}>
                              <option value="INCOME">Receita</option>
                              <option value="EXPENSE">Despesa</option>
                            </select>
                          )}
                          {col.key === 'categoryId' && (
                            <select className="edit-field" value={newTransaction.categoryId} onChange={(e) => updateNewTransaction("categoryId", e.target.value)}>
                              <option value="">Sem categoria</option>
                              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          )}
                          {col.key === 'originId' && (
                            <select className="edit-field" value={newTransaction.originId} onChange={(e) => updateNewTransaction("originId", e.target.value)}>
                              <option value="">Sem origem</option>
                              {origins.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] mr-2"
                          onClick={async () => {
                            if (!newTransaction.description.trim()) { showToast('Preencha a descrição'); return; }
                            if (!newTransaction.date) { showToast('Preencha a data'); return; }
                            if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) { showToast('Preencha um valor maior que zero'); return; }
                            setSaving(true);
                            const res = await pfetch("/api/transactions", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ...newTransaction, amount: parseFloat(newTransaction.amount) }),
                            });
                            if (!res.ok) { setSaving(false); showToast('Erro ao criar transação'); return; }
                            const created = await res.json();
                            setTransactions((prev) => [created, ...prev]);
                            setNewTransaction(null);
                            setSaving(false);
                            showToast('Transação criada!');
                          }}
                          title="Salvar"
                        >Salvar</button>
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
                          onClick={() => setNewTransaction(null)}
                          title="Cancelar"
                        >Cancelar</button>
                      </td>
                    </tr>
                  )}
                  {sortedTransactions.map((t) => (
                    <tr key={t.id} style={{ height: 40 }} className={`border-b border-[var(--border)] transition-colors duration-200 ${selectedTransactions.has(t.id) ? 'bg-[var(--surface-alt)]' : editingTransaction === t.id ? 'bg-[var(--surface-alt)]' : 'hover:bg-[var(--surface-alt)]'}`}>
                      {txCols.orderedColumns.map((col) => (
                        <td key={col.key} className="px-3 py-1.5" style={{ overflow: 'hidden' }}>
                          {col.key === 'description' && (
                            editingTransaction === t.id && editingField === 'description' ? (
                              <input className="edit-field" defaultValue={t.description} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === t.description) { setEditingTransaction(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/transactions/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, description: v }) }); setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, description: v } : tr)); setEditingTransaction(null); setEditingField(null); setSaving(false); showToast('Transação atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <div onClick={() => { setEditingTransaction(t.id); setEditingField('description'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center truncate">{t.description}</div>
                            )
                          )}
                          {col.key === 'date' && (
                            editingTransaction === t.id && editingField === 'date' ? (
                              <input type="date" className="edit-field" defaultValue={t.date.slice(0, 10)} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === t.date.slice(0, 10)) { setEditingTransaction(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/transactions/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, date: v }) }); setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, date: v } : tr)); setEditingTransaction(null); setEditingField(null); setSaving(false); showToast('Transação atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <div onClick={() => { setEditingTransaction(t.id); setEditingField('date'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{new Date(t.date.slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                            )
                          )}
                          {col.key === 'amount' && (
                            editingTransaction === t.id && editingField === 'amount' ? (
                              <input type="number" className="edit-field" defaultValue={t.amount} autoFocus
                                onBlur={async (e) => { const v = parseFloat(e.target.value); if (v === t.amount) { setEditingTransaction(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/transactions/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, amount: v }) }); setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, amount: v } : tr)); setEditingTransaction(null); setEditingField(null); setSaving(false); showToast('Transação atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <div onClick={() => { setEditingTransaction(t.id); setEditingField('amount'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                            )
                          )}
                          {col.key === 'type' && (
                            editingTransaction === t.id && editingField === 'type' ? (
                              <select className="edit-field" defaultValue={t.type} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === t.type) { setEditingTransaction(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/transactions/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, type: v }) }); setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, type: v as TransactionType } : tr)); setEditingTransaction(null); setEditingField(null); setSaving(false); showToast('Transação atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLSelectElement).blur(); }}>
                                <option value="INCOME">Receita</option>
                                <option value="EXPENSE">Despesa</option>
                              </select>
                            ) : (
                              <div onClick={() => { setEditingTransaction(t.id); setEditingField('type'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{t.type === "INCOME" ? "Receita" : "Despesa"}</div>
                            )
                          )}
                          {col.key === 'categoryId' && (
                            editingTransaction === t.id && editingField === 'categoryId' ? (
                              <select className="edit-field" defaultValue={t.categoryId || ""} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === (t.categoryId || "")) { setEditingTransaction(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/transactions/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, categoryId: v }) }); setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, categoryId: v } : tr)); setEditingTransaction(null); setEditingField(null); setSaving(false); showToast('Transação atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLSelectElement).blur(); }}>
                                <option value="">Sem categoria</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            ) : (
                              <div onClick={() => { setEditingTransaction(t.id); setEditingField('categoryId'); }} className="cursor-pointer w-full min-h-[24px] flex items-center">
                                {(() => { const cat = categories.find((c) => c.id === t.categoryId); if (!cat) return <span className="italic text-gray-400">Sem categoria</span>; const color = cat.color || "#888"; return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium truncate" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>{cat.name}</span>; })()}
                              </div>
                            )
                          )}
                          {col.key === 'originId' && (
                            editingTransaction === t.id && editingField === 'originId' ? (
                              <select className="edit-field" defaultValue={t.originId || ""} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === (t.originId || "")) { setEditingTransaction(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/transactions/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, originId: v || null }) }); setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, originId: v || null } : tr)); setEditingTransaction(null); setEditingField(null); setSaving(false); showToast('Transação atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLSelectElement).blur(); }}>
                                <option value="">Sem origem</option>
                                {origins.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                              </select>
                            ) : (
                              <div onClick={() => { setEditingTransaction(t.id); setEditingField('originId'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">
                                {origins.find((o) => o.id === t.originId)?.name || <span className="italic text-gray-400">-</span>}
                              </div>
                            )
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          className={checkboxClassName}
                          checked={selectedTransactions.has(t.id)}
                          onChange={() => {
                            const next = new Set(selectedTransactions);
                            if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                            setSelectedTransactions(next);
                          }}
                          aria-label={`Selecionar transacao ${t.description}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {view === 'categories' && (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  {catCols.orderedColumns.map((col) => (
                    <col key={col.key} style={{ width: col.width }} />
                  ))}
                  <col style={{ width: 52 }} />
                </colgroup>
                <thead>
                  <tr className="border-y border-[var(--border)]">
                    {catCols.orderedColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors relative group"
                        style={{ width: col.width, overflow: "hidden" }}
                        onClick={() => toggleCatSort(col.key as CategorySortField)}
                        draggable
                        onDragStart={(e) => catCols.onDragStart(col.key, e)}
                        onDragOver={catCols.onDragOver}
                        onDrop={(e) => catCols.onDrop(col.key, e)}
                        onDragEnd={catCols.onDragEnd}
                      >
                        <span className="flex items-center gap-0.5 truncate pr-3">
                          {col.label}
                          <SortIcon field={col.key} current={catSortField} dir={catSortDir} />
                        </span>
                        <div
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:opacity-100 flex items-center justify-center z-10"
                          onMouseDown={(e) => { e.stopPropagation(); catCols.startResize(col.key, e); }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-px h-4 bg-[var(--border)]" />
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 text-center" style={{ width: 52 }}>
                      <input
                        type="checkbox"
                        className={checkboxClassName}
                        checked={categories.length > 0 && selectedCategories.size === categories.length}
                        onChange={() => {
                          if (selectedCategories.size === categories.length) setSelectedCategories(new Set());
                          else setSelectedCategories(new Set(categories.map((c) => c.id)));
                        }}
                        aria-label="Selecionar todas as categorias"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newCategory && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      {catCols.orderedColumns.map((col) => (
                        <td key={col.key} className="px-3 py-1.5">
                          {col.key === 'name' && <input className="edit-field" value={newCategory.name} onChange={(e) => updateNewCategory("name", e.target.value)} placeholder="Nome" autoFocus />}
                          {col.key === 'group' && <input className="edit-field" value={newCategory.group} onChange={(e) => updateNewCategory("group", e.target.value)} placeholder="Grupo" />}
                          {col.key === 'subgroup' && <input className="edit-field" value={newCategory.subgroup} onChange={(e) => updateNewCategory("subgroup", e.target.value)} placeholder="Subgrupo" />}
                          {col.key === 'type' && (
                            <select className="edit-field" value={newCategory.type} onChange={(e) => updateNewCategory("type", e.target.value as TransactionType)}>
                              <option value="EXPENSE">Despesa</option>
                              <option value="INCOME">Receita</option>
                            </select>
                          )}
                          {col.key === 'expected' && <input type="number" className="edit-field" value={newCategory.expected} onChange={(e) => updateNewCategory("expected", e.target.value)} placeholder="Valor esperado" />}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] mr-2"
                          onClick={async () => {
                            if (!newCategory.name.trim()) { showToast('Preencha o nome'); return; }
                            if (!newCategory.group.trim()) { showToast('Preencha o grupo'); return; }
                            if (!newCategory.subgroup.trim()) { showToast('Preencha o subgrupo'); return; }
                            setSaving(true);
                            const res = await pfetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCategory) });
                            if (!res.ok) { setSaving(false); showToast('Erro ao criar categoria'); return; }
                            const created = await res.json();
                            setCategories((prev) => [created, ...prev]);
                            setNewCategory(null);
                            setSaving(false);
                            showToast('Categoria criada!');
                          }}
                          title="Salvar"
                        >Salvar</button>
                        <button className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]" onClick={() => setNewCategory(null)} title="Cancelar">Cancelar</button>
                      </td>
                    </tr>
                  )}
                  {sortedCategories.map((c) => (
                    <tr key={c.id} style={{ height: 40 }} className={`border-b border-[var(--border)] transition-colors duration-200 ${selectedCategories.has(c.id) ? 'bg-[var(--surface-alt)]' : editingCategory === c.id ? 'bg-[var(--surface-alt)]' : 'hover:bg-[var(--surface-alt)]'}`}>
                      {catCols.orderedColumns.map((col) => (
                        <td key={col.key} className="px-3 py-1.5" style={{ overflow: 'hidden' }}>
                          {col.key === 'name' && (
                            editingCategory === c.id && editingField === 'name' ? (
                              <input className="edit-field" defaultValue={c.name} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === c.name) { setEditingCategory(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, name: v }) }); setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, name: v } : cat)); setEditingCategory(null); setEditingField(null); setSaving(false); showToast('Categoria atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <span onClick={() => { setEditingCategory(c.id); setEditingField('name'); }} className="cursor-pointer hover:underline flex items-center gap-2">
                                <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color || 'var(--muted-foreground)' }} />
                                {c.name}
                              </span>
                            )
                          )}
                          {col.key === 'group' && (
                            editingCategory === c.id && editingField === 'group' ? (
                              <input className="edit-field" defaultValue={c.group} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === c.group) { setEditingCategory(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, group: v }) }); setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, group: v } : cat)); setEditingCategory(null); setEditingField(null); setSaving(false); showToast('Categoria atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <span onClick={() => { setEditingCategory(c.id); setEditingField('group'); }} className="cursor-pointer hover:underline">{c.group}</span>
                            )
                          )}
                          {col.key === 'subgroup' && (
                            editingCategory === c.id && editingField === 'subgroup' ? (
                              <input className="edit-field" defaultValue={c.subgroup} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === c.subgroup) { setEditingCategory(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, subgroup: v }) }); setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, subgroup: v } : cat)); setEditingCategory(null); setEditingField(null); setSaving(false); showToast('Categoria atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <span onClick={() => { setEditingCategory(c.id); setEditingField('subgroup'); }} className="cursor-pointer hover:underline">{c.subgroup}</span>
                            )
                          )}
                          {col.key === 'type' && (
                            editingCategory === c.id && editingField === 'type' ? (
                              <select className="edit-field" defaultValue={c.type} autoFocus
                                onBlur={async (e) => { const v = e.target.value; if (v === c.type) { setEditingCategory(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, type: v }) }); setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, type: v === "INCOME" ? "INCOME" : "EXPENSE" } : cat)); setEditingCategory(null); setEditingField(null); setSaving(false); showToast('Categoria atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLSelectElement).blur(); }}>
                                <option value="EXPENSE">Despesa</option>
                                <option value="INCOME">Receita</option>
                              </select>
                            ) : (
                              <span onClick={() => { setEditingCategory(c.id); setEditingField('type'); }} className="cursor-pointer hover:underline">{c.type === "INCOME" ? "Receita" : "Despesa"}</span>
                            )
                          )}
                          {col.key === 'expected' && (
                            editingCategory === c.id && editingField === 'expected' ? (
                              <input type="number" className="edit-field" defaultValue={c.expected ?? ""} autoFocus
                                onBlur={async (e) => { const v = e.target.value ? parseFloat(e.target.value) : null; if (v === (c.expected ?? null)) { setEditingCategory(null); setEditingField(null); return; } setSaving(true); await pfetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, expected: v }) }); setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, expected: v } : cat)); setEditingCategory(null); setEditingField(null); setSaving(false); showToast('Categoria atualizada!'); }}
                                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                            ) : (
                              <span onClick={() => { setEditingCategory(c.id); setEditingField('expected'); }} className="cursor-pointer hover:underline">
                                {c.expected?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || <span className="italic text-gray-400">-</span>}
                              </span>
                            )
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-center">
                        <input type="checkbox" className={checkboxClassName} checked={selectedCategories.has(c.id)}
                          onChange={() => { const next = new Set(selectedCategories); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); setSelectedCategories(next); }}
                          aria-label={`Selecionar categoria ${c.name}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {view === 'origins' && (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  {oriCols.orderedColumns.map((col) => (
                    <col key={col.key} style={{ width: col.width }} />
                  ))}
                  <col style={{ width: 52 }} />
                </colgroup>
                <thead>
                  <tr className="border-y border-[var(--border)]">
                    {oriCols.orderedColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors relative group"
                        style={{ width: col.width, overflow: "hidden" }}
                        onClick={() => { if (col.key === 'name') setOriginSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }}
                        draggable
                        onDragStart={(e) => oriCols.onDragStart(col.key, e)}
                        onDragOver={oriCols.onDragOver}
                        onDrop={(e) => oriCols.onDrop(col.key, e)}
                        onDragEnd={oriCols.onDragEnd}
                      >
                        <span className="flex items-center gap-0.5 truncate pr-3">
                          {col.label}
                          {col.key === 'name' && (
                            <span className="inline-flex ml-1 opacity-60">
                              {originSortDir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                            </span>
                          )}
                        </span>
                        <div
                          className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:opacity-100 flex items-center justify-center z-10"
                          onMouseDown={(e) => { e.stopPropagation(); oriCols.startResize(col.key, e); }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-px h-4 bg-[var(--border)]" />
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 text-center" style={{ width: 52 }}>
                      <input
                        type="checkbox"
                        className={checkboxClassName}
                        checked={origins.length > 0 && selectedOrigins.size === origins.length}
                        onChange={() => {
                          if (selectedOrigins.size === origins.length) setSelectedOrigins(new Set());
                          else setSelectedOrigins(new Set(origins.map((o) => o.id)));
                        }}
                        aria-label="Selecionar todas as origens"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newOriginName !== null && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      {oriCols.orderedColumns.map((col) => (
                        <td key={col.key} className="px-3 py-1.5">
                          {col.key === 'name' && (
                            <input
                              className="edit-field"
                              value={newOriginName}
                              onChange={(e) => setNewOriginName(e.target.value)}
                              placeholder="Nome da origem"
                              autoFocus
                              onKeyDown={async (e) => {
                                if (e.key === "Enter") {
                                  const name = newOriginName.trim();
                                  if (!name) { showToast('Preencha o nome'); return; }
                                  setSaving(true);
                                  const res = await pfetch("/api/origins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                                  if (!res.ok) { setSaving(false); showToast('Erro ao criar origem'); return; }
                                  const created = await res.json();
                                  setOrigins((prev) => [created, ...prev]);
                                  setNewOriginName(null);
                                  setSaving(false);
                                  showToast('Origem criada!');
                                }
                                if (e.key === "Escape") setNewOriginName(null);
                              }}
                            />
                          )}
                          {col.key === 'txCount' && <span className="text-[var(--muted-foreground)] text-xs">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] mr-2"
                          onClick={async () => {
                            const name = newOriginName.trim();
                            if (!name) { showToast('Preencha o nome'); return; }
                            setSaving(true);
                            const res = await pfetch("/api/origins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                            if (!res.ok) { setSaving(false); showToast('Erro ao criar origem'); return; }
                            const created = await res.json();
                            setOrigins((prev) => [created, ...prev]);
                            setNewOriginName(null);
                            setSaving(false);
                            showToast('Origem criada!');
                          }}
                          title="Salvar"
                        >Salvar</button>
                        <button className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]" onClick={() => setNewOriginName(null)} title="Cancelar">Cancelar</button>
                      </td>
                    </tr>
                  )}
                  {sortedOrigins.map((o) => {
                    const txCount = transactions.filter((t) => t.originId === o.id).length;
                    return (
                      <tr key={o.id} style={{ height: 40 }} className={`border-b border-[var(--border)] transition-colors duration-200 ${selectedOrigins.has(o.id) ? 'bg-[var(--surface-alt)]' : editingOrigin === o.id ? 'bg-[var(--surface-alt)]' : 'hover:bg-[var(--surface-alt)]'}`}>
                        {oriCols.orderedColumns.map((col) => (
                          <td key={col.key} className="px-3 py-1.5" style={{ overflow: 'hidden' }}>
                            {col.key === 'name' && (
                              editingOrigin === o.id ? (
                                <input className="edit-field" defaultValue={o.name} autoFocus
                                  onBlur={async (e) => { const v = e.target.value.trim(); if (!v || v === o.name) { setEditingOrigin(null); return; } setSaving(true); await pfetch(`/api/origins/${o.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v }) }); setOrigins((prev) => prev.map((orig) => orig.id === o.id ? { ...orig, name: v } : orig)); setEditingOrigin(null); setSaving(false); showToast('Origem atualizada!'); }}
                                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingOrigin(null); }} />
                              ) : (
                                <span onClick={() => setEditingOrigin(o.id)} className="cursor-pointer hover:underline">{o.name}</span>
                              )
                            )}
                            {col.key === 'txCount' && (
                              <span className="text-[var(--muted-foreground)] text-xs">
                                {txCount > 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--surface-alt)] border border-[var(--border)]">
                                    {txCount} transaç{txCount === 1 ? 'ão' : 'ões'}
                                  </span>
                                ) : (
                                  <span className="italic text-gray-400">Nenhuma</span>
                                )}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-center">
                          <input type="checkbox" className={checkboxClassName} checked={selectedOrigins.has(o.id)}
                            onChange={() => { const next = new Set(selectedOrigins); if (next.has(o.id)) next.delete(o.id); else next.add(o.id); setSelectedOrigins(next); }}
                            aria-label={`Selecionar origem ${o.name}`} />
                        </td>
                      </tr>
                    );
                  })}
                  {origins.length === 0 && newOriginName === null && (
                    <tr>
                      <td colSpan={oriCols.orderedColumns.length + 1} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)] italic">
                        Nenhuma origem cadastrada. Clique em &ldquo;Nova Origem&rdquo; para adicionar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <span className="bg-[#1a3a2a] border border-[#3ecf8e] px-4 py-2.5 rounded-md text-[#3ecf8e] text-sm font-medium shadow-lg">
            {toast}
          </span>
        </div>
      )}
      <AnimatePresence>
        {importModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!importing) setImportModal(false); }}
          >
            <motion.div
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[var(--border)]">
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Importar Transações</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">Selecione um arquivo CSV ou OFX exportado do seu banco.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.ofx,.qfx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImportFileName(file.name);
                    readFileAsText(file).then((content) => {
                      const parsed = parseFile(content, file.name);
                      setImportData(parsed);
                      setImportSelected(new Set(parsed.map((_, i) => i)));
                    });
                    e.target.value = '';
                  }}
                />
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[var(--surface-alt)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload size={12} /> {importFileName || 'Selecionar arquivo'}
                </button>
                <div className="mt-3">
                  <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Origem das transações</label>
                  <select
                    className="edit-field w-full max-w-[200px]"
                    value={importOriginId}
                    onChange={(e) => setImportOriginId(e.target.value)}
                  >
                    <option value="">Sem origem</option>
                    {origins.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {importData.length > 0 && (
                <>
                  <div className="px-5 py-2 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {importSelected.size} de {importData.length} selecionadas
                    </span>
                    <button
                      className="text-xs text-[var(--primary)] hover:underline"
                      onClick={() => {
                        if (importSelected.size === importData.length) setImportSelected(new Set());
                        else setImportSelected(new Set(importData.map((_, i) => i)));
                      }}
                    >{importSelected.size === importData.length ? 'Desmarcar todas' : 'Selecionar todas'}</button>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    <table className="min-w-full text-xs">
                      <thead className="sticky top-0 bg-[var(--surface)] z-10">
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-4 py-2 w-10"></th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Data</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Descrição</th>
                          <th className="px-4 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Valor</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.map((t, i) => (
                          <tr
                            key={i}
                            className={`border-b border-[var(--border)] cursor-pointer transition-colors ${importSelected.has(i) ? 'bg-[var(--surface)]' : 'bg-[var(--surface)] opacity-40'}`}
                            onClick={() => {
                              const next = new Set(importSelected);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              setImportSelected(next);
                            }}
                          >
                            <td className="px-4 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={importSelected.has(i)}
                                readOnly
                                className="accent-[#3ecf8e] pointer-events-none"
                              />
                            </td>
                            <td className="px-4 py-1.5 text-[var(--foreground)]">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-1.5 text-[var(--foreground)] truncate max-w-[200px]">{t.description}</td>
                            <td className={`px-4 py-1.5 text-right ${t.type === 'INCOME' ? 'text-[#43b581]' : 'text-[#ed4245]'}`}>
                              {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-1.5">
                              <span className={`text-[10px] font-medium uppercase ${t.type === 'INCOME' ? 'text-[#43b581]' : 'text-[#ed4245]'}`}>
                                {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {importData.length === 0 && importFileName && (
                <div className="p-5">
                  <p className="text-xs text-[#ed4245]">Nenhuma transação encontrada no arquivo. Verifique se o formato é compatível (CSV com colunas Data, Descrição, Valor ou OFX padrão).</p>
                </div>
              )}
              <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
                  onClick={() => setImportModal(false)}
                  disabled={importing}
                >Cancelar</button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] disabled:opacity-50"
                  disabled={importing || importSelected.size === 0}
                  onClick={async () => {
                    setImporting(true);
                    const selected = importData.filter((_, i) => importSelected.has(i));
                    const res = await pfetch('/api/transactions/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ transactions: selected, originId: importOriginId || null }),
                    });
                    const result = await res.json();
                    if (res.ok) {
                      const updated = await pfetch('/api/transactions').then(r => r.json());
                      setTransactions(updated);
                      setImportModal(false);
                      showToast(`${result.imported} transações importadas!`, 2500);
                    } else {
                      showToast(result.error || 'Erro ao importar', 2500);
                    }
                    setImporting(false);
                  }}
                >
                  {importing ? 'Importando...' : `Importar ${importSelected.size} transações`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {catImportModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!catImporting) setCatImportModal(false); }}
          >
            <motion.div
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[var(--border)]">
                <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Importar Categorias</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">Selecione um arquivo CSV com as colunas: NOME, GRUPO, SUBGRUPO, TIPO.</p>
                <input
                  ref={catFileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCatImportFileName(file.name);
                    readFileAsText(file).then((content) => {
                      const parsed = parseCategoryCSV(content);
                      setCatImportData(parsed);
                      setCatImportSelected(new Set(parsed.map((_, i) => i)));
                    });
                    e.target.value = '';
                  }}
                />
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[var(--surface-alt)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  onClick={() => catFileInputRef.current?.click()}
                >
                  <FiUpload size={12} /> {catImportFileName || 'Selecionar arquivo'}
                </button>
              </div>
              {catImportData.length > 0 && (
                <>
                  <div className="px-5 py-2 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {catImportSelected.size} de {catImportData.length} selecionadas
                    </span>
                    <button
                      className="text-xs text-[var(--primary)] hover:underline"
                      onClick={() => {
                        if (catImportSelected.size === catImportData.length) setCatImportSelected(new Set());
                        else setCatImportSelected(new Set(catImportData.map((_, i) => i)));
                      }}
                    >{catImportSelected.size === catImportData.length ? 'Desmarcar todas' : 'Selecionar todas'}</button>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    <table className="min-w-full text-xs">
                      <thead className="sticky top-0 bg-[var(--surface)] z-10">
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-4 py-2 w-10"></th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Nome</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Grupo</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Subgrupo</th>
                          <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catImportData.map((c, i) => (
                          <tr
                            key={i}
                            className={`border-b border-[var(--border)] cursor-pointer transition-colors ${catImportSelected.has(i) ? 'bg-[var(--surface)]' : 'bg-[var(--surface)] opacity-40'}`}
                            onClick={() => {
                              const next = new Set(catImportSelected);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              setCatImportSelected(next);
                            }}
                          >
                            <td className="px-4 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={catImportSelected.has(i)}
                                readOnly
                                className="accent-[#3ecf8e] pointer-events-none"
                              />
                            </td>
                            <td className="px-4 py-1.5 text-[var(--foreground)] truncate max-w-[180px]">{c.name}</td>
                            <td className="px-4 py-1.5 text-[var(--foreground)] truncate max-w-[140px]">{c.group}</td>
                            <td className="px-4 py-1.5 text-[var(--foreground)] truncate max-w-[140px]">{c.subgroup}</td>
                            <td className="px-4 py-1.5">
                              <span className={`text-[10px] font-medium uppercase ${c.type === 'INCOME' ? 'text-[#43b581]' : 'text-[#ed4245]'}`}>
                                {c.type === 'INCOME' ? 'Entrada' : 'Saída'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {catImportData.length === 0 && catImportFileName && (
                <div className="p-5">
                  <p className="text-xs text-[#ed4245]">Nenhuma categoria encontrada no arquivo. Verifique se o CSV tem as colunas NOME, GRUPO, SUBGRUPO e TIPO.</p>
                </div>
              )}
              <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
                  onClick={() => setCatImportModal(false)}
                  disabled={catImporting}
                >Cancelar</button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] disabled:opacity-50"
                  disabled={catImporting || catImportSelected.size === 0}
                  onClick={async () => {
                    setCatImporting(true);
                    const selected = catImportData.filter((_, i) => catImportSelected.has(i));
                    const res = await pfetch('/api/categories/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ categories: selected }),
                    });
                    const result = await res.json();
                    if (res.ok) {
                      const updated = await pfetch('/api/categories').then(r => r.json());
                      setCategories(updated);
                      setCatImportModal(false);
                      const msg = result.skipped > 0
                        ? `${result.imported} categorias importadas (${result.skipped} duplicadas ignoradas)!`
                        : `${result.imported} categorias importadas!`;
                      showToast(msg, 2500);
                    } else {
                      showToast(result.error || 'Erro ao importar', 2500);
                    }
                    setCatImporting(false);
                  }}
                >
                  {catImporting ? 'Importando...' : `Importar ${catImportSelected.size} categorias`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 shadow-xl max-w-sm w-full mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[var(--foreground)] text-sm mb-5">{confirmModal.message}</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
                  onClick={() => setConfirmModal(null)}
                >Cancelar</button>
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#ed4245] text-white border border-[#ed4245] hover:bg-[#d63638] shadow-[0_0_0_0_rgba(237,66,69,0)] hover:shadow-[0_0_8px_0_rgba(237,66,69,0.25)]"
                  onClick={confirmModal.onConfirm}
                >Remover</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
