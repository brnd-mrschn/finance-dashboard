"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/finance", label: "Financeiro" },
  { href: "/data", label: "Dados" },
  // { href: "/settings", label: "Configurações" }, // Removido
];

export function Topbar() {
  const pathname = usePathname();
  return (
    <motion.nav
      className="w-full flex items-center h-14 px-5 bg-[var(--surface)] border-b border-[var(--border)] z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="mr-3 select-none flex items-center gap-2">
        {/* Logo SVG: símbolo Euro */}
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#euro_linear)"/>
          <text x="16" y="22.5" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="sans-serif">€</text>
          <defs>
            <linearGradient id="euro_linear" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3ecf8e"/>
              <stop offset="1" stopColor="#2ba86c"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <div className="flex gap-1 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} tabIndex={-1} className="focus:outline-none">
            <motion.span
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? "bg-[var(--surface-alt)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)]"}`}
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
