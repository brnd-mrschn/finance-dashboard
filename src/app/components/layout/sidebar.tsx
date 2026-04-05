export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-[#0f172a] border-r border-zinc-800 p-4">
      <h1 className="text-xl font-bold mb-6">Finance</h1>

      <nav className="space-y-2">
        <a href="/" className="block p-2 rounded hover:bg-zinc-800">
          Dashboard
        </a>
        <a href="/investments" className="block p-2 rounded hover:bg-zinc-800">
          Investimentos
        </a>
        <a href="/settings" className="block p-2 rounded hover:bg-zinc-800">
          Configurações
        </a>
      </nav>
    </aside>
  );
}