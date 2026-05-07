"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { motion } from "framer-motion";
import { FiPlus, FiUser } from "react-icons/fi";
import { Topbar } from "@/app/components/layout/topbar";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { ProfileProvider, useProfile } from "@/lib/profile-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  const authState = useAuthGuard();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      infinite: false,
    });
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (authState === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [authState]);

  if (authState === "loading" || authState === "unauthenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#euro_loading)"/>
            <text x="16" y="22.5" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="sans-serif">€</text>
            <defs>
              <linearGradient id="euro_loading" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3ecf8e"/>
                <stop offset="1" stopColor="#2ba86c"/>
              </linearGradient>
            </defs>
          </svg>
          <p className="text-sm text-[var(--muted-foreground)]">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileProvider>
      <DashboardInner>{children}</DashboardInner>
    </ProfileProvider>
  );
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { profileError, activeProfile, loading, profiles, setActiveProfile, reload } = useProfile();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setCreating(false);
        setNewName("");
        reload();
      }
    } catch {
      /* silencioso */
    }
  };

  // Tela de seleção de perfil — exibida quando autenticado mas sem perfil ativo
  if (!loading && !activeProfile && !profileError) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <Topbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--surface-alt)] mb-4">
                <FiUser size={28} className="text-[var(--primary)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Escolha um perfil</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Selecione um perfil para começar ou crie um novo.
              </p>
            </div>

            {profiles.length > 0 && (
              <div className="space-y-2 mb-6">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setActiveProfile(profile)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-left transition-colors hover:bg-[var(--surface-alt)] hover:border-[var(--primary)]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[var(--foreground)]">{profile.name}</span>
                  </button>
                ))}
              </div>
            )}

            {creating ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome do perfil"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-lg bg-[var(--primary)] px-4 py-3 font-medium text-white transition-all hover:bg-[var(--primary-dark)]"
                >
                  Criar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <FiPlus size={16} />
                Novo perfil
              </button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Topbar />
      {profileError && (
        <div className="px-6 py-2 bg-[#ed4245]/10 border-b border-[#ed4245]/30 text-xs text-[#ed4245] font-mono break-all">
          ⚠️ Erro ao carregar perfil: {profileError}
        </div>
      )}
      <main className="flex-1 p-6 w-full">{children}</main>
    </div>
  );
}
