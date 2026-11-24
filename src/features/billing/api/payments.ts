import { api, type Paginated, type PlanChangeRequest } from "@/api";

export interface PaymentMonthlyPoint {
  month: string;
  label: string;
  count: number;
  amount_minor: number;
  amount: number;
}

export interface PaymentStatusCount {
  status: PlanChangeRequest["status"];
  count: number;
}

export interface PaymentPlanBreakdown {
  plan_code: string;
  plan_name: string;
  count: number;
  amount_minor: number;
  amount: number;
}

export interface PaymentFarmBreakdown {
  tenant_id: number;
  tenant_name: string;
  count: number;
  amount_minor: number;
  amount: number;
}

export interface PaymentStatistics {
  currency: string;
  total_collected_minor: number;
  total_collected: number;
  payment_count: number;
  average_payment: number;
  /** Platform-wide only; null in farm-scoped responses. */
  active_paid_farms: number | null;
  farms_with_payments: number;
  upgrades: number;
  cancellations: number;
  monthly: PaymentMonthlyPoint[];
  status_breakdown: PaymentStatusCount[];
  by_plan: PaymentPlanBreakdown[];
  by_farm: PaymentFarmBreakdown[];
}

export interface PaymentHistoryFilters {
  page?: number;
  per_page?: number;
  status?: string;
  plan_code?: string;
  tenant_id?: number;
  from?: string;
  to?: string;
}

export interface PaymentHistoryResponse extends Paginated<PlanChangeRequest> {
  statistics: PaymentStatistics;
}

function query(filters: PaymentHistoryFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params[key] = value;
  }
  return params;
}

/** Farm-scoped payment ledger; the active farm is supplied by the API client. */
export function getFarmPayments(
  filters: PaymentHistoryFilters = {},
): Promise<PaymentHistoryResponse> {
  return api
    .get<PaymentHistoryResponse>("/billing/payments", { params: query(filters) })
    .then((response) => response.data);
}

/** Platform-wide payment ledger; Platform Admin only. */
export function getSellerPayments(
  filters: PaymentHistoryFilters = {},
): Promise<PaymentHistoryResponse> {
  return api
    .get<PaymentHistoryResponse>("/seller/payments", { params: query(filters) })
    .then((response) => response.data);
}
