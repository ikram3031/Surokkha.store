import React, { useEffect, useRef } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { MetadataCacheLoader } from '@/lib/category-cache';

export function ClientSidebarProvider({ children }) {
  const isMobile = useIsMobile();
  const { isSidebarOpen, setSidebarOpen } = useDashboardStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  }, [isMobile, setSidebarOpen]);

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen} defaultOpen={!isMobile}>
      <MetadataCacheLoader />
      {children}
    </SidebarProvider>
  );
}
