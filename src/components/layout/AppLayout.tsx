import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthenticatedSidebar } from './AuthenticatedSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  // Pages that don't need sidebar
  const noSidebarPages = ['/auth', '/docs', '/admin', '/admin/dashboard', '/settings'];
  const shouldShowSidebar = !noSidebarPages.some(page => location.pathname.startsWith(page));
  
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}