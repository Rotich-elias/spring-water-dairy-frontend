import axios from "axios";
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

/* ------------------------------------------------------------------ */
/*  Base URL                                                          */
/* ------------------------------------------------------------------ */
/* The API base URL is configured via VITE_API_BASE_URL. Defaults to
   the same origin so the PWA works behind Nginx in production.      */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/* ------------------------------------------------------------------ */
/*  Storage keys                                                      */
/* ------------------------------------------------------------------ */
export const TOKEN_KEY = "swd.token";
export const SELLER_TOKEN_KEY = "swd.seller_token";
export const IMPERSONATION_KEY = "swd.impersonation";

/** Metadata kept while a Platform Admin is viewing a farm as its owner. */
export interface ImpersonationMeta {
  id: number;
  expires_at: string;
  user: string;
  tenant: string;
}

export function readImpersonation(): ImpersonationMeta | null {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ImpersonationMeta>;
    if (!parsed || typeof parsed.id !== "number") return null;
    return {
      id: parsed.id,
      expires_at: String(parsed.expires_at ?? ""),
      user: String(parsed.user ?? ""),
      tenant: String(parsed.tenant ?? ""),
    };
  } catch {
    return null;
  }
}

let sellerRestorePending = false;

/** True once a 401 has switched an impersonated session back to the seller. */
export function consumeSellerRestore(): boolean {
  const pending = sellerRestorePending;
  sellerRestorePending = false;
  return pending;
}

/** Restore the Platform Admin token and forget the impersonation session. */
export function restoreSellerSession(): boolean {
  const sellerToken = localStorage.getItem(SELLER_TOKEN_KEY);
  if (!sellerToken) return false;
  localStorage.setItem(TOKEN_KEY, sellerToken);
  localStorage.removeItem(SELLER_TOKEN_KEY);
  localStorage.removeItem(IMPERSONATION_KEY);
  return true;
}

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

/** Endpoints that are platform-wide and must not carry a farm scope header. */
function isPlatformEndpoint(url: string): boolean {
  return (
    url.includes("/seller") ||
    url.includes("/site") ||
    url.includes("/plans") ||
    url.includes("/contact-inquiries")
  );
}

/* Request interceptor: attach Bearer token and active tenant header.  */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // The backend scopes every farm data request to the selected tenant.
    // Platform-wide endpoints (public site, seller console, inquiries) are
    // deliberately excluded so an impersonated farm never leaks into them.
    const tenantId = localStorage.getItem("swd.tenant_id");
    if (tenantId && !isPlatformEndpoint(config.url ?? "")) {
      config.headers["X-Tenant-ID"] = tenantId;
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
      // Network error — queue farm write operations for later sync. Seller
      // and public form writes must never be silently replayed.
      const config = error.config as InternalAxiosRequestConfig;
      const method = (config?.method ?? "get").toLowerCase();
      const url = config?.url ?? "";
      const shouldQueue =
        ["post", "put", "patch", "delete"].includes(method) &&
        !url.includes("/auth/") &&
        !url.includes("/sync/") &&
        !url.includes("/seller") &&
        !url.includes("/contact-inquiries");

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

    switch (status) {
      case 401: {
        // An impersonation token can expire independently of the seller
        // session. Put the seller back in their own console with a notice
        // instead of logging them out entirely.
        if (readImpersonation() && restoreSellerSession()) {
          sellerRestorePending = true;
          window.location.assign("/seller?notice=impersonation_ended");
          break;
        }
        // Missing or expired token — clear session and redirect to login.
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event("swd:unauthenticated"));
        break;
      }
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

/** Human-readable API message, with a safe fallback. */
export function getErrorMessage(error: unknown, fallback = "Request failed"): string {
  const err = error as AxiosError<ApiErrorResponse> & { message?: string };
  return err.response?.data?.error?.message ?? err.message ?? fallback;
}
