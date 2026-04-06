"use client";

import { Topbar } from "@/app/components/layout/topbar";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#313338] text-white flex flex-col">
      <Topbar />
      <main className="flex-1 p-6 w-full">{children}</main>
      <ThemeToggle />
    </div>
  );
}