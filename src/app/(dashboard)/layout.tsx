import { Topbar } from "@/app/components/layout/topbar";
import { usePathname } from "next/navigation";

export default function Layout({ children }) {
  // Detecta a rota atual para destacar o menu
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  return (
    <div className="min-h-screen bg-[#313338] text-white flex flex-col">
      <Topbar current={pathname} />
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}