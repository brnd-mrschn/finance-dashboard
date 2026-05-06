"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-[var(--surface-alt)] ${className ?? ""}`}
    />
  );
}

/* ── Dashboard skeleton ─────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-0 font-sans text-[var(--foreground)]">
      {/* Filtros */}
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-end">
          <Skeleton className="h-14 w-full lg:w-[26rem] rounded-md" />
          <Skeleton className="h-14 w-14 rounded-lg" />
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>

      {/* Gráficos — linha de cima */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-[420px] rounded-lg" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>

      {/* Gráficos — linha de baixo */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-[420px] rounded-lg" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>

      {/* Gastos recentes */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-36" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── Finance skeleton ───────────────────────────────────────── */

export function FinanceSkeleton() {
  return (
    <div className="min-h-screen p-0 font-sans text-[var(--foreground)]">
      <Skeleton className="h-10 w-48 mb-6" />
      <Skeleton className="h-[440px] w-full rounded-lg" />
    </div>
  );
}

/* ── Data skeleton ──────────────────────────────────────────── */

export function DataSkeleton() {
  return (
    <div className="min-h-screen p-0 font-sans text-[var(--foreground)]">
      {/* Abas */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Barra de ações */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none" />
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-none border-t border-[var(--border)]" />
        ))}
      </div>
    </div>
  );
}
