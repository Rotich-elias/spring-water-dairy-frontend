/* Auto-generated API client placeholder.
   Per the API Contract (section 8), the frontend generates TypeScript
   types from docs/openapi.yaml. Until codegen is wired up, hand-written
   types live here and mirror the contract. These will be replaced by
   generated code in Phase 0 acceptance. */

export { api, API_BASE_URL, getFieldErrors } from "./client";
export type { ApiError, ApiErrorResponse } from "./client";
export { createClientUuid } from "./uuid";

/* Minimal shared types used before codegen is generated from openapi.yaml. */
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  permissions: string[];
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LookupRow {
  id: number;
  name: string;
  active: boolean;
  sort_order: number;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface SettingMap {
  [key: string]: string | number | boolean | any;
}
