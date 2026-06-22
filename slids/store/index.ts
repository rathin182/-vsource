import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/slids/services/auth.service";

export type UserRole = "admin" | "counselor";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;

}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const CREDS: Record<string, { password: string; user: AuthUser }> = {
  "admin@vsourcecrm.com": {
    password: "Admin@123",
    user: { id: "u1", name: "Vihaan Reddy", email: "admin@vsourcecrm.com", role: "admin" },
  },
  "counselor@vsourcecrm.com": {
    password: "Counselor@123",
    user: { id: "u2", name: "Sneha Kapoor", email: "counselor@vsourcecrm.com", role: "counselor" },
  },
};

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    try {
      set({ isLoading: true });

      const data = await authService.login(email, password);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { ok: true, user: data.user };
    } catch (error: any) {
      set({ isLoading: false });

      return {
        ok: false,
        error: error?.message ?? "Login failed",
        user: null,
      };
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      await authService.logout();
    } catch (error) {
      console.error(error);
    }

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

interface UiState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDark: () => void;
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      darkMode: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      toggleDark: () => {
        const v = !get().darkMode;
        if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", v);
        set({ darkMode: v });
      },
      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),
    }),
    { name: "vsource-ui" }
  )
);
