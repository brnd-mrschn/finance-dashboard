<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Finance Dashboard — Diretrizes do Projeto

Dashboard de finanças pessoais em português brasileiro (pt-BR).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js **16.2.1** (App Router) — React **19.2.4** |
| Estilo | Tailwind CSS **4** + CSS variables para temas (dark/light) |
| Banco | PostgreSQL via **Prisma 7.6** (`@prisma/adapter-pg`) |
| Auth | Supabase Auth (`@supabase/auth-helpers-nextjs`) |
| Gráficos | ApexCharts (import dinâmico — SSR desabilitado) |
| Animações | Framer Motion |
| Ícones | Lucide React, React Icons |

## Arquitetura

```
src/
  app/
    layout.tsx             # Root layout (fontes, metadata)
    (dashboard)/           # Route group — layout com Topbar
      page.tsx             # Dashboard principal (resumo, gráficos, busca)
      finance/page.tsx     # Evolução do saldo
      data/page.tsx        # CRUD de transações
      settings/page.tsx    # Configurações (placeholder)
    (auth)/                # Route group — auth (vazio, em construção)
    login/page.tsx         # Login via Supabase Auth UI
    api/
      transactions/route.ts  # GET/POST transações
      categories/route.ts    # GET categorias
      auth-allow/route.ts    # Verificação de email autorizado
      ai/                    # (vazio, planejado)
      analytics/             # (vazio, planejado)
    components/
      layout/              # Sidebar, Topbar
      ui/                  # Card, DropdownFilter, ThemeToggle
  lib/
    db.ts                  # Instância Prisma (singleton)
    supabase.ts            # Cliente Supabase
    ai.ts                  # (planejado)
    useAuthGuard.ts        # Hook de proteção de rota client-side
  services/                # (vazio, planejado)
```

## Build & Dev

```bash
npm install              # Instala deps + roda prisma generate (postinstall)
npm run dev              # next dev --webpack
npm run build            # prisma generate && next build
npm run lint             # eslint
```

Variáveis de ambiente necessárias (`.env`):
- `DATABASE_URL` — conexão PostgreSQL (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client

Seed: `npx prisma db seed` (arquivo `prisma/seed.ts`)

## Convenções

### Idioma
- **Toda a UI é em pt-BR**: labels, mensagens, placeholders, comentários.
- Moeda formatada com `toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`.
- Datas com `toLocaleDateString("pt-BR")`.

### Componentes
- Páginas do dashboard são **Client Components** (`"use client"`).
- Bibliotecas de gráficos usam **`dynamic(() => import(...), { ssr: false })`** — nunca importe diretamente.
- Temas via CSS variables (`--background`, `--foreground`, `--surface`, `--surface-alt`, `--primary`, `--muted-foreground`). Não use cores Tailwind hardcoded exceto para verde (`#43b581`) e vermelho (`#ed4245`).

### API Routes
- Sempre com `export const runtime = "nodejs"` e `export const dynamic = "force-dynamic"`.
- Prisma importado dinamicamente: `const { prisma } = await import("@/lib/db")`.

### Prisma
- Schema em `prisma/schema.prisma`. Config em `prisma.config.ts`.
- Modelos: `User`, `Transaction`, `Category` com enum `TransactionType` (INCOME/EXPENSE).
- Após alterações no schema: `npx prisma migrate dev`.

### Path Alias
- `@/*` aponta para `./src/*` — sempre use para imports.

## Armadilhas Comuns

- **Next.js 16 breaking changes**: Consulte `node_modules/next/dist/docs/` antes de usar APIs.
- **ApexCharts + SSR**: Sempre importe com `dynamic(..., { ssr: false })`. Import direto causa erro de hidratação.
- **Prisma em API routes**: Use import dinâmico para evitar problemas de cold start.
- **Diretórios vazios**: `(auth)/`, `api/ai/`, `api/analytics/`, `services/` estão planejados mas não implementados ainda.
