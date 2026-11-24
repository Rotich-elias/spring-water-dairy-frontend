/* Auto-generated API client placeholder.
   Per the API Contract (section 8), the frontend generates TypeScript
   types from docs/openapi.yaml. Until codegen is wired up, hand-written
   types live here and mirror the contract. These will be replaced by
   generated code in Phase 0 acceptance. */

export {
  api,
  API_BASE_URL,
  getFieldErrors,
  getErrorMessage,
  consumeSellerRestore,
  readImpersonation,
  restoreSellerSession,
  TOKEN_KEY,
  SELLER_TOKEN_KEY,
  IMPERSONATION_KEY,
  TENANT_KEY,
} from "./client";
export type { ApiError, ApiErrorResponse, ImpersonationMeta } from "./client";
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
  /** Set by the API for the platform buyer account. */
  is_platform_admin?: boolean;
  is_seller?: boolean;
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
  sort_order?: number;
  current?: boolean;
  deactivated?: boolean;
}

/** A landing-page row. The API accepts strings or flexible key/value objects. */
export type SiteItem = string | Record<string, unknown>;

export interface SiteInfo {
  platform_name: string;
  parent_company: string;
  parent_company_short: string;
  powered_by_label: string;
  parent_company_url: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  business_logo_path: string;
  hero_title: string;
  hero_subtitle: string;
  final_title: string;
  final_subtitle: string;
  feature_items: SiteItem[];
  step_items: SiteItem[];
  faq_items: SiteItem[];
  trust_items: SiteItem[];
}

export type SiteInfoPayload = Partial<SiteInfo>;

export interface ContactInquiry {
  id: number;
  name: string;
  farm_name: string | null;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  plan_id: number;
  status: string;
  trial_ends_at?: string | null;
  ends_at?: string | null;
  current_period_end?: string | null;
  canceled_at?: string | null;
  payment_status?: string;
  last_payment_at?: string | null;
  created_at?: string;
}

/** Manual, Platform Admin-approved paid-plan request. */
export interface PlanChangeRequest {
  id: number;
  tenant_id: number;
  tenant_name: string;
  plan_code: string;
  plan_name: string;
  current_plan_code?: string | null;
  current_plan_name?: string | null;
  requester_name?: string | null;
  status: "pending" | "invoiced" | "paid" | "approved" | "rejected" | "cancelled";
  amount: number;
  currency: string;
  note?: string | null;
  invoice_number?: string | null;
  invoiced_at?: string | null;
  payment_reference?: string | null;
  payment_date?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  approver_name?: string | null;
  approved_at?: string | null;
  canceled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BillingSummary {
  plan: Plan;
  subscribed_plan: Plan;
  subscription: Subscription | null;
  limits: Record<string, number | null>;
  usage: Record<string, number>;
  can_create: Record<string, boolean>;
  plan_request: PlanChangeRequest | null;
}
