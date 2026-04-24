"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { Topbar } from "@/app/components/layout/topbar";
import { useAuthGuard } from "@/lib/useAuthGuard";

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

  // Redireciona para login se não autenticado (full reload, não client-side)
  useEffect(() => {
    if (authState === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [authState]);

  // Enquanto verifica autenticação, mostra tela de carregamento
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Topbar />
      <main className="flex-1 p-6 w-full">{children}</main>
    </div>
  );
}
