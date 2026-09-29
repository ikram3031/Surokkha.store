import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useDashboardStore = create(
  persist(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Duplicate product draft — session only (tab close করলে চলে যাবে)
      duplicateDraft: null,
      setDuplicateDraft: (data) => set({ duplicateDraft: data }),
      clearDuplicateDraft: () => set({ duplicateDraft: null }),
    }),
    {
      name: 'dashboard-session-store',
      storage: createJSONStorage(() => sessionStorage),
      // শুধু duplicateDraft persist করা হবে, sidebar/search state নয়
      partialize: (state) => ({ duplicateDraft: state.duplicateDraft }),
    }
  )
);
