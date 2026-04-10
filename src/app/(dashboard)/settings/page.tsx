"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [currency, setCurrency] = useState("BRL");
  const [notifications, setNotifications] = useState(true);

  return (
    <motion.div 
      className="min-h-screen p-0 text-[var(--foreground)] font-sans"
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
        Configurações
      </motion.h1>

      <motion.div 
        className="space-y-8 max-w-xl mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)]">
          <h3 className="text-lg font-semibold mb-4 text-[var(--muted-foreground)]">Tema</h3>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="bg-[var(--surface-alt)] text-[var(--foreground)] p-2 rounded w-full border border-[var(--border)]"
          >
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
          </select>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)]">
          <h3 className="text-lg font-semibold mb-4 text-[var(--muted-foreground)]">Moeda</h3>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-[var(--surface-alt)] text-[var(--foreground)] p-2 rounded w-full border border-[var(--border)]"
          >
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)]">
          <h3 className="text-lg font-semibold mb-4 text-[var(--muted-foreground)]">Notificações</h3>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={notifications} 
              onChange={(e) => setNotifications(e.target.checked)}
              className="mr-2 accent-[#3ecf8e]"
            />
            Receber notificações
          </label>
        </div>

        <motion.button 
          className="bg-[var(--primary)] hover:opacity-90 text-black px-6 py-2 rounded-full font-semibold shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Salvar Configurações
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
