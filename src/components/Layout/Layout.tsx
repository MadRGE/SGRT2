import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  pageTitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export default function Layout({
  children,
  currentPath,
  onNavigate,
  pageTitle,
  primaryAction
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Fixed Left */}
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header - Fixed Top */}
        <Header
          pageTitle={pageTitle}
          primaryAction={primaryAction}
          onNotificationsClick={() => onNavigate('/notificaciones')}
        />

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
