import { motion } from "framer-motion";


import { ReactNode } from "react";

type CardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  type?: "default" | "success" | "danger" | "info";
};

const typeColors = {
  default: {
    bg: "bg-[var(--surface)]",
    border: "border-[var(--surface-alt)]",
    text: "text-[var(--foreground)]",
    accent: "text-[#7289da]",
  },
  success: {
    bg: "bg-[var(--surface)]",
    border: "border-[#43b581]",
    text: "text-[var(--foreground)]",
    accent: "text-[#43b581]",
  },
  danger: {
    bg: "bg-[var(--surface)]",
    border: "border-[#ed4245]",
    text: "text-[var(--foreground)]",
    accent: "text-[#ed4245]",
  },
  info: {
    bg: "bg-[var(--surface)]",
    border: "border-[#7289da]",
    text: "text-[var(--foreground)]",
    accent: "text-[#7289da]",
  },
};

export function Card({ title, value, icon, type = "default" }: CardProps) {
  const colors = typeColors[type];
  return (
    <motion.div
      className={`relative ${colors.bg} p-6 rounded-2xl shadow-md border ${colors.border} hover:shadow-lg transition-all flex flex-col gap-2 min-w-[180px]`}
      whileHover={{ scale: 1.04, boxShadow: "0 4px 32px #5865f233" }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={`text-2xl ${colors.accent}`}>{icon}</span>}
        <p className="text-[#b9bbbe] text-sm mb-1">{title}</p>
      </div>
      <h2 className={`text-3xl font-bold ${colors.text}`}>{value}</h2>
    </motion.div>
  );
}