import { Sidebar } from "@/app/components/layout/sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex bg-[#020617] text-white">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}