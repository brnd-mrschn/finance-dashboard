"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";
import { useProfile } from "@/lib/profile-context";
import { FiChevronDown, FiPlus, FiUser, FiLogOut } from "react-icons/fi";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/finance", label: "Financeiro" },
  { href: "/data", label: "Dados" },
];

export function Topbar() {
  const pathname = usePathname();
  const { profiles, activeProfile, setActiveProfile, loading, reload } = useProfile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCreating(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth-signout", { method: "POST" });
    } catch {
      // ignora erros de rede
    }
    window.location.href = "/login";
  };

  const handleCreateProfile = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const created = await res.json();
        await reload();
        setActiveProfile(created);
        setCreating(false);
        setNewName("");
        setDropdownOpen(false);
      }
    } catch {
      // silencioso
    }
  };

  return (
    <motion.nav
      className="w-full flex items-center h-14 px-5 bg-[var(--surface)] border-b border-[var(--border)] z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="mr-3 select-none flex items-center gap-2">
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

      <div className="flex items-center gap-2">
        {/* Seletor de perfil */}
        {!loading && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors"
              onClick={() => { setDropdownOpen((v) => !v); setCreating(false); setNewName(""); }}
            >
              <FiUser size={13} className="text-[var(--muted-foreground)]" />
              <span className="max-w-[120px] truncate">
                {activeProfile?.name ?? "Selecionar perfil"}
              </span>
              <FiChevronDown size={12} className={`text-[var(--muted-foreground)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                >
                  <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    Perfis
                  </div>

                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-alt)] ${activeProfile?.id === profile.id ? "text-[#43b581] font-medium" : "text-[var(--foreground)]"}`}
                      onClick={() => {
                        setActiveProfile(profile);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeProfile?.id === profile.id ? "bg-[#43b581]" : "bg-[var(--muted-foreground)]"}`} />
                      <span className="truncate">{profile.name}</span>
                    </button>
                  ))}

                  <div className="border-t border-[var(--border)]">
                    {creating ? (
                      <div className="px-3 py-2 flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          className="flex-1 min-w-0 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                          placeholder="Nome do perfil"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateProfile();
                            if (e.key === "Escape") { setCreating(false); setNewName(""); }
                          }}
                        />
                        <button
                          type="button"
                          className="text-[#43b581] text-xs font-medium hover:underline"
                          onClick={handleCreateProfile}
                        >
                          Criar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors"
                        onClick={() => setCreating(true)}
                      >
                        <FiPlus size={13} />
                        Novo perfil
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <ThemeToggle />

        {/* Botão de sair */}
        <button
          type="button"
          title="Sair"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-[var(--muted-foreground)] hover:text-[#ed4245] hover:bg-[var(--surface-alt)] transition-colors"
        >
          <FiLogOut size={15} />
        </button>
      </div>
    </motion.nav>
  );
}
