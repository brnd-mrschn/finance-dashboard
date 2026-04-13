"use client";

import { useEffect, useState, useRef } from "react";
import { FiTrash2, FiPlus, FiChevronUp, FiChevronDown, FiUpload } from "react-icons/fi";
import { parseFile, type ParsedTransaction } from "@/lib/import-parser";
import { motion, AnimatePresence } from "framer-motion";

export default function DataPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [origins, setOrigins] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null); // novo: campo em edição
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [newTransaction, setNewTransaction] = useState<any | null>(null);
  const [newCategory, setNewCategory] = useState<any | null>(null);
  const [view, setView] = useState<'transactions' | 'categories'>('transactions');
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [catSortField, setCatSortField] = useState<string>('name');
  const [catSortDir, setCatSortDir] = useState<'asc' | 'desc'>('asc');
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState<ParsedTransaction[]>([]);
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importOriginId, setImportOriginId] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const toggleCatSort = (field: string) => {
    if (catSortField === field) setCatSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setCatSortField(field); setCatSortDir('asc'); }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'description': return dir * a.description.localeCompare(b.description);
      case 'date': return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'amount': return dir * (a.amount - b.amount);
      case 'type': return dir * a.type.localeCompare(b.type);
      case 'categoryId': {
        const ca = categories.find(c => c.id === a.categoryId)?.name || '';
        const cb = categories.find(c => c.id === b.categoryId)?.name || '';
        return dir * ca.localeCompare(cb);
      }
      case 'originId': {
        const oa = origins.find(o => o.id === a.originId)?.name || '';
        const ob = origins.find(o => o.id === b.originId)?.name || '';
        return dir * oa.localeCompare(ob);
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

  const SortIcon = ({ field, current, dir }: { field: string; current: string; dir: 'asc' | 'desc' }) => (
    <span className="inline-flex ml-1 opacity-60">
      {current === field ? (dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />) : <FiChevronDown size={10} className="opacity-30" />}
    </span>
  );

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then(setTransactions)
      .catch(() => setError("Erro ao carregar transações"));
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setError("Erro ao carregar categorias"));
    fetch("/api/origins")
      .then((res) => res.json())
      .then(setOrigins)
      .catch(() => setError("Erro ao carregar origens"));
  }, []);

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
                      await fetch('/api/transactions/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids }),
                      });
                      setTransactions((prev) => prev.filter((tr) => !selectedTransactions.has(tr.id)));
                      setSelectedTransactions(new Set());
                      setSaving(false);
                      setToast(`${ids.length} transação(ões) removida(s)!`);
                      if (toastTimeout.current) clearTimeout(toastTimeout.current);
                      toastTimeout.current = setTimeout(() => setToast(null), 1800);
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
              onClick={() => setNewTransaction({ description: "", date: new Date().toISOString().slice(0,10), amount: 0, type: "EXPENSE", categoryId: "", originId: "" })}
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
                      await fetch('/api/categories/bulk-delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids }),
                      });
                      setCategories((prev) => prev.filter((cat) => !selectedCategories.has(cat.id)));
                      setSelectedCategories(new Set());
                      setSaving(false);
                      setToast(`${ids.length} categoria(s) removida(s)!`);
                      if (toastTimeout.current) clearTimeout(toastTimeout.current);
                      toastTimeout.current = setTimeout(() => setToast(null), 1800);
                    },
                  });
                }}
              >
                <FiTrash2 size={12} /> Excluir {selectedCategories.size}
              </button>
            )}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
              onClick={() => setNewCategory({ name: "", group: "", subgroup: "", type: "EXPENSE", expected: "" })}
            >
              <FiPlus className="text-sm" /> Nova Categoria
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
                <thead>
                  <tr className="border-y border-[var(--border)]">
                    <th className="px-2 py-2.5 w-[4%] text-center">
                      <input
                        type="checkbox"
                        className="accent-[#3ecf8e]"
                        checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                        onChange={() => {
                          if (selectedTransactions.size === transactions.length) setSelectedTransactions(new Set());
                          else setSelectedTransactions(new Set(transactions.map(t => t.id)));
                        }}
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[20%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleSort('description')}>Descrição<SortIcon field="description" current={sortField} dir={sortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[13%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleSort('date')}>Data<SortIcon field="date" current={sortField} dir={sortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[13%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleSort('amount')}>Valor<SortIcon field="amount" current={sortField} dir={sortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[11%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleSort('type')}>Tipo<SortIcon field="type" current={sortField} dir={sortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[15%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleSort('categoryId')}>Categoria<SortIcon field="categoryId" current={sortField} dir={sortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[13%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleSort('originId')}>Origem<SortIcon field="originId" current={sortField} dir={sortDir} /></th>
                    <th className="px-4 py-2.5 w-[7%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {newTransaction && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      <td className="px-2 py-1.5"></td>
                      <td className="px-3 py-1.5">
                        <input
                          className="edit-field"
                          value={newTransaction.description}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, description: e.target.value }))}
                          placeholder="Descrição"
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="date"
                          className="edit-field"
                          value={newTransaction.date}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, date: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="edit-field"
                          value={newTransaction.amount}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, amount: e.target.value }))}
                          placeholder="Valor"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          className="edit-field"
                          value={newTransaction.type}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, type: e.target.value }))}
                        >
                          <option value="INCOME">Receita</option>
                          <option value="EXPENSE">Despesa</option>
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          className="edit-field"
                          value={newTransaction.categoryId}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, categoryId: e.target.value }))}
                        >
                          <option value="">Sem categoria</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          className="edit-field"
                          value={newTransaction.originId}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, originId: e.target.value }))}
                        >
                          <option value="">Sem origem</option>
                          {origins.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] mr-2"
                          onClick={async () => {
                            if (!newTransaction.description.trim()) {
                              setToast('Preencha a descrição');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            if (!newTransaction.date) {
                              setToast('Preencha a data');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
                              setToast('Preencha um valor maior que zero');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            setSaving(true);
                            const res = await fetch("/api/transactions", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                ...newTransaction,
                                amount: parseFloat(newTransaction.amount),
                              }),
                            });
                            if (!res.ok) {
                              setSaving(false);
                              setToast('Erro ao criar transação');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            const created = await res.json();
                            setTransactions((prev) => [created, ...prev]);
                            setNewTransaction(null);
                            setSaving(false);
                            setToast('Transação criada!');
                            if (toastTimeout.current) clearTimeout(toastTimeout.current);
                            toastTimeout.current = setTimeout(() => setToast(null), 1800);
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
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          className="accent-[#3ecf8e]"
                          checked={selectedTransactions.has(t.id)}
                          onChange={() => {
                            const next = new Set(selectedTransactions);
                            if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                            setSelectedTransactions(next);
                          }}
                        />
                      </td>
                      {/* Descrição */}
                      <td className="px-3 py-1.5">
                        {editingTransaction === t.id && editingField === 'description' ? (
                          <input
                            className="edit-field"
                            defaultValue={t.description}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === t.description) { setEditingTransaction(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...t, description: value }),
                              });
                              setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, description: value } : tr));
                              setEditingTransaction(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Transação atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <div onClick={() => { setEditingTransaction(t.id); setEditingField('description'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{t.description}</div>
                        )}
                      </td>
                      {/* Data */}
                      <td className="px-3 py-1.5">
                        {editingTransaction === t.id && editingField === 'date' ? (
                          <input
                            type="date"
                            className="edit-field"
                            defaultValue={t.date.slice(0, 10)}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === t.date.slice(0, 10)) { setEditingTransaction(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...t, date: value }),
                              });
                              setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, date: value } : tr));
                              setEditingTransaction(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Transação atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <div onClick={() => { setEditingTransaction(t.id); setEditingField('date'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{new Date(t.date.slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                        )}
                      </td>
                      {/* Valor */}
                      <td className="px-3 py-1.5">
                        {editingTransaction === t.id && editingField === 'amount' ? (
                          <input
                            type="number"
                            className="edit-field"
                            defaultValue={t.amount}
                            autoFocus
                            onBlur={async (e) => {
                              const value = parseFloat(e.target.value);
                              if (value === t.amount) { setEditingTransaction(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...t, amount: value }),
                              });
                              setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, amount: value } : tr));
                              setEditingTransaction(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Transação atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <div onClick={() => { setEditingTransaction(t.id); setEditingField('amount'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        )}
                      </td>
                      {/* Tipo */}
                      <td className="px-3 py-1.5">
                        {editingTransaction === t.id && editingField === 'type' ? (
                          <select
                            className="edit-field"
                            defaultValue={t.type}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === t.type) { setEditingTransaction(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...t, type: value }),
                              });
                              setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, type: value } : tr));
                              setEditingTransaction(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Transação atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLSelectElement).blur();
                            }}
                          >
                            <option value="INCOME">Receita</option>
                            <option value="EXPENSE">Despesa</option>
                          </select>
                        ) : (
                          <div onClick={() => { setEditingTransaction(t.id); setEditingField('type'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">{t.type === "INCOME" ? "Receita" : "Despesa"}</div>
                        )}
                      </td>
                      {/* Categoria */}
                      <td className="px-3 py-1.5">
                        {editingTransaction === t.id && editingField === 'categoryId' ? (
                          <select
                            className="edit-field"
                            defaultValue={t.categoryId || ""}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === (t.categoryId || "")) { setEditingTransaction(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...t, categoryId: value })
                              });
                              setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, categoryId: value } : tr));
                              setEditingTransaction(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Transação atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLSelectElement).blur();
                            }}
                          >
                            <option value="">Sem categoria</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div onClick={() => { setEditingTransaction(t.id); setEditingField('categoryId'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">
                            {categories.find((c) => c.id === t.categoryId)?.name || <span className="italic text-gray-400">Sem categoria</span>}
                          </div>
                        )}
                      </td>
                      {/* Origem */}
                      <td className="px-3 py-1.5">
                        {editingTransaction === t.id && editingField === 'originId' ? (
                          <select
                            className="edit-field"
                            defaultValue={t.originId || ""}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === (t.originId || "")) { setEditingTransaction(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...t, originId: value || null }),
                              });
                              setTransactions((prev) => prev.map((tr) => tr.id === t.id ? { ...tr, originId: value || null } : tr));
                              setEditingTransaction(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Transação atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLSelectElement).blur();
                            }}
                          >
                            <option value="">Sem origem</option>
                            {origins.map((o) => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div onClick={() => { setEditingTransaction(t.id); setEditingField('originId'); }} className="cursor-pointer hover:underline w-full min-h-[24px] flex items-center">
                            {origins.find((o) => o.id === t.originId)?.name || <span className="italic text-gray-400">-</span>}
                          </div>
                        )}
                      </td>
                      <td className="pr-4 py-2 text-right">
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Remover"
                          onClick={() => {
                            setConfirmModal({
                              message: "Tem certeza que deseja remover esta transação?",
                              onConfirm: async () => {
                                setConfirmModal(null);
                                setSaving(true);
                                await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
                                setTransactions((prev) => prev.filter((tr) => tr.id !== t.id));
                                setSaving(false);
                                setToast('Transação removida!');
                                if (toastTimeout.current) clearTimeout(toastTimeout.current);
                                toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              },
                            });
                          }}
                        >
                          <FiTrash2 />
                        </button>
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
                <thead>
                  <tr className="border-y border-[var(--border)]">
                    <th className="px-2 py-2.5 w-[4%] text-center">
                      <input
                        type="checkbox"
                        className="accent-[#3ecf8e]"
                        checked={categories.length > 0 && selectedCategories.size === categories.length}
                        onChange={() => {
                          if (selectedCategories.size === categories.length) setSelectedCategories(new Set());
                          else setSelectedCategories(new Set(categories.map(c => c.id)));
                        }}
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[20%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleCatSort('name')}>Nome<SortIcon field="name" current={catSortField} dir={catSortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[18%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleCatSort('group')}>Grupo<SortIcon field="group" current={catSortField} dir={catSortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[18%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleCatSort('subgroup')}>Subgrupo<SortIcon field="subgroup" current={catSortField} dir={catSortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[13%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleCatSort('type')}>Tipo<SortIcon field="type" current={catSortField} dir={catSortDir} /></th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[15%] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors" onClick={() => toggleCatSort('expected')}>Esperado<SortIcon field="expected" current={catSortField} dir={catSortDir} /></th>
                    <th className="px-4 py-2.5 w-[7%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {newCategory && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      <td className="px-2 py-1.5"></td>
                      <td className="px-3 py-1.5">
                        <input
                          className="edit-field"
                          value={newCategory.name}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, name: e.target.value }))}
                          placeholder="Nome"
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="edit-field"
                          value={newCategory.group}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, group: e.target.value }))}
                          placeholder="Grupo"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="edit-field"
                          value={newCategory.subgroup}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, subgroup: e.target.value }))}
                          placeholder="Subgrupo"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          className="edit-field"
                          value={newCategory.type}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, type: e.target.value }))}
                        >
                          <option value="EXPENSE">Despesa</option>
                          <option value="INCOME">Receita</option>
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="edit-field"
                          value={newCategory.expected}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, expected: e.target.value }))}
                          placeholder="Valor esperado"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)] mr-2"
                          onClick={async () => {
                            if (!newCategory.name.trim()) {
                              setToast('Preencha o nome');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            if (!newCategory.group.trim()) {
                              setToast('Preencha o grupo');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            if (!newCategory.subgroup.trim()) {
                              setToast('Preencha o subgrupo');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            setSaving(true);
                            const res = await fetch("/api/categories", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(newCategory),
                            });
                            if (!res.ok) {
                              setSaving(false);
                              setToast('Erro ao criar categoria');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              return;
                            }
                            const created = await res.json();
                            setCategories((prev) => [created, ...prev]);
                            setNewCategory(null);
                            setSaving(false);
                            setToast('Categoria criada!');
                            if (toastTimeout.current) clearTimeout(toastTimeout.current);
                            toastTimeout.current = setTimeout(() => setToast(null), 1800);
                          }}
                          title="Salvar"
                        >Salvar</button>
                        <button
                          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-transparent text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] hover:bg-[var(--surface-alt)]"
                          onClick={() => setNewCategory(null)}
                          title="Cancelar"
                        >Cancelar</button>
                      </td>
                    </tr>
                  )}
                  {sortedCategories.map((c) => (
                    <tr key={c.id} style={{ height: 40 }} className={`border-b border-[var(--border)] transition-colors duration-200 ${selectedCategories.has(c.id) ? 'bg-[var(--surface-alt)]' : editingCategory === c.id ? 'bg-[var(--surface-alt)]' : 'hover:bg-[var(--surface-alt)]'}`}>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          className="accent-[#3ecf8e]"
                          checked={selectedCategories.has(c.id)}
                          onChange={() => {
                            const next = new Set(selectedCategories);
                            if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                            setSelectedCategories(next);
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        {editingCategory === c.id && editingField === 'name' ? (
                          <input
                            className="edit-field"
                            defaultValue={c.name}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === c.name) { setEditingCategory(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/categories/${c.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...c, name: value })
                              });
                              setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, name: value } : cat));
                              setEditingCategory(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Categoria atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <span onClick={() => { setEditingCategory(c.id); setEditingField('name'); }} className="cursor-pointer hover:underline">{c.name}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {editingCategory === c.id && editingField === 'group' ? (
                          <input
                            className="edit-field"
                            defaultValue={c.group}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === c.group) { setEditingCategory(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/categories/${c.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...c, group: value })
                              });
                              setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, group: value } : cat));
                              setEditingCategory(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Categoria atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <span onClick={() => { setEditingCategory(c.id); setEditingField('group'); }} className="cursor-pointer hover:underline">{c.group}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {editingCategory === c.id && editingField === 'subgroup' ? (
                          <input
                            className="edit-field"
                            defaultValue={c.subgroup}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === c.subgroup) { setEditingCategory(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/categories/${c.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...c, subgroup: value })
                              });
                              setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, subgroup: value } : cat));
                              setEditingCategory(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Categoria atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <span onClick={() => { setEditingCategory(c.id); setEditingField('subgroup'); }} className="cursor-pointer hover:underline">{c.subgroup}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {editingCategory === c.id && editingField === 'type' ? (
                          <select
                            className="edit-field"
                            defaultValue={c.type}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value;
                              if (value === c.type) { setEditingCategory(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/categories/${c.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...c, type: value })
                              });
                              setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, type: value } : cat));
                              setEditingCategory(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Categoria atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLSelectElement).blur();
                            }}
                          >
                            <option value="EXPENSE">Despesa</option>
                            <option value="INCOME">Receita</option>
                          </select>
                        ) : (
                          <span onClick={() => { setEditingCategory(c.id); setEditingField('type'); }} className="cursor-pointer hover:underline">{c.type === "INCOME" ? "Receita" : "Despesa"}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {editingCategory === c.id && editingField === 'expected' ? (
                          <input
                            type="number"
                            className="edit-field"
                            defaultValue={c.expected ?? ""}
                            autoFocus
                            onBlur={async (e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null;
                              if (value === (c.expected ?? null)) { setEditingCategory(null); setEditingField(null); return; }
                              setSaving(true);
                              await fetch(`/api/categories/${c.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...c, expected: value })
                              });
                              setCategories((prev) => prev.map((cat) => cat.id === c.id ? { ...cat, expected: value } : cat));
                              setEditingCategory(null);
                              setEditingField(null);
                              setSaving(false);
                              setToast('Categoria atualizada!');
                              if (toastTimeout.current) clearTimeout(toastTimeout.current);
                              toastTimeout.current = setTimeout(() => setToast(null), 1800);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <span onClick={() => { setEditingCategory(c.id); setEditingField('expected'); }} className="cursor-pointer hover:underline">
                            {c.expected?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || <span className="italic text-gray-400">-</span>}
                          </span>
                        )}
                      </td>
                      <td className="pr-4 py-2 text-right">
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Remover"
                          onClick={() => {
                            setConfirmModal({
                              message: "Tem certeza que deseja remover esta categoria?",
                              onConfirm: async () => {
                                setConfirmModal(null);
                                setSaving(true);
                                await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
                                setCategories((prev) => prev.filter((cat) => cat.id !== c.id));
                                setSaving(false);
                                setToast('Categoria removida!');
                                if (toastTimeout.current) clearTimeout(toastTimeout.current);
                                toastTimeout.current = setTimeout(() => setToast(null), 1800);
                              },
                            });
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
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
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const content = ev.target?.result as string;
                      const parsed = parseFile(content, file.name);
                      setImportData(parsed);
                      setImportSelected(new Set(parsed.map((_, i) => i)));
                    };
                    reader.readAsText(file, 'utf-8');
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
                    const res = await fetch('/api/transactions/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ transactions: selected, originId: importOriginId || null }),
                    });
                    const result = await res.json();
                    if (res.ok) {
                      const updated = await fetch('/api/transactions').then(r => r.json());
                      setTransactions(updated);
                      setImportModal(false);
                      setToast(`${result.imported} transações importadas!`);
                      if (toastTimeout.current) clearTimeout(toastTimeout.current);
                      toastTimeout.current = setTimeout(() => setToast(null), 2500);
                    } else {
                      setToast(result.error || 'Erro ao importar');
                      if (toastTimeout.current) clearTimeout(toastTimeout.current);
                      toastTimeout.current = setTimeout(() => setToast(null), 2500);
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
