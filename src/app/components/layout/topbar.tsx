"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/finance", label: "Financeiro" },
  { href: "/settings", label: "Configurações" },
];

export function Topbar() {
  const pathname = usePathname();
  return (
    <motion.nav
      className="w-full flex items-center h-16 px-6 bg-[#23272a] border-b border-[#2c2f33] shadow-sm z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="text-xl font-bold text-[#7289da] tracking-tight mr-8 select-none">💸 Finance</span>
      <div className="flex gap-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <motion.span
              className={`px-3 py-1 rounded-md font-medium text-white hover:bg-[#40444b] transition-colors ${pathname === item.href ? "bg-[#5865f2] text-white" : ""}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.97 }}
            >
              {item.label}
            </motion.span>
          </Link>
        ))}
      </div>
    </motion.nav>
  );
}
