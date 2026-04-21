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
  setUser: (user: SuperAdminUser | null) => void;
  isAuthenticated: () => boolean;
  logout: () => void;
}

export const useSuperAdminStore = create<SuperAdminStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: () => get().user?.role === "SuperAdmin",
      logout: () => set({ user: null }),
    }),
    { name: "uzmarket-superadmin" }
  )
);
