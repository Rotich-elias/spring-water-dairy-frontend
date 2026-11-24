import { defineStore } from "pinia";
import { ref } from "vue";
import { api, type BillingSummary, type Plan, type Tenant } from "@/api";
import { useSettingsStore } from "@/stores/settings";

const TENANT_KEY = "swd.tenant_id";

/** Read the API's `{ error: { message } }` envelope without trusting its shape. */
function apiMessage(e: unknown): string {
  const err = e as {
    response?: { data?: { error?: { message?: string } } };
  };
  return err.response?.data?.error?.message ?? "Request failed. Please try again.";
}

export const useTenantStore = defineStore("tenant", () => {
  const tenants = ref<Tenant[]>([]);
  const current = ref<Tenant | null>(null);
  const plans = ref<Plan[]>([]);
  const billing = ref<BillingSummary | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref("");

  /** Mark a tenant as active in state and persist it for the API interceptor. */
  function select(tenant: Tenant): void {
    localStorage.setItem(TENANT_KEY, String(tenant.id));
    tenants.value = tenants.value.map((item) => ({
      ...item,
      current: item.id === tenant.id,
    }));
    current.value = { ...tenant, current: true };
  }

  async function loadBilling(silent = false): Promise<void> {
    try {
      const response = await api.get<{ data: BillingSummary }>("/billing");
      billing.value = response.data.data;
    } catch (e) {
      // Billing is not available to every role — only surface the error when
      // the caller explicitly asked for billing data.
      if (!silent) error.value = apiMessage(e);
    }
  }

  async function loadPlans(silent = false): Promise<void> {
    try {
      const response = await api.get<{ data: Plan[] }>("/plans");
      plans.value = response.data.data ?? [];
    } catch (e) {
      if (!silent) error.value = apiMessage(e);
    }
  }

  async function load(): Promise<void> {
    loading.value = true;
    error.value = "";
    try {
      const response = await api.get<{ data: Tenant[] }>("/tenants");
      tenants.value = response.data.data ?? [];

      const storedId = localStorage.getItem(TENANT_KEY);
      const selected =
        tenants.value.find((tenant) => tenant.current) ??
        (storedId
          ? tenants.value.find((tenant) => String(tenant.id) === storedId)
          : undefined) ??
        tenants.value[0] ??
        null;

      if (selected) {
        select(selected);
      } else {
        current.value = null;
        localStorage.removeItem(TENANT_KEY);
      }
    } catch (e) {
      error.value = apiMessage(e);
    } finally {
      loading.value = false;
    }

    // These endpoints may be forbidden for non-billing roles; ignore failures
    // here so the farm list still loads.
    await Promise.all([loadPlans(true), loadBilling(true)]);
  }

  async function switchTo(id: number): Promise<void> {
    saving.value = true;
    error.value = "";
    try {
      const response = await api.post<{ data: Tenant; reload: true }>(
        `/tenants/${id}/switch`,
      );
      select(response.data.data);

      await useSettingsStore().load(true);

      // A full reload guarantees that every tenant-scoped in-memory cache
      // (settings, offline Dexie tables, query caches) is rebuilt against the
      // new farm instead of showing data from the previous tenant.
      window.location.assign("/");
    } catch (e) {
      error.value = apiMessage(e);
    } finally {
      saving.value = false;
    }
  }

  async function create(input: {
    name: string;
    slug?: string;
    plan_code?: string;
  }): Promise<Tenant | null> {
    saving.value = true;
    error.value = "";
    try {
      const response = await api.post<{ data: Tenant }>("/tenants", input);
      const created = response.data.data;
      await load();
      await switchTo(created.id);
      return created;
    } catch (e) {
      error.value = apiMessage(e);
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function subscribe(code: string): Promise<void> {
    saving.value = true;
    error.value = "";
    try {
      const response = await api.post<{ data: BillingSummary }>(
        "/billing/subscribe",
        { plan_code: code },
      );
      billing.value = response.data.data;
      plans.value = plans.value.map((plan) => ({
        ...plan,
        current: plan.code === billing.value?.plan?.code,
      }));
      await loadBilling();
    } catch (e) {
      error.value = apiMessage(e);
    } finally {
      saving.value = false;
    }
  }

  async function cancel(): Promise<void> {
    saving.value = true;
    error.value = "";
    try {
      const response = await api.post<{ data: BillingSummary }>(
        "/billing/cancel",
      );
      billing.value = response.data.data;
      await loadBilling();
    } catch (e) {
      error.value = apiMessage(e);
    } finally {
      saving.value = false;
    }
  }

  return {
    tenants,
    current,
    plans,
    billing,
    loading,
    saving,
    error,
    load,
    loadBilling,
    loadPlans,
    switchTo,
    create,
    subscribe,
    cancel,
  };
});
