import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  phone: string;
  role: string;
  tenantId: string;
}

interface AuthStore {
  user: AuthUser | null;
  _hasHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setHasHydrated: (v: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      _hasHydrated: false,
      setUser: (user) => set({ user }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      isAuthenticated: () => get().user !== null,
    }),
    {
      name: "uzmarket-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
