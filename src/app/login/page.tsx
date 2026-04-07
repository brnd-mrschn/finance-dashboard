"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#23272a] px-4">
      <div className="bg-[#313338] p-8 rounded-2xl shadow-lg border border-[#2c2f33] w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#7289da] mb-4">Autenticação desativada</h1>
        <p className="text-sm text-[#f2f3f5] mb-6">
          O login com Google foi desativado temporariamente para facilitar testes e deploy.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[#7289da] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#5b6fbe]"
        >
          Entrar no dashboard
        </Link>
      </div>
    </div>
  );
}
