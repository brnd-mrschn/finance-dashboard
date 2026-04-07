"use client";

import { Topbar } from "@/app/components/layout/topbar";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Topbar />
      <main className="flex-1 p-6 w-full">{children}</main>
    </div>
  );
}