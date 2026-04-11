import { ReactNode } from "react";
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";

type CardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  type?: "default" | "success" | "danger" | "info";
};

const typeColors = {
  default: {
    accent: "text-[var(--muted-foreground)]",
  },
  success: {
    accent: "text-[#3ecf8e]",
  },
  danger: {
    accent: "text-[#ed4245]",
  },
  info: {
    accent: "text-[#eab308]",
  },
};

const typeIcons = {
  default: <FiMinus />,
  success: <FiTrendingUp />,
  danger: <FiTrendingDown />,
  info: <FiMinus />,
};

export function Card({ title, value, type = "default" }: CardProps) {
  const colors = typeColors[type];
  const icon = typeIcons[type];
  return (
    <div className="bg-[var(--surface)] p-5 rounded-lg border border-[var(--border)] flex items-center justify-between min-w-[180px] gap-4">
      <p className="text-[var(--muted-foreground)] text-xs font-medium uppercase tracking-wide shrink-0">{title}</p>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] tabular-nums">{value}</h2>
        <span className={`text-lg ${colors.accent}`}>{icon}</span>
      </div>
    </div>
  );
}