import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { InventorySidebar } from '@/components/dashboard/inventory-sidebar';
import { Header } from '@/components/dashboard/header';
import { ClientSidebarProvider } from '@/components/dashboard/client-sidebar-provider';
import { AuthGuard } from '@/components/auth-guard';
import { ClientThemeProvider } from '@/components/clientThemeProvider';
import RoleGuard from '@/components/RoleGuard';

// Standalone workspace served at /inventory: unit-level stock, separate from website products
const InventoryLayout = () => {
  const mainRef = useRef(null);
  useScrollRestore(mainRef);

  return (
    <AuthGuard>
      <ClientThemeProvider>
        <ClientSidebarProvider>
          <InventorySidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
            <Header />
            <main ref={mainRef} className="flex-1 overflow-y-auto bg-muted/20 min-w-0 p-2 sm:p-6">
              <div className="page-container">
                <RoleGuard menuKey="inventory">
                  <Outlet />
                </RoleGuard>
              </div>
            </main>
          </div>
        </ClientSidebarProvider>
      </ClientThemeProvider>
    </AuthGuard>
  );
};

export default InventoryLayout;
