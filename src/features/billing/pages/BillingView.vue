<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getErrorMessage, type Plan } from "@/api";
import { downloadPlanRequestInvoice } from "@/features/billing/api/planRequests";
import { useAuthStore } from "@/stores/auth";
import { useTenantStore } from "@/stores/tenant";

const { t } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();

const canView = computed(() => auth.hasPermission("billing.view"));
const canManage = computed(() => auth.hasPermission("billing.manage"));

const plan = computed(() => tenantStore.billing?.plan ?? null);
const subscribedPlan = computed(() => tenantStore.billing?.subscribed_plan ?? null);
const subscription = computed(() => tenantStore.billing?.subscription ?? null);
const planRequest = computed(() => tenantStore.billing?.plan_request ?? null);
const paymentOverdue = computed(
  () => subscription.value?.payment_status?.toLowerCase() === "past_due",
);

const notice = ref<string | null>(null);
const actionError = ref<string | null>(null);
const requestTarget = ref<Plan | null>(null);
const requestNote = ref("");

const USAGE_KEYS = [
  "animals",
  "users",
  "milk_records_per_month",
  "alert_rules",
] as const;

const cancelScheduled = computed(() => {
  if (!subscription.value?.canceled_at) return false;
  const end = subscription.value.current_period_end;
  if (!end) return true;
  return Date.parse(end) > Date.now();
});

const subscriptionStatus = computed(() =>
  cancelScheduled.value
    ? t("billing.cancel_scheduled")
    : statusText(subscription.value?.status ?? ""),
);

const canCancel = computed(
  () =>
    canManage.value &&
    ["active", "trialing"].includes(
      subscription.value?.status?.toLowerCase() ?? "",
    ) &&
    !cancelScheduled.value,
);

function usageLabel(key: string): string {
  return t(`billing.${key}`);
}

function usageValue(key: string): number {
  return tenantStore.billing?.usage?.[key] ?? 0;
}

function limitFor(key: string): number | null {
  return tenantStore.billing?.limits?.[key] ?? null;
}

function usagePercent(key: string): number {
  const limit = limitFor(key);
  if (limit === null || limit <= 0) return 0;
  return Math.min(100, Math.max(0, (usageValue(key) / limit) * 100));
}

function usageText(key: string): string {
  const limit = limitFor(key);
  if (limit === null) {
    return `${usageValue(key)} / ${t("billing.unlimited")}`;
  }
  return `${usageValue(key)} / ${limit}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function statusText(status: string): string {
  const normalized = status.toLowerCase();
  if (["active", "trialing", "cancelled", "expired", "past_due"].includes(normalized)) {
    return t(`billing.${normalized}`);
  }
  return status;
}

function requestStatusText(status: string): string {
  return t(`billing.request_${status}`);
}

function requestNotice(): string {
  const request = planRequest.value;
  if (!request) return "";

  if (request.status === "invoiced" || request.status === "paid") {
    return t(`billing.request_${request.status}_notice`, {
      invoice: request.invoice_number ?? "—",
      plan: request.plan_name,
    });
  }

  return t("billing.request_pending_notice", { plan: request.plan_name });
}

function paymentStatusText(status?: string | null): string {
  const normalized = (status ?? "none").toLowerCase();
  if (["paid", "failed", "none", "processing"].includes(normalized)) {
    return t(`billing.${normalized}`);
  }
  return status ?? "—";
}

const endDate = computed(
  () =>
    subscription.value?.current_period_end ??
    subscription.value?.ends_at ??
    null,
);

function isCurrent(code: string): boolean {
  return plan.value?.code === code;
}

function limitSummary(limits: Record<string, number | null>): string {
  const entries = Object.entries(limits ?? {});
  if (!entries.length) return t("billing.no_limits");
  return entries
    .map(([key, limit]) => `${usageLabel(key)}: ${limit ?? "∞"}`)
    .join(" · ");
}

function price(monthly: number): string {
  return Number(monthly ?? 0).toFixed(2);
}

function selectPlan(option: Plan): void {
  if (isCurrent(option.code) || planRequest.value) return;
  notice.value = null;
  actionError.value = null;

  if (Number(option.price_monthly) > 0) {
    requestTarget.value = option;
    requestNote.value = "";
    return;
  }

  void subscribeTo(option.code);
}

async function subscribeTo(code: string): Promise<void> {
  if (await tenantStore.subscribe(code)) {
    notice.value = "billing.subscribe_success";
  } else {
    actionError.value = tenantStore.error || t("errors.unexpected");
  }
}

async function submitRequest(): Promise<void> {
  const target = requestTarget.value;
  if (!target) return;

  notice.value = null;
  actionError.value = null;

  if (await tenantStore.requestPlan(target.code, requestNote.value)) {
    requestTarget.value = null;
    notice.value = "billing.request_created";
  } else {
    actionError.value = tenantStore.error || t("errors.unexpected");
  }
}

async function cancelRequest(): Promise<void> {
  const request = planRequest.value;
  if (!request || !window.confirm(t("billing.request_cancel_confirm"))) return;

  notice.value = null;
  actionError.value = null;

  if (await tenantStore.cancelPlanRequest(request.id)) {
    notice.value = "billing.request_cancelled";
  } else {
    actionError.value = tenantStore.error || t("errors.unexpected");
  }
}

async function downloadInvoice(): Promise<void> {
  const request = planRequest.value;
  if (!request) return;

  actionError.value = null;
  const filename = request.invoice_number
    ? `${request.invoice_number.toLowerCase()}.pdf`
    : `invoice-${request.id}.pdf`;

  try {
    await downloadPlanRequestInvoice(
      `/billing/plan-requests/${request.id}/invoice`,
      filename,
    );
  } catch (e: unknown) {
    actionError.value = getErrorMessage(e, t("errors.unexpected"));
  }
}

async function cancelSubscription(): Promise<void> {
  if (!window.confirm(t("billing.confirm_cancel"))) return;
  notice.value = null;
  actionError.value = null;
  if (await tenantStore.cancel()) {
    notice.value = "billing.cancel_success";
  } else {
    actionError.value = tenantStore.error || t("errors.unexpected");
  }
}

onMounted(async () => {
  if (!canView.value) return;
  await tenantStore.load();
});
</script>

<template>
  <div class="page p-4 max-w-5xl">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("billing.title") }}</h1>
        <p class="page-subtitle">{{ t("billing.subtitle") }}</p>
      </div>
    </div>

    <div v-if="!canView" class="card">
      <p class="text-slate-500">{{ t("errors.forbidden") }}</p>
    </div>

    <template v-else>
      <p
        v-if="tenantStore.error"
        class="mb-4 rounded-lg border border-safety-200 bg-safety-50 p-3 text-sm text-safety-700"
      >
        {{ tenantStore.error }}
      </p>

      <p
        v-if="actionError"
        class="mb-4 rounded-lg border border-safety-200 bg-safety-50 p-3 text-sm text-safety-700"
        role="alert"
      >
        {{ actionError }}
      </p>

      <div v-if="notice" class="alert-success mb-4" role="status">
        {{ t(notice) }}
      </div>

      <div v-if="planRequest" class="alert-warning mb-4" role="status">
        <p class="font-semibold">{{ requestStatusText(planRequest.status) }}</p>
        <p class="mt-1 text-sm">{{ requestNotice() }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-if="planRequest.invoice_number"
            type="button"
            class="btn-outline btn-sm"
            @click="downloadInvoice"
          >
            {{ t("billing.download_invoice") }}
          </button>
          <button
            v-if="canManage"
            type="button"
            class="btn-outline btn-sm"
            :disabled="tenantStore.saving"
            @click="cancelRequest"
          >
            {{ t("billing.cancel_request") }}
          </button>
        </div>
      </div>

      <div v-if="paymentOverdue" class="alert-warning mb-4" role="status">
        {{
          t("billing.payment_failed_notice", {
            plan: subscribedPlan?.name ?? plan?.name ?? "",
            date: formatDate(endDate),
          })
        }}
      </div>

      <p v-if="tenantStore.loading && !tenantStore.billing" class="card text-slate-500">
        {{ t("common.loading") }}
      </p>

      <section class="card">
        <h2 class="section-title">{{ t("billing.current_plan") }}</h2>

        <template v-if="plan">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xl font-bold text-slate-900">{{ plan.name }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ plan.description }}</p>
              <p
                v-if="subscribedPlan && subscribedPlan.code !== plan.code"
                class="mt-2 text-xs font-medium text-amber-700"
              >
                {{
                  t("billing.fallback_notice", {
                    subscribed: subscribedPlan.name,
                    effective: plan.name,
                  })
                }}
              </p>
              <p v-if="cancelScheduled" class="mt-1 text-xs font-medium text-amber-700">
                {{ t("billing.cancel_scheduled_notice", { date: formatDate(endDate) }) }}
              </p>
            </div>
            <div class="text-right">
              <p class="label">{{ t("billing.price") }}</p>
              <p class="text-2xl font-bold text-brand-700">
                KES {{ price(plan.price_monthly) }}
              </p>
              <p class="text-xs text-slate-500">
                {{ t("billing.per_month") }}
              </p>
            </div>
          </div>

          <dl class="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt class="label">{{ t("billing.status") }}</dt>
              <dd class="font-semibold capitalize text-slate-800">
                <template v-if="subscription">
                  {{ subscriptionStatus }}
                </template>
                <template v-else>
                  {{ t("billing.no_subscription") }}
                </template>
              </dd>
            </div>
            <div>
              <dt class="label">{{ t("billing.trial_ends") }}</dt>
              <dd class="font-semibold text-slate-800">
                {{ formatDate(subscription?.trial_ends_at) }}
              </dd>
            </div>
            <div>
              <dt class="label">
                {{ cancelScheduled ? t("billing.ends_on") : t("billing.ends") }}
              </dt>
              <dd class="font-semibold text-slate-800">{{ formatDate(endDate) }}</dd>
            </div>
            <div>
              <dt class="label">{{ t("billing.payment_status") }}</dt>
              <dd class="font-semibold capitalize text-slate-800">
                {{ paymentStatusText(subscription?.payment_status) }}
              </dd>
            </div>
          </dl>

          <button
            v-if="canCancel"
            type="button"
            class="btn-outline mt-4"
            :disabled="tenantStore.saving"
            @click="cancelSubscription"
          >
            {{ t("billing.cancel") }}
          </button>
          <button
            v-else-if="cancelScheduled"
            type="button"
            class="btn-outline mt-4"
            disabled
          >
            {{ t("billing.cancel_scheduled") }}
          </button>
        </template>
        <p v-else class="text-sm text-slate-500">
          {{ t("billing.no_plan") }}
        </p>
      </section>

      <section v-if="tenantStore.billing" class="card mt-4">
        <h2 class="section-title">{{ t("billing.usage") }}</h2>
        <div class="space-y-4">
          <div v-for="key in USAGE_KEYS" :key="key">
            <div class="mb-1 flex items-center justify-between gap-3 text-sm">
              <span class="font-medium text-slate-700">{{ usageLabel(key) }}</span>
              <span class="tabular-nums text-slate-600">{{ usageText(key) }}</span>
            </div>
            <div
              class="h-2 w-full overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              :aria-label="usageLabel(key)"
              :aria-valuenow="usageValue(key)"
              aria-valuemin="0"
              :aria-valuemax="limitFor(key) ?? undefined"
            >
              <div
                class="h-full rounded-full bg-brand-700"
                :style="{ width: `${usagePercent(key)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="requestTarget" class="card mt-6">
        <h2 class="section-title">
          {{ t("billing.request_for", { plan: requestTarget.name }) }}
        </h2>
        <p class="mb-3 text-sm text-slate-500">{{ t("billing.request_hint") }}</p>
        <label class="label" for="plan-request-note">{{ t("billing.request_note") }}</label>
        <textarea
          id="plan-request-note"
          v-model="requestNote"
          class="input min-h-[80px]"
          rows="3"
          maxlength="1000"
        ></textarea>
        <div class="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" class="btn-outline" @click="requestTarget = null">
            {{ t("common.cancel") }}
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="tenantStore.saving"
            @click="submitRequest"
          >
            {{ t("billing.request_submit") }}
          </button>
        </div>
      </section>

      <section class="mt-6">
        <h2 class="section-title">{{ t("billing.limits") }}</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="option in tenantStore.plans"
            :key="option.id"
            class="card flex flex-col gap-3"
            :class="
              isCurrent(option.code)
                ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                : ''
            "
          >
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-lg font-semibold text-slate-900">{{ option.name }}</h3>
              <span v-if="isCurrent(option.code)" class="badge badge-brand">
                {{ t("billing.current") }}
              </span>
            </div>

            <p class="text-sm text-slate-500">{{ option.description }}</p>

            <p class="text-2xl font-bold text-brand-700">
              KES {{ price(option.price_monthly) }}
              <span class="text-xs font-normal text-slate-500">
                {{ t("billing.per_month") }}
              </span>
            </p>

            <p class="text-xs text-slate-600">{{ limitSummary(option.limits) }}</p>

            <button
              v-if="canManage"
              type="button"
              class="btn-primary mt-auto w-full"
              :disabled="
                tenantStore.saving ||
                isCurrent(option.code) ||
                planRequest !== null
              "
              @click="selectPlan(option)"
            >
              {{
                isCurrent(option.code)
                  ? t("billing.current")
                  : Number(option.price_monthly) > 0
                    ? t("billing.request_upgrade")
                    : t("billing.subscribe")
              }}
            </button>
          </div>
        </div>

        <p v-if="!tenantStore.plans.length && !tenantStore.loading" class="card mt-2 text-slate-500">
          {{ t("billing.no_plans") }}
        </p>
      </section>
    </template>
  </div>
</template>
