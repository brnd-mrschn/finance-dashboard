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
    border: "border-[var(--border)]",
    accent: "text-[var(--muted-foreground)]",
  },
  success: {
    border: "border-[var(--border)]",
    accent: "text-[#3ecf8e]",
  },
  danger: {
    border: "border-[var(--border)]",
    accent: "text-[#ed4245]",
  },
  info: {
    border: "border-[var(--border)]",
    accent: "text-[var(--muted-foreground)]",
  },
};

export function Card({ title, value, icon, type = "default" }: CardProps) {
  const colors = typeColors[type];
  return (
    <motion.div
      className={`bg-[var(--surface)] p-5 rounded-lg border ${colors.border} flex flex-col gap-1.5 min-w-[180px]`}
      whileHover={{ borderColor: "var(--muted)" }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-2">
        {icon && <span className={`text-lg ${colors.accent}`}>{icon}</span>}
        <p className="text-[var(--muted-foreground)] text-xs font-medium uppercase tracking-wide">{title}</p>
      </div>
      <h2 className="text-2xl font-semibold text-[var(--foreground)]">{value}</h2>
    </motion.div>
  );
}