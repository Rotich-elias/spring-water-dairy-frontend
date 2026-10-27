import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api, type LoginResponse, type User } from "@/api";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("swd.token") ?? null);
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const permissions = computed(() => user.value?.permissions ?? []);
  const role = computed(() => user.value?.role ?? null);

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission);
  }

  async function login(login: string, password: string): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse }>("/auth/login", {
      login,
      password,
      device_name: navigator.userAgent,
    });
    const data = response.data.data;
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem("swd.token", data.token);
    return data;
  }

  async function fetchMe(): Promise<User> {
    const response = await api.get<{ data: User }>("/auth/me");
    user.value = response.data.data;
    return response.data.data;
  }

  async function logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem("swd.token");
    }
  }

  function setToken(t: string, u: User): void {
    token.value = t;
    user.value = u;
    localStorage.setItem("swd.token", t);
  }

  function clear(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem("swd.token");
  }

  return {
    token,
    user,
    isAuthenticated,
    permissions,
    role,
    hasPermission,
    login,
    fetchMe,
    logout,
    setToken,
    clear,
  };
});
