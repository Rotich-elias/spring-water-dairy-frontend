<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-vue-next";
import { getErrorMessage, type Plan } from "@/api";
import {
  cancelFarmSubscription,
  changeFarmPlan,
  createSellerFarm,
  deleteSellerFarm,
  impersonateFarm,
  resetFarmOwnerPassword,
  updateSellerFarm,
  type OwnerPasswordReset,
  type SellerFarm,
  type SellerFarmCreated,
} from "@/features/seller/api/seller";
import { useSellerStore } from "@/stores/seller";

const { t } = useI18n();
const seller = useSellerStore();

const form = reactive({
  name: "",
  slug: "",
  owner_email: "",
  plan_code: "",
  payment_reference: "",
  payment_date: "",
});
const creating = ref(false);
const createdFarm = ref<SellerFarmCreated | null>(null);
const resetResult = ref<OwnerPasswordReset | null>(null);
const notice = ref<string | null>(null);
const error = ref<string | null>(null);
const selectedPlan = reactive<Record<number, string>>({});
const impersonationTarget = ref<SellerFarm | null>(null);
const deleteTarget = ref<SellerFarm | null>(null);
const reason = ref("");
const working = ref(false);

const activePlans = computed(() => seller.plans.filter((plan) => plan.is_active));
const selectedStartingPlan = computed(
  () => seller.plans.find((plan) => plan.code === form.plan_code) ?? null,
);
const startingPlanIsPaid = computed(
  () => Number(selectedStartingPlan.value?.price_monthly ?? 0) > 0,
);

function syncPlanSelections(): void {
  for (const farm of seller.farms) {
    if (selectedPlan[farm.id] === undefined) {
      selectedPlan[farm.id] = farm.plan_code ?? activePlans.value[0]?.code ?? "";
    }
  }
}

function planFor(farm: SellerFarm): Plan | null {
  return seller.plans.find((plan) => plan.code === farm.plan_code) ?? null;
}

const usageKeys = [
  { key: "animals", labelKey: "seller.farms.usage_animals", limitKey: "animals" },
  { key: "users", labelKey: "seller.farms.usage_users", limitKey: "users" },
  { key: "milk_records", labelKey: "seller.farms.usage_milk", limitKey: "milk_records_per_month" },
  { key: "alert_rules", labelKey: "seller.farms.usage_alerts", limitKey: "alert_rules" },
] as const;

function usageRows(farm: SellerFarm) {
  const limits = planFor(farm)?.limits ?? {};
  return usageKeys.map((item) => {
    const used = Number(farm.usage?.[item.key] ?? 0);
    const limit = limits[item.limitKey];
    return {
      labelKey: item.labelKey,
      used,
      limit,
      percent: limit === null || limit === undefined || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100)),
    };
  });
}

function statusText(status: string): string {
  if (status === "active") return t("common.active");
  if (status === "suspended" || status === "inactive") return t("seller.farms.suspended");
  return status;
}

async function createFarm(): Promise<void> {
  creating.value = true;
  notice.value = null;
  error.value = null;
  createdFarm.value = null;
  resetResult.value = null;
  try {
    const result = await createSellerFarm({
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      owner_email: form.owner_email.trim(),
      plan_code: form.plan_code || undefined,
      ...(startingPlanIsPaid.value
        ? {
            payment_reference: form.payment_reference.trim(),
            payment_date: form.payment_date,
          }
        : {}),
    });
    createdFarm.value = result;
    notice.value = result.existing_owner
      ? "seller.farms.created_existing"
      : "seller.farms.created";
    form.name = "";
    form.slug = "";
    form.owner_email = "";
    form.plan_code = "";
    form.payment_reference = "";
    form.payment_date = "";
    await seller.loadFarms();
    syncPlanSelections();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    creating.value = false;
  }
}

async function copySecret(secret: string | null | undefined): Promise<void> {
  if (!secret) return;
  try {
    await navigator.clipboard.writeText(secret);
    notice.value = "seller.farms.copied";
  } catch {
    error.value = t("errors.unexpected");
  }
}

function copyCreatedPassword(): Promise<void> {
  return copySecret(createdFarm.value?.temporary_password);
}

function copyResetPassword(): Promise<void> {
  return copySecret(resetResult.value?.temporary_password);
}

async function resetOwnerPassword(farm: SellerFarm): Promise<void> {
  const owner = farm.owner_email || `#${farm.owner_id}`;
  if (!window.confirm(t("seller.farms.reset_confirm", { owner }))) return;

  working.value = true;
  notice.value = null;
  error.value = null;
  resetResult.value = null;
  try {
    resetResult.value = await resetFarmOwnerPassword(farm.id);
    notice.value = "seller.farms.password_reset";
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("seller.farms.reset_error"));
  } finally {
    working.value = false;
  }
}

async function changePlan(farm: SellerFarm): Promise<void> {
  const code = selectedPlan[farm.id] ?? "";
  if (!code || code === farm.plan_code) return;
  working.value = true;
  notice.value = null;
  error.value = null;
  try {
    await changeFarmPlan(farm.id, code);
    notice.value = "seller.farms.plan_changed";
    await seller.loadFarms();
    syncPlanSelections();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    working.value = false;
  }
}

async function cancelSubscription(farm: SellerFarm): Promise<void> {
  if (!window.confirm(t("billing.confirm_cancel"))) return;
  working.value = true;
  notice.value = null;
  error.value = null;
  try {
    await cancelFarmSubscription(farm.id);
    notice.value = "seller.farms.cancelled";
    await seller.loadFarms();
    syncPlanSelections();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    working.value = false;
  }
}

async function toggleStatus(farm: SellerFarm): Promise<void> {
  working.value = true;
  notice.value = null;
  error.value = null;
  try {
    await updateSellerFarm(farm.id, { status: farm.status === "active" ? "suspended" : "active" });
    notice.value = "seller.farms.status_updated";
    await seller.loadFarms();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    working.value = false;
  }
}

function openDelete(farm: SellerFarm): void {
  deleteTarget.value = farm;
  notice.value = null;
  error.value = null;
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value;
  if (!target) return;
  working.value = true;
  notice.value = null;
  error.value = null;
  try {
    await deleteSellerFarm(target.id);
    deleteTarget.value = null;
    notice.value = "seller.farms.deleted";
    await seller.loadFarms();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    working.value = false;
  }
}

function openImpersonation(farm: SellerFarm): void {
  impersonationTarget.value = farm;
  reason.value = "";
  notice.value = null;
  error.value = null;
}

async function confirmImpersonation(): Promise<void> {
  const target = impersonationTarget.value;
  if (!target) return;
  working.value = true;
  error.value = null;
  try {
    const result = await impersonateFarm(target.id, reason.value.trim(), target.owner_id);
    seller.beginImpersonation(result);
    window.location.assign("/dashboard");
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("seller.farms.impersonate_error"));
    working.value = false;
  }
}

onMounted(async () => {
  await Promise.allSettled([seller.loadFarms(), seller.loadPlans()]);
  syncPlanSelections();
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">{{ t("seller.farms.title") }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t("seller.farms.subtitle") }}</p>
    </div>

    <div v-if="notice" class="alert-success" role="status">
      <CheckCircle2 :size="16" class="mt-0.5 shrink-0" />
      <span>{{ t(notice) }}</span>
    </div>
    <div v-if="error || seller.error" class="alert-error" role="alert">
      {{ error ?? seller.error }}
    </div>

    <form class="card" @submit.prevent="createFarm">
      <h3 class="section-title">{{ t("seller.farms.new") }}</h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="label" for="farm-name">{{ t("seller.farms.name") }}</label>
          <input id="farm-name" v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label" for="farm-slug">{{ t("seller.farms.slug") }}</label>
          <input id="farm-slug" v-model="form.slug" class="input" />
        </div>
        <div>
          <label class="label" for="farm-owner">{{ t("seller.farms.owner_email") }}</label>
          <input id="farm-owner" v-model="form.owner_email" type="email" class="input" required />
        </div>
        <div>
          <label class="label" for="farm-plan">{{ t("seller.farms.plan") }}</label>
          <select id="farm-plan" v-model="form.plan_code" class="select">
            <option value="">{{ t("seller.farms.no_plan") }}</option>
            <option v-for="plan in activePlans" :key="plan.id" :value="plan.code">
              {{ plan.name }}
            </option>
          </select>
        </div>
        <div v-if="startingPlanIsPaid">
          <label class="label" for="farm-payment-reference">
            {{ t("seller.farms.payment_reference") }}
          </label>
          <input
            id="farm-payment-reference"
            v-model="form.payment_reference"
            class="input"
            :required="startingPlanIsPaid"
            :placeholder="t('seller.farms.payment_reference_placeholder')"
          />
        </div>
        <div v-if="startingPlanIsPaid">
          <label class="label" for="farm-payment-date">{{ t("seller.farms.payment_date") }}</label>
          <input
            id="farm-payment-date"
            v-model="form.payment_date"
            type="date"
            class="input"
            :required="startingPlanIsPaid"
          />
        </div>
      </div>
      <p v-if="startingPlanIsPaid" class="mt-3 text-xs text-slate-500">
        {{ t("seller.farms.paid_plan_notice") }}
      </p>
      <div class="mt-5 flex justify-end">
        <button type="submit" class="btn-primary btn-sm" :disabled="creating">
          <Loader2 v-if="creating" :size="15" class="animate-spin" />
          <Plus v-else :size="15" />
          {{ t("seller.farms.create") }}
        </button>
      </div>
    </form>

    <div v-if="createdFarm" class="alert-warning" role="status">
      <div class="flex-1">
        <p class="font-semibold">
          {{ t(createdFarm.existing_owner ? "seller.farms.created_existing" : "seller.farms.created") }}
          — {{ createdFarm.name }}
        </p>
        <p class="mt-1 text-xs">
          {{ t("seller.farms.owner_email") }}:
          <span class="font-semibold">{{ createdFarm.owner_email }}</span>
        </p>
        <p v-if="createdFarm.temporary_password" class="mt-1 text-xs">
          {{ t("seller.farms.temp_password") }}:
          <code class="rounded bg-white/70 px-1.5 py-0.5 font-bold">{{ createdFarm.temporary_password }}</code>
        </p>
      </div>
      <button
        v-if="createdFarm.temporary_password"
        type="button"
        class="btn-outline btn-sm"
        @click="copyCreatedPassword"
      >
        <Copy :size="14" />
        {{ t("seller.farms.copy") }}
      </button>
    </div>

    <div v-if="resetResult" class="alert-warning" role="status">
      <div class="flex-1">
        <p class="font-semibold">
          {{ t("seller.farms.password_reset_for", { owner: resetResult.owner_email }) }}
        </p>
        <p class="mt-1 text-xs">
          {{ t("seller.farms.temp_password") }}:
          <code class="rounded bg-white/70 px-1.5 py-0.5 font-bold">{{ resetResult.temporary_password }}</code>
        </p>
      </div>
      <button type="button" class="btn-outline btn-sm" @click="copyResetPassword">
        <Copy :size="14" />
        {{ t("seller.farms.copy") }}
      </button>
    </div>

    <div class="card">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h3 class="section-title mb-0">{{ t("nav.farms") }}</h3>
        <button type="button" class="btn-ghost btn-sm" @click="seller.loadFarms()">
          <RefreshCw :size="14" />
          {{ t("common.refresh") }}
        </button>
      </div>

      <p v-if="seller.farms.length === 0" class="text-sm text-slate-500">
        {{ t("seller.farms.empty") }}
      </p>
      <div v-else class="table-wrap">
        <table class="data-table min-w-[1080px]">
          <thead>
            <tr>
              <th>{{ t("seller.farms.table_farm") }}</th>
              <th>{{ t("seller.farms.table_owner") }}</th>
              <th>{{ t("seller.farms.table_plan") }}</th>
              <th>{{ t("seller.farms.table_status") }}</th>
              <th>{{ t("seller.farms.table_usage") }}</th>
              <th>{{ t("seller.farms.table_actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="farm in seller.farms" :key="farm.id">
              <td>
                <p class="font-semibold text-slate-900">{{ farm.name }}</p>
                <p class="text-xs text-slate-500">/{{ farm.slug }}</p>
              </td>
              <td>
                <p class="text-sm text-slate-800">{{ farm.owner_name || `#${farm.owner_id}` }}</p>
                <p class="text-xs text-slate-500">{{ farm.owner_email }}</p>
              </td>
              <td>
                <p class="text-sm font-medium text-slate-800">{{ farm.plan_name || t("seller.farms.no_plan") }}</p>
                <p class="text-xs text-slate-500">{{ farm.subscription_status || "—" }}</p>
                <p v-if="farm.subscription_canceled_at" class="text-xs font-medium text-amber-700">
                  {{ t("billing.cancel_scheduled") }}
                </p>
              </td>
              <td>
                <span class="badge" :class="farm.status === 'active' ? 'badge-brand' : 'badge-slate'">
                  {{ statusText(farm.status) }}
                </span>
              </td>
              <td>
                <div class="w-48 space-y-1.5">
                  <div v-for="usage in usageRows(farm)" :key="usage.labelKey">
                    <div class="flex justify-between gap-2 text-[11px] text-slate-500">
                      <span>{{ t(usage.labelKey) }}</span>
                      <span>
                        {{ usage.used }}
                        <template v-if="usage.limit !== null && usage.limit !== undefined">
                          {{ t("seller.farms.of") }} {{ usage.limit }}
                        </template>
                      </span>
                    </div>
                    <div class="h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div class="h-full rounded-full bg-brand-500" :style="{ width: `${usage.percent}%` }"></div>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex min-w-[260px] flex-col gap-2">
                  <div class="flex items-center gap-1.5">
                    <select
                      v-model="selectedPlan[farm.id]"
                      class="select min-h-0 flex-1 py-1.5 text-xs"
                      :aria-label="t('seller.farms.change_plan')"
                    >
                      <option v-for="plan in seller.plans" :key="plan.id" :value="plan.code">
                        {{ plan.name }}
                      </option>
                    </select>
                    <button
                      type="button"
                      class="btn-outline btn-sm"
                      :disabled="working"
                      @click="changePlan(farm)"
                    >
                      {{ t("seller.farms.change_plan") }}
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <button type="button" class="btn-ghost btn-sm" :disabled="working" @click="toggleStatus(farm)">
                      {{ t(farm.status === "active" ? "seller.farms.suspend" : "seller.farms.activate") }}
                    </button>
                    <button
                      v-if="
                        farm.subscription_status &&
                        farm.subscription_status !== 'cancelled' &&
                        !farm.subscription_canceled_at
                      "
                      type="button"
                      class="btn-ghost btn-sm text-safety-600"
                      :disabled="working"
                      @click="cancelSubscription(farm)"
                    >
                      {{ t("seller.farms.cancel_subscription") }}
                    </button>
                    <button
                      type="button"
                      class="btn-ghost btn-sm"
                      :disabled="working"
                      @click="resetOwnerPassword(farm)"
                    >
                      {{ t("seller.farms.reset_password") }}
                    </button>
                    <button type="button" class="btn-primary btn-sm" @click="openImpersonation(farm)">
                      <ExternalLink :size="13" />
                      {{ t("seller.farms.open_as_owner") }}
                    </button>
                    <button
                      type="button"
                      class="btn-danger btn-sm"
                      :disabled="working"
                      @click="openDelete(farm)"
                    >
                      <Trash2 :size="13" />
                      {{ t("seller.farms.delete") }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete farm dialog -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="card w-full max-w-md">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ t("seller.farms.delete") }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ deleteTarget.name }}</p>
          </div>
          <button
            type="button"
            class="icon-btn"
            :aria-label="t('common.cancel')"
            @click="deleteTarget = null"
          >
            <X :size="18" />
          </button>
        </div>
        <p class="mt-4 text-sm text-slate-600">
          {{ t("seller.farms.confirm_delete", { name: deleteTarget.name }) }}
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn-outline" @click="deleteTarget = null">
            {{ t("common.cancel") }}
          </button>
          <button type="button" class="btn-danger" :disabled="working" @click="confirmDelete">
            <Loader2 v-if="working" :size="16" class="animate-spin" />
            {{ t("seller.farms.delete") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Impersonation reason dialog -->
    <div
      v-if="impersonationTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="card w-full max-w-md">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">
              {{ t("seller.farms.open_as_owner") }}
            </h3>
            <p class="mt-1 text-sm text-slate-500">{{ impersonationTarget.name }}</p>
          </div>
          <button
            type="button"
            class="icon-btn"
            :aria-label="t('common.cancel')"
            @click="impersonationTarget = null"
          >
            <X :size="18" />
          </button>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="confirmImpersonation">
          <div>
            <label class="label" for="impersonation-reason">{{ t("seller.farms.reason") }}</label>
            <textarea
              id="impersonation-reason"
              v-model="reason"
              class="input min-h-[90px] resize-y"
              rows="3"
              :placeholder="t('seller.farms.reason_placeholder')"
              required
            ></textarea>
          </div>
          <div v-if="error" class="alert-error" role="alert">{{ error }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-outline" @click="impersonationTarget = null">
              {{ t("common.cancel") }}
            </button>
            <button type="submit" class="btn-primary" :disabled="working">
              <Loader2 v-if="working" :size="16" class="animate-spin" />
              {{ t("seller.farms.continue") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
