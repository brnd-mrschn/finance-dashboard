"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="bg-[var(--surface)] p-8 rounded-lg shadow-lg border border-[var(--border)] w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Autenticação desativada</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          O login com Google foi desativado temporariamente para facilitar testes e deploy.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-[#30a46c] border border-[#3ecf8e] px-5 py-3 font-semibold text-white transition-all hover:bg-[#2b9260] hover:shadow-[0_0_8px_0_rgba(62,207,142,0.25)]"
        >
          Entrar no dashboard
        </Link>
      </div>
    </div>
  );
}
