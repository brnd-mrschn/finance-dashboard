"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [currency, setCurrency] = useState("BRL");
  const [notifications, setNotifications] = useState(true);

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
        Configurações
      </motion.h1>

      <motion.div 
        className="space-y-8 max-w-xl mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-[#23272a] p-6 rounded-2xl border border-[#2c2f33]">
          <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Tema</h3>
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="bg-[#2c2f33] text-[#f2f3f5] p-2 rounded w-full"
          >
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
          </select>
        </div>

        <div className="bg-[#23272a] p-6 rounded-2xl border border-[#2c2f33]">
          <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Moeda</h3>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-[#2c2f33] text-[#f2f3f5] p-2 rounded w-full"
          >
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div className="bg-[#23272a] p-6 rounded-2xl border border-[#2c2f33]">
          <h3 className="text-lg font-semibold mb-4 text-[#b9bbbe]">Notificações</h3>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={notifications} 
              onChange={(e) => setNotifications(e.target.checked)}
              className="mr-2 accent-[#5865f2]"
            />
            Receber notificações
          </label>
        </div>

        <motion.button 
          className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2 rounded font-semibold shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Salvar Configurações
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
