"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/finance", label: "Financeiro" },
  { href: "/data", label: "Data" },
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
      <span className="mr-8 select-none flex items-center gap-2">
        {/* Logo SVG: cifrão estilizado */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#money_linear)"/>
          <path d="M16 8v16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M12 12c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2-1.5 3-4 3s-4 1-4 3c0 2.21 1.79 4 4 4s4-1.79 4-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="money_linear" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#43e97b"/>
              <stop offset="1" stopColor="#38f9d7"/>
            </linearGradient>
          </defs>
        </svg>
        <span className="text-xl font-bold text-[var(--accent)] tracking-tight">NotRichYet</span>
      </span>
      <div className="flex gap-4 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} tabIndex={-1} className="focus:outline-none">
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
