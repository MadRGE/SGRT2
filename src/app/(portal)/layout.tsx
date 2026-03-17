"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, FolderOpen, FileText, MessageSquare, LogOut } from "lucide-react";

const PORTAL_NAV = [
  { href: "/portal/gestiones", label: "Gestiones", icon: FolderOpen },
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/chat", label: "Chat", icon: MessageSquare },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="bg-regulatorio text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-regulatorio" />
            </div>
            <span className="font-semibold text-sm">Portal Cliente — SGRT</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-white/70 hover:text-white">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 pb-1">
          {PORTAL_NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs transition ${
                pathname.startsWith(item.href) ? "bg-bg-primary text-text-primary font-medium" : "text-white/70 hover:text-white"
              }`}>
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
