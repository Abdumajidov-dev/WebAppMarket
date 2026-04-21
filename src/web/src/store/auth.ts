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
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: () => get().user !== null,
    }),
    { name: "uzmarket-auth" }
  )
);
