"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/finance", label: "Financeiro" },
  // { href: "/settings", label: "Configurações" }, // Removido
];

export function Topbar() {
  const pathname = usePathname();
  return (
    <motion.nav
      className="w-full flex items-center h-16 px-6 bg-[var(--surface)] border-b border-[var(--surface-alt)] shadow-sm z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="text-xl font-bold text-[var(--accent)] tracking-tight mr-8 select-none">💸 Finance</span>
      <div className="flex gap-4 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <motion.span
              className={`px-3 py-1 rounded-md font-medium text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors ${pathname === item.href ? "bg-[var(--primary)] text-[var(--foreground)]" : ""}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.97 }}
            >
              {item.label}
            </motion.span>
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-end">
        <ThemeToggle />
      </div>
    </motion.nav>
  );
}
