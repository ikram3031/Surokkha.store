import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { SettingsSidebar } from '@/components/dashboard/settings-sidebar';
import { Header } from '@/components/dashboard/header';
import { ClientSidebarProvider } from '@/components/dashboard/client-sidebar-provider';
import { AuthGuard } from '@/components/auth-guard';
import { ClientThemeProvider } from '@/components/clientThemeProvider';

// Standalone workspace served at /settings with its own sidebar, separate from /dashboard
const SettingsLayout = () => {
  const mainRef = useRef(null);
  useScrollRestore(mainRef);

  return (
    <AuthGuard>
      <ClientThemeProvider>
        <ClientSidebarProvider>
          <SettingsSidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
            <Header />
            <main ref={mainRef} className="flex-1 overflow-y-auto bg-muted/20 min-w-0 p-2 sm:p-6">
              <div className="page-container">
                <Outlet />
              </div>
            </main>
          </div>
        </ClientSidebarProvider>
      </ClientThemeProvider>
    </AuthGuard>
  );
};

export default SettingsLayout;
