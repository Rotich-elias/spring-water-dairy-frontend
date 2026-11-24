import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  api,
  IMPERSONATION_KEY,
  SELLER_TOKEN_KEY,
  TENANT_KEY,
  TOKEN_KEY,
  type LoginResponse,
  type User,
} from "@/api";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY) ?? null);
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const permissions = computed(() => user.value?.permissions ?? []);
  const role = computed(() => user.value?.role ?? null);
  const isPlatformAdmin = computed(
    () => user.value?.is_platform_admin === true || role.value === "Platform Admin",
  );
  const isSeller = computed(
    () => user.value?.is_seller === true || isPlatformAdmin.value,
  );

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission);
  }

  function forgetImpersonation(): void {
    localStorage.removeItem(SELLER_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(TENANT_KEY);
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
    localStorage.setItem(TOKEN_KEY, data.token);
    forgetImpersonation();
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
      clear();
    }
  }

  function setToken(t: string, u: User): void {
    token.value = t;
    user.value = u;
    localStorage.setItem(TOKEN_KEY, t);
  }

  function clear(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    forgetImpersonation();
  }

  return {
    token,
    user,
    isAuthenticated,
    permissions,
    role,
    isPlatformAdmin,
    isSeller,
    hasPermission,
    login,
    fetchMe,
    logout,
    setToken,
    clear,
  };
});
