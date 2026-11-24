import { api, type ContactInquiry, type Plan, type SiteInfoPayload } from "@/api";

export interface SellerDashboard {
  farms: number;
  active_subscriptions: number;
  plans: number;
  new_inquiries: number;
  impersonations: number;
}

export interface SellerFarmUsage {
  animals: number;
  users: number;
  milk_records: number;
  alert_rules: number;
}

export interface SellerFarm {
  id: number;
  name: string;
  slug: string;
  status: string;
  owner_id: number;
  owner_name: string;
  owner_email: string;
  plan_code: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  subscription_canceled_at?: string | null;
  subscription_current_period_end?: string | null;
  usage: SellerFarmUsage;
  created_at: string;
}

export interface SellerFarmCreated {
  id: number;
  name: string;
  slug: string;
  status: string;
  owner_id?: number;
  temporary_password?: string;
}

export interface SellerImpersonation {
  id: number;
  expires_at: string;
  ended_at?: string | null;
  reason?: string | null;
  user?: { id: number; name: string; email?: string } | string;
  tenant?: { id: number; name: string; slug?: string } | string;
  [key: string]: unknown;
}

export interface ImpersonationResult {
  token: string;
  expires_at: string;
  impersonation_id: number;
  user: { id: number; name: string; email?: string };
  tenant: { id: number; name: string; slug?: string };
}

export type PlanInput = Pick<
  Plan,
  | "code"
  | "name"
  | "description"
  | "price_monthly"
  | "provider_price_id"
  | "limits"
  | "is_active"
  | "sort_order"
>;

export interface SellerInquiry extends ContactInquiry {
  [key: string]: unknown;
}

/** The API wraps mutating responses in `{ data }`; tolerate both shapes. */
function unwrap<T>(payload: unknown): T {
  const outer = payload as { data?: T } | null;
  return (outer && outer.data !== undefined ? outer.data : payload) as T;
}

export function getSellerDashboard(): Promise<SellerDashboard> {
  return api.get("/seller").then((r) => unwrap<SellerDashboard>(r.data));
}

export function getSellerSite(): Promise<SiteInfoPayload> {
  return api.get("/seller/site").then((r) => unwrap<SiteInfoPayload>(r.data));
}

export function patchSellerSite(payload: SiteInfoPayload): Promise<SiteInfoPayload> {
  return api.patch("/seller/site", payload).then((r) => unwrap<SiteInfoPayload>(r.data));
}

export function getSellerPlans(): Promise<Plan[]> {
  return api.get("/seller/plans").then((r) => unwrap<Plan[]>(r.data) ?? []);
}

export function createSellerPlan(payload: PlanInput): Promise<Plan> {
  return api.post("/seller/plans", payload).then((r) => unwrap<Plan>(r.data));
}

export function updateSellerPlan(id: number, payload: Partial<PlanInput>): Promise<Plan> {
  return api.patch(`/seller/plans/${id}`, payload).then((r) => unwrap<Plan>(r.data));
}

export interface SellerPlanDeleteResult extends Plan {
  deactivated: boolean;
}

export function deleteSellerPlan(id: number): Promise<SellerPlanDeleteResult> {
  return api.delete(`/seller/plans/${id}`).then((r) => ({
    ...unwrap<Plan>(r.data),
    deactivated: Boolean((r.data as { deactivated?: boolean }).deactivated),
  }));
}

export function getSellerFarms(): Promise<SellerFarm[]> {
  return api.get("/seller/farms").then((r) => unwrap<SellerFarm[]>(r.data) ?? []);
}

export function createSellerFarm(payload: {
  name: string;
  slug?: string;
  owner_email: string;
  plan_code?: string;
}): Promise<SellerFarmCreated> {
  return api.post("/seller/farms", payload).then((r) => unwrap<SellerFarmCreated>(r.data));
}

export function updateSellerFarm(
  id: number,
  payload: { name?: string; status?: string },
): Promise<SellerFarm> {
  return api.patch(`/seller/farms/${id}`, payload).then((r) => unwrap<SellerFarm>(r.data));
}

export function deleteSellerFarm(id: number): Promise<{ id: number; deleted: boolean }> {
  return api.delete(`/seller/farms/${id}`).then((r) => unwrap<{ id: number; deleted: boolean }>(r.data));
}

export function changeFarmPlan(id: number, plan_code: string): Promise<unknown> {
  return api.post(`/seller/farms/${id}/subscription`, { plan_code }).then((r) => r.data);
}

export function cancelFarmSubscription(id: number): Promise<unknown> {
  return api.post(`/seller/farms/${id}/subscription/cancel`).then((r) => r.data);
}

export function impersonateFarm(
  id: number,
  reason: string,
  userId?: number,
): Promise<ImpersonationResult> {
  return api
    .post(`/seller/farms/${id}/impersonate`, {
      reason,
      ...(userId ? { user_id: userId } : {}),
    })
    .then((r) => unwrap<ImpersonationResult>(r.data));
}

export function getImpersonations(): Promise<SellerImpersonation[]> {
  return api.get("/seller/impersonations").then((r) => unwrap<SellerImpersonation[]>(r.data) ?? []);
}

export function endImpersonation(id: number): Promise<unknown> {
  return api.post(`/seller/impersonations/${id}/end`).then((r) => r.data);
}

export function getInquiries(): Promise<SellerInquiry[]> {
  return api.get("/seller/inquiries").then((r) => unwrap<SellerInquiry[]>(r.data) ?? []);
}

export function getInquiry(id: number): Promise<SellerInquiry> {
  return api.get(`/seller/inquiries/${id}`).then((r) => unwrap<SellerInquiry>(r.data));
}

export function updateInquiry(id: number, status: string): Promise<SellerInquiry> {
  return api.patch(`/seller/inquiries/${id}`, { status }).then((r) => unwrap<SellerInquiry>(r.data));
}

export function deleteInquiry(id: number): Promise<unknown> {
  return api.delete(`/seller/inquiries/${id}`).then((r) => r.data);
}
