import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
  onLogout: () => void;
}

export default function PortalClienteLayout({ children, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">SGT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Portal del Cliente</h1>
                <p className="text-xs text-slate-500">Sistema de Gestión de Trámites</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-sm text-slate-500">
            © 2025 SGT - Sistema de Gestión de Trámites Regulatorios
          </p>
        </div>
      </footer>
    </div>
  );
}
