import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        await new Promise((r) => setTimeout(r, 600));
        const entry = CREDS[email.toLowerCase()];
        if (!entry || entry.password !== password) return { ok: false, error: "Invalid credentials" };
        set({ user: entry.user, isAuthenticated: true });
        return { ok: true };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "vsource-auth" }
  )
);

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
