import { SidebarProvider } from '@/components/ui/sidebar';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { MetadataCacheLoader } from '@/lib/category-cache';

export function ClientSidebarProvider({ children }) {
  const { isSidebarOpen, setSidebarOpen } = useDashboardStore();

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <MetadataCacheLoader />
      {children}
    </SidebarProvider>
  );
}
