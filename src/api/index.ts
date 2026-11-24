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

/* SaaS tenant / farm switching types (mirrors the backend contract). */
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  status: string;
  owner_id: number;
  current: boolean;
  role: string | null;
  is_owner: boolean;
  created_at: string;
}

export interface Plan {
  id: number;
  code: string;
  name: string;
  description: string;
  price_monthly: number;
  limits: Record<string, number | null>;
  is_active: boolean;
  current?: boolean;
}

export interface Subscription {
  id: number;
  plan_id: number;
  status: string;
  trial_ends_at?: string | null;
  ends_at?: string | null;
  current_period_end?: string | null;
  canceled_at?: string | null;
  created_at?: string;
}

export interface BillingSummary {
  plan: Plan;
  subscription: Subscription | null;
  limits: Record<string, number | null>;
  usage: Record<string, number>;
  can_create: Record<string, boolean>;
}
