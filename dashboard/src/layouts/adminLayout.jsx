import { Outlet } from 'react-router-dom';
import { AuthGuard } from '@/components/auth-guard';
import { AdminSidebar } from '@/components/dashboard/admin-sidebar';
import { Header } from '@/components/dashboard/header';
import { ClientThemeProvider } from '@/components/clientThemeProvider';
import { ClientSidebarProvider } from '@/components/dashboard/client-sidebar-provider';

const AdminLayout = ({ children }) => {
  return (
    <AuthGuard>
      <ClientThemeProvider>
        <ClientSidebarProvider>
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full" style={{ backgroundColor: 'var(--theme-bg, #f8fafc)' }}>
            <Header />
            <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6" style={{ backgroundColor: 'var(--theme-bg, #f8fafc)' }}>
              {children || <Outlet />}
            </main>
          </div>
        </ClientSidebarProvider>
      </ClientThemeProvider>
    </AuthGuard>
  );
}

export default AdminLayout;
