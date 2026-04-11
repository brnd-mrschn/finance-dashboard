"use client";

import { useEffect, useState, useRef } from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
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
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
            onClick={() => setNewTransaction({ description: "", date: new Date().toISOString().slice(0,10), amount: 0, type: "EXPENSE", categoryId: "", originId: "" })}
          >
            <FiPlus className="text-sm" /> Nova Transação
          </button>
        )}
        {view === 'categories' && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-[#30a46c] text-white border border-[#3ecf8e] hover:bg-[#2b9260] shadow-[0_0_0_0_rgba(62,207,142,0)] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
            onClick={() => setNewCategory({ name: "", group: "", subgroup: "", type: "EXPENSE", expected: "" })}
          >
            <FiPlus className="text-sm" /> Nova Categoria
          </button>
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
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[22%]">Descrição</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[14%]">Data</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[14%]">Valor</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[12%]">Tipo</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[16%]">Categoria</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] w-[14%]">Origem</th>
                    <th className="px-4 py-2.5 w-[8%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {newTransaction && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      <td className="px-3 py-2">
                        <input
                          className="edit-field"
                          value={newTransaction.description}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, description: e.target.value }))}
                          placeholder="Descrição"
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="edit-field"
                          value={newTransaction.date}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, date: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="edit-field"
                          value={newTransaction.amount}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, amount: e.target.value }))}
                          placeholder="Valor"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="edit-field"
                          value={newTransaction.type}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, type: e.target.value }))}
                        >
                          <option value="INCOME">Receita</option>
                          <option value="EXPENSE">Despesa</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                  {transactions.map((t) => (
                    <tr key={t.id} className={`border-b border-[var(--border)] transition-colors duration-200 ${editingTransaction === t.id ? 'bg-[var(--surface-alt)]' : 'hover:bg-[var(--surface-alt)]'}`}>
                      {/* Descrição */}
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Remover"
                          onClick={async () => {
                            if (!confirm("Remover transação?")) return;
                            setSaving(true);
                            await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
                            setTransactions((prev) => prev.filter((tr) => tr.id !== t.id));
                            setSaving(false);
                            setToast('Transação removida!');
                            if (toastTimeout.current) clearTimeout(toastTimeout.current);
                            toastTimeout.current = setTimeout(() => setToast(null), 1800);
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
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-y border-[var(--border)]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Nome</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Grupo</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Subgrupo</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Tipo</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Esperado</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {newCategory && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                      <td className="px-3 py-2">
                        <input
                          className="edit-field"
                          value={newCategory.name}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, name: e.target.value }))}
                          placeholder="Nome"
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="edit-field"
                          value={newCategory.group}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, group: e.target.value }))}
                          placeholder="Grupo"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="edit-field"
                          value={newCategory.subgroup}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, subgroup: e.target.value }))}
                          placeholder="Subgrupo"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="edit-field"
                          value={newCategory.type}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, type: e.target.value }))}
                        >
                          <option value="EXPENSE">Despesa</option>
                          <option value="INCOME">Receita</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
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
                  {categories.map((c) => (
                    <tr key={c.id} className={`border-b border-[var(--border)] transition-colors duration-200 ${editingCategory === c.id ? 'bg-[var(--surface-alt)]' : 'hover:bg-[var(--surface-alt)]'}`}>
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2">
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
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Remover"
                          onClick={async () => {
                            if (!confirm("Remover categoria?")) return;
                            setSaving(true);
                            await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
                            setCategories((prev) => prev.filter((cat) => cat.id !== c.id));
                            setSaving(false);
                            setToast('Categoria removida!');
                            if (toastTimeout.current) clearTimeout(toastTimeout.current);
                            toastTimeout.current = setTimeout(() => setToast(null), 1800);
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
    </motion.div>
  );
}
