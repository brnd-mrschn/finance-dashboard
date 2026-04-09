"use client";

import { useEffect, useState, useRef } from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";

export default function DataPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
        Data
      </motion.h1>
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${view === 'transactions' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-alt)] text-[var(--foreground)]'}`}
          onClick={() => setView('transactions')}
        >Transações</button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${view === 'categories' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-alt)] text-[var(--foreground)]'}`}
          onClick={() => setView('categories')}
        >Categorias</button>
      </div>
      {error && <p className="text-[#ed4245]">{error}</p>}
      <div>
        {view === 'transactions' && (
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--surface-alt)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Transações</h2>
              <button
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--primary)] transition-colors"
                onClick={() => setNewTransaction({ description: "", date: new Date().toISOString().slice(0,10), amount: 0, type: "EXPENSE", categoryId: "" })}
              >
                <FiPlus /> Nova Transação
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-alt)]">
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {newTransaction && (
                    <tr className="border-b border-[var(--surface-alt)] bg-[var(--surface-alt)]">
                      <td className="px-3 py-2">
                        <input
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newTransaction.description}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, description: e.target.value }))}
                          placeholder="Descrição"
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newTransaction.date}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, date: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newTransaction.amount}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, amount: e.target.value }))}
                          placeholder="Valor"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newTransaction.type}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, type: e.target.value }))}
                        >
                          <option value="INCOME">Receita</option>
                          <option value="EXPENSE">Despesa</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newTransaction.categoryId}
                          onChange={e => setNewTransaction((nt: any) => ({ ...nt, categoryId: e.target.value }))}
                        >
                          <option value="">Sem categoria</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-green-500 font-bold mr-2"
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
                          className="text-red-500 font-bold"
                          onClick={() => setNewTransaction(null)}
                          title="Cancelar"
                        >Cancelar</button>
                      </td>
                    </tr>
                  )}
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--surface-alt)] hover:bg-[var(--surface-alt)]">
                      {/* Descrição */}
                      <td className="px-3 py-2">
                        {editingTransaction === t.id && editingField === 'description' ? (
                          <input
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={t.description}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                          <span onClick={() => { setEditingTransaction(t.id); setEditingField('description'); }} className="cursor-pointer hover:underline">{t.description}</span>
                        )}
                      </td>
                      {/* Data */}
                      <td className="px-3 py-2">
                        {editingTransaction === t.id && editingField === 'date' ? (
                          <input
                            type="date"
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={t.date.slice(0, 10)}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                          <span onClick={() => { setEditingTransaction(t.id); setEditingField('date'); }} className="cursor-pointer hover:underline">{new Date(t.date).toLocaleDateString()}</span>
                        )}
                      </td>
                      {/* Valor */}
                      <td className="px-3 py-2">
                        {editingTransaction === t.id && editingField === 'amount' ? (
                          <input
                            type="number"
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={t.amount}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = parseFloat(e.target.value);
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
                          <span onClick={() => { setEditingTransaction(t.id); setEditingField('amount'); }} className="cursor-pointer hover:underline">{t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                        )}
                      </td>
                      {/* Tipo */}
                      <td className="px-3 py-2">
                        {editingTransaction === t.id && editingField === 'type' ? (
                          <select
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={t.type}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                          <span onClick={() => { setEditingTransaction(t.id); setEditingField('type'); }} className="cursor-pointer hover:underline">{t.type === "INCOME" ? "Receita" : "Despesa"}</span>
                        )}
                      </td>
                      {/* Categoria */}
                      <td className="px-3 py-2">
                        {editingTransaction === t.id && editingField === 'categoryId' ? (
                          <select
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={t.categoryId || ""}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                          <span onClick={() => { setEditingTransaction(t.id); setEditingField('categoryId'); }} className="cursor-pointer hover:underline">
                            {categories.find((c) => c.id === t.categoryId)?.name || <span className="italic text-gray-400">Sem categoria</span>}
                          </span>
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
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--surface-alt)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categorias</h2>
              <button
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--accent)] text-white font-semibold hover:bg-[var(--primary)] transition-colors"
                onClick={() => setNewCategory({ name: "", group: "", subgroup: "", type: "EXPENSE", expected: "" })}
              >
                <FiPlus /> Nova Categoria
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-alt)]">
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Grupo</th>
                    <th className="px-3 py-2">Subgrupo</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Esperado</th>
                  </tr>
                </thead>
                <tbody>
                  {newCategory && (
                    <tr className="border-b border-[var(--surface-alt)] bg-[var(--surface-alt)]">
                      <td className="px-3 py-2">
                        <input
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newCategory.name}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, name: e.target.value }))}
                          placeholder="Nome"
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newCategory.group}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, group: e.target.value }))}
                          placeholder="Grupo"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newCategory.subgroup}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, subgroup: e.target.value }))}
                          placeholder="Subgrupo"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
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
                          className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                          value={newCategory.expected}
                          onChange={e => setNewCategory((nc: any) => ({ ...nc, expected: e.target.value }))}
                          placeholder="Valor esperado"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-green-500 font-bold mr-2"
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
                          className="text-red-500 font-bold"
                          onClick={() => setNewCategory(null)}
                          title="Cancelar"
                        >Cancelar</button>
                      </td>
                    </tr>
                  )}
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--surface-alt)] hover:bg-[var(--surface-alt)]">
                      <td className="px-3 py-2">
                        {editingCategory === c.id && editingField === 'name' ? (
                          <input
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={c.name}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={c.group}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={c.subgroup}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={c.type}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value;
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
                            className="bg-transparent border-b border-[var(--primary)] outline-none w-full"
                            defaultValue={c.expected ?? ""}
                            autoFocus
                            onBlur={async (e) => {
                              setSaving(true);
                              const value = e.target.value ? parseFloat(e.target.value) : null;
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <span className="bg-[var(--surface)] border border-[var(--surface-alt)] px-6 py-3 rounded-xl text-[var(--accent)] font-bold shadow-lg animate-fade-in-out">
            {toast}
          </span>
        </div>
      )}
    </motion.div>
  );
}
