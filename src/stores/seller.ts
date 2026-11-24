import { defineStore } from "pinia";
import { ref } from "vue";
import {
  getErrorMessage,
  IMPERSONATION_KEY,
  readImpersonation,
  SELLER_TOKEN_KEY,
  TENANT_KEY,
  TOKEN_KEY,
  type Plan,
  type PlanChangeRequest,
  type SiteInfoPayload,
} from "@/api";
import {
  endImpersonation,
  getImpersonations,
  getInquiries,
  getSellerDashboard,
  getSellerFarms,
  getSellerPlanRequests,
  getSellerPlans,
  getSellerSite,
  patchSellerSite,
  type ImpersonationResult,
  type SellerDashboard,
  type SellerFarm,
  type SellerImpersonation,
  type SellerInquiry,
} from "@/features/seller/api/seller";

function nameOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return String((value as { name?: unknown }).name ?? "");
  }
  return "";
}

export const useSellerStore = defineStore("seller", () => {
  const dashboard = ref<SellerDashboard | null>(null);
  const site = ref<SiteInfoPayload>({});
  const plans = ref<Plan[]>([]);
  const planRequests = ref<PlanChangeRequest[]>([]);
  const farms = ref<SellerFarm[]>([]);
  const inquiries = ref<SellerInquiry[]>([]);
  const impersonations = ref<SellerImpersonation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function fail(e: unknown): void {
    error.value = getErrorMessage(e);
  }

  async function refreshAll(): Promise<void> {
    loading.value = true;
    error.value = null;
    await Promise.all([
      loadDashboard(),
      loadSite(),
      loadPlans(),
      loadPlanRequests(),
      loadFarms(),
      loadInquiries(),
      loadImpersonations(),
    ]);
    loading.value = false;
  }

  async function loadDashboard(): Promise<void> {
    try {
      dashboard.value = await getSellerDashboard();
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function loadSite(): Promise<void> {
    try {
      site.value = (await getSellerSite()) ?? {};
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function loadPlans(): Promise<void> {
    try {
      plans.value = await getSellerPlans();
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function loadPlanRequests(status?: string): Promise<void> {
    try {
      planRequests.value = await getSellerPlanRequests(status);
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function loadFarms(): Promise<void> {
    try {
      farms.value = await getSellerFarms();
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function loadInquiries(): Promise<void> {
    try {
      inquiries.value = await getInquiries();
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function loadImpersonations(): Promise<void> {
    try {
      impersonations.value = await getImpersonations();
    } catch (e: unknown) {
      fail(e);
    }
  }

  async function saveSite(payload: SiteInfoPayload): Promise<boolean> {
    error.value = null;
    try {
      site.value = { ...site.value, ...(await patchSellerSite(payload)) };
      return true;
    } catch (e: unknown) {
      fail(e);
      return false;
    }
  }

  /** Start "open farm as owner": swap tokens and hard-reload into the farm. */
  function beginImpersonation(result: ImpersonationResult): void {
    const sellerToken = localStorage.getItem(TOKEN_KEY);
    if (!sellerToken) {
      throw new Error("No seller session token available");
    }

    localStorage.setItem(SELLER_TOKEN_KEY, sellerToken);
    localStorage.setItem(
      IMPERSONATION_KEY,
      JSON.stringify({
        id: result.impersonation_id,
        expires_at: result.expires_at,
        user: nameOf(result.user),
        tenant: nameOf(result.tenant),
      }),
    );
    localStorage.setItem(TOKEN_KEY, result.token);
    // The impersonated user belongs to this farm, so make it the active
    // workspace immediately instead of inheriting a stale selection.
    localStorage.setItem(TENANT_KEY, String(result.tenant.id));
  }

  /** Return from an impersonated farm: restore the seller user, end the
   *  impersonation server-side, then reload the console. */
  async function returnToSellerConsole(): Promise<void> {
    const meta = readImpersonation();
    if (!meta) {
      window.location.assign("/seller");
      return;
    }

    const sellerToken = localStorage.getItem(SELLER_TOKEN_KEY);
    if (sellerToken) {
      localStorage.setItem(TOKEN_KEY, sellerToken);
    }

    try {
      await endImpersonation(meta.id);
    } catch {
      // Even if the server already expired the session, the local seller
      // token must be restored so the user is never stranded on the farm.
    } finally {
      localStorage.removeItem(SELLER_TOKEN_KEY);
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(TENANT_KEY);
    }

    window.location.assign("/seller?notice=impersonation_returned");
  }

  return {
    dashboard,
    site,
    plans,
    planRequests,
    farms,
    inquiries,
    impersonations,
    loading,
    error,
    refreshAll,
    loadDashboard,
    loadSite,
    loadPlans,
    loadPlanRequests,
    loadFarms,
    loadInquiries,
    loadImpersonations,
    saveSite,
    beginImpersonation,
    returnToSellerConsole,
  };
});
