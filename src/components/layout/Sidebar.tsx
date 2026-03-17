"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale, LayoutDashboard, Users, FolderOpen, BookOpen,
  AlertTriangle, FileText, Settings, LogOut, Menu, X,
  ChevronRight, Stethoscope, UtensilsCrossed, Leaf, DollarSign,
  Shield, Bot,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/gestiones", label: "Gestiones", icon: FolderOpen },
  { href: "/tramites", label: "Catálogo", icon: BookOpen },
  { href: "/anmat", label: "ANMAT", icon: Stethoscope },
  { href: "/inal", label: "INAL", icon: UtensilsCrossed },
  { href: "/senasa", label: "SENASA", icon: Leaf },
  { href: "/vencimientos", label: "Vencimientos", icon: AlertTriangle },
  { href: "/finanzas", label: "Finanzas", icon: DollarSign },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/vigia-regulatorio", label: "Vigía", icon: Shield },
  { href: "/asistente-ia", label: "AI", icon: Bot },
  { href: "/configuracion", label: "Config", icon: Settings },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
          <Scale className="w-5 h-5 text-regulatorio" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">SGRT</h1>
            <p className="text-[10px] text-text-sidebar truncate">Trámites Regulatorios</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-white/10 text-text-sidebar-active font-medium"
                  : "text-text-sidebar hover:bg-white/5 hover:text-text-sidebar-active"
              }`}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-sidebar hover:bg-white/5 hover:text-red-300 w-full transition"
        >
          <LogOut className="w-4.5 h-4.5" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-bg-sidebar transition-all duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 right-0 translate-x-1/2 z-10 w-6 h-6 bg-bg-sidebar border-2 border-border rounded-full flex items-center justify-center hover:bg-regulatorio-light transition hidden md:flex"
          style={{ left: collapsed ? "52px" : "212px" }}
        >
          <ChevronRight className={`w-3 h-3 text-white transition ${collapsed ? "" : "rotate-180"}`} />
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-56 bg-bg-sidebar z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-4 bg-bg-card border-b border-border">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          <Scale className="w-5 h-5 text-regulatorio" />
          <span className="font-semibold text-sm">SGRT</span>
        </div>
        {children}
      </main>
    </div>
  );
}
