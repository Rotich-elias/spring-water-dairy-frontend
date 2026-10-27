import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { getFieldErrors } from "@/api";

export function useAuth() {
  const auth = useAuthStore();
  const loggingIn = ref(false);
  const error = ref<string | null>(null);

  async function login(loginId: string, password: string): Promise<boolean> {
    loggingIn.value = true;
    error.value = null;
    try {
      await auth.login(loginId, password);
      return true;
    } catch (e: any) {
      if (e.response?.status === 401) {
        error.value = e.response.data.error?.message ?? "Invalid email, phone or password.";
      } else if (!e.response) {
        error.value = "No connection. Please check your network and try again.";
      } else {
        error.value = e.response.data.error?.message ?? "Login failed. Please try again.";
      }
      return false;
    } finally {
      loggingIn.value = false;
    }
  }

  return { login, loggingIn, error };
}
