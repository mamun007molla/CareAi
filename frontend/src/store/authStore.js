import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ user: null, token: null });
  },
  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const raw   = localStorage.getItem("user");
    if (token && raw) {
      try { set({ user: JSON.parse(raw), token }); } catch {}
    }
  },
}));

export default useAuthStore;
