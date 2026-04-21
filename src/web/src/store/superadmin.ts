import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SuperAdminUser {
  id: string;
  phone: string;
  role: string;
  tenantId: string;
}

interface SuperAdminStore {
  user: SuperAdminUser | null;
  _hasHydrated: boolean;
  setUser: (user: SuperAdminUser | null) => void;
  setHasHydrated: (v: boolean) => void;
  isAuthenticated: () => boolean;
  logout: () => void;
}

export const useSuperAdminStore = create<SuperAdminStore>()(
  persist(
    (set, get) => ({
      user: null,
      _hasHydrated: false,
      setUser: (user) => set({ user }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      isAuthenticated: () => get().user?.role === "SuperAdmin",
      logout: () => set({ user: null }),
    }),
    {
      name: "uzmarket-superadmin",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
