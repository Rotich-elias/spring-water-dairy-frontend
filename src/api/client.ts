import axios from "axios";
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

/* ------------------------------------------------------------------ */
/*  Base URL                                                          */
/* ------------------------------------------------------------------ */
/* The API base URL is configured via VITE_API_BASE_URL. Defaults to
   the same origin so the PWA works behind Nginx in production.      */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/* ------------------------------------------------------------------ */
/*  Error envelope (API Contract 2.1)                                 */
/* ------------------------------------------------------------------ */
export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  error: ApiError;
}

/* ------------------------------------------------------------------ */
/*  HTTP client                                                       */
/* ------------------------------------------------------------------ */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* Request interceptor: attach Bearer token from Pinia auth store.    */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("swd.token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* Response interceptor: normalize errors and handle 401/409/429.    */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const { response } = error;

    if (!response) {
      // Network error — queue write operations for later sync.
      const config = error.config as InternalAxiosRequestConfig;
      const method = (config?.method ?? "get").toLowerCase();
      const url = config?.url ?? "";
      const shouldQueue =
        ["post", "put", "patch", "delete"].includes(method) &&
        !url.includes("/auth/") &&
        !url.includes("/sync/");

      if (config && shouldQueue) {
        const { useOfflineStore } = await import("@/stores/offline");
        await useOfflineStore().queueFailedWrite({
          method: method as "post" | "put" | "patch" | "delete",
          url,
          body: config.data,
        });
      }
      return Promise.reject(error);
    }

    const { status } = response;
    const body = response.data as ApiErrorResponse | undefined;

    switch (status) {
      case 401:
        // Missing or expired token — clear session and redirect to login.
        localStorage.removeItem("swd.token");
        window.dispatchEvent(new Event("swd:unauthenticated"));
        break;
      case 409:
        // Conflict — caller reads error.fields / body to resolve.
        break;
      case 429:
        // Rate limited — caller can surface retry-after.
        break;
    }

    return Promise.reject(error);
  },
);

/* Helper to extract field errors from a 422 response.                */
export function getFieldErrors(
  error: unknown,
): Record<string, string[]> | undefined {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.error?.fields;
}
