"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";
import { useProfile } from "@/lib/profile-context";
import { FiChevronDown, FiPlus, FiUser, FiLogOut, FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";

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

  // Estado para edição inline de perfil
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfileName, setEditingProfileName] = useState("");

  // Estado para modal de confirmação de exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCreating(false);
        setNewName("");
        setEditingProfileId(null);
        setEditingProfileName("");
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

  const handleStartEdit = (profile: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfileId(profile.id);
    setEditingProfileName(profile.name);
    setCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!editingProfileId) return;
    const name = editingProfileName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/profiles/${editingProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await reload();
        // Se o perfil editado é o ativo, atualiza o nome localmente
        if (activeProfile?.id === editingProfileId) {
          setActiveProfile({ ...activeProfile, name });
        }
      }
    } catch {
      // silencioso
    }
    setEditingProfileId(null);
    setEditingProfileName("");
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProfileId(null);
    setEditingProfileName("");
  };

  const handleDeleteProfile = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/profiles/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        // Se o perfil excluído era o ativo, muda para outro
        if (activeProfile?.id === deleteConfirm.id) {
          const remaining = profiles.filter((p) => p.id !== deleteConfirm.id);
          if (remaining.length > 0) setActiveProfile(remaining[0]);
        }
        await reload();
      }
    } catch {
      // silencioso
    }
    setDeleteConfirm(null);
    setDropdownOpen(false);
  };

  return (
    <>
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
          <ThemeToggle />

          {/* Seletor de perfil */}
          {!loading && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors"
                onClick={() => { setDropdownOpen((v) => !v); setCreating(false); setNewName(""); setEditingProfileId(null); }}
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
                    className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[210px] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)]">
                      Perfis
                    </div>

                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={`group flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-alt)] ${activeProfile?.id === profile.id ? "text-[#43b581] font-medium" : "text-[var(--foreground)]"}`}
                      >
                        {editingProfileId === profile.id ? (
                          // Modo edição inline
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              autoFocus
                              type="text"
                              className="flex-1 min-w-0 bg-transparent text-sm text-[var(--foreground)] outline-none border-b border-[var(--primary)] placeholder:text-[var(--muted-foreground)]"
                              value={editingProfileName}
                              onChange={(e) => setEditingProfileName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type="button"
                              title="Salvar"
                              className="text-[#43b581] hover:text-[#2b9260] flex-shrink-0"
                              onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                            >
                              <FiCheck size={13} />
                            </button>
                            <button
                              type="button"
                              title="Cancelar"
                              className="text-[var(--muted-foreground)] hover:text-[#ed4245] flex-shrink-0"
                              onClick={handleCancelEdit}
                            >
                              <FiX size={13} />
                            </button>
                          </div>
                        ) : (
                          // Modo visualização
                          <>
                            <button
                              type="button"
                              className="flex items-center flex-1 min-w-0 text-left"
                              onClick={() => { setActiveProfile(profile); setDropdownOpen(false); }}
                            >
                              <span className="truncate">{profile.name}</span>
                            </button>
                            {/* Ações: editar e excluir — visíveis no hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                type="button"
                                title="Renomear perfil"
                                className="p-0.5 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                                onClick={(e) => handleStartEdit(profile, e)}
                              >
                                <FiEdit2 size={11} />
                              </button>
                              <button
                                type="button"
                                title="Excluir perfil"
                                className="p-0.5 rounded text-[var(--muted-foreground)] hover:text-[#ed4245] hover:bg-[var(--border)] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({ id: profile.id, name: profile.name });
                                  setDropdownOpen(false);
                                }}
                              >
                                <FiTrash2 size={11} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
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

      {/* Modal de confirmação de exclusão de perfil */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#ed4245]/15 flex items-center justify-center">
                  <FiTrash2 size={16} className="text-[#ed4245]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Excluir perfil</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)] mb-5">
                Tem certeza que deseja excluir o perfil{" "}
                <span className="font-semibold">&ldquo;{deleteConfirm.name}&rdquo;</span>?
                Todos os dados associados (transações, categorias e origens) serão removidos permanentemente.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition-colors"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium bg-[#ed4245] text-white hover:bg-[#d63638] transition-colors"
                  onClick={handleDeleteProfile}
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
