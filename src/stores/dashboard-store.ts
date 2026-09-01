import { create } from "zustand";

interface DashboardState {
  sidebarCollapsed: boolean;
  activeCompanyId: string | null;
  toggleSidebar: () => void;
  setActiveCompany: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarCollapsed: false,
  activeCompanyId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveCompany: (id) => set({ activeCompanyId: id }),
}));
