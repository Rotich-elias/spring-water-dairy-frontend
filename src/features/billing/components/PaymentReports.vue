<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Download, RotateCcw, Search } from "lucide-vue-next";
import type { PlanChangeRequest } from "@/api";
import type {
  PaymentHistoryFilters,
  PaymentStatistics,
} from "@/features/billing/api/payments";

interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const props = withDefaults(
  defineProps<{
    statistics: PaymentStatistics | null;
    history: PlanChangeRequest[];
    meta: PaginationMeta | null;
    filters: PaymentHistoryFilters;
    scope: "farm" | "platform";
    loading?: boolean;
  }>(),
  { loading: false },
);

const emit = defineEmits<{
  "update:filters": [value: PaymentHistoryFilters];
  page: [value: number];
  download: [value: PlanChangeRequest];
}>();

const { t, locale } = useI18n();
const draft = ref<PaymentHistoryFilters>({ ...props.filters });

watch(
  () => props.filters,
  (value) => {
    draft.value = { ...value };
  },
  { deep: true },
);

const statuses = [
  "pending",
  "invoiced",
  "paid",
  "approved",
  "rejected",
  "cancelled",
] as const;

function apply(): void {
  const next: PaymentHistoryFilters = { page: 1, per_page: 15 };
  if (draft.value.status) next.status = draft.value.status;
  if (draft.value.plan_code) next.plan_code = draft.value.plan_code.trim();
  if (draft.value.tenant_id) next.tenant_id = draft.value.tenant_id;
  if (draft.value.from) next.from = draft.value.from;
  if (draft.value.to) next.to = draft.value.to;
  emit("update:filters", next);
}

function reset(): void {
  draft.value = {};
  emit("update:filters", { page: 1, per_page: 15 });
}

function money(value: number): string {
  return Number(value).toLocaleString(locale.value === "sw" ? "sw-KE" : "en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale.value === "sw" ? "sw-KE" : "en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: string): string {
  return t(`payments.status_${status}`);
}

function statusClass(status: string): string {
  return {
    approved: "badge-brand",
    paid: "badge-amber",
    invoiced: "badge-slate",
    pending: "badge-amber",
    rejected: "badge-safety",
    cancelled: "badge-slate",
  }[status] ?? "badge-slate";
}

const cards = computed(() => {
  const stats = props.statistics;
  const currency = stats?.currency ?? "KES";
  return [
    {
      labelKey: "payments.total_collected",
      value: stats ? `${currency} ${money(stats.total_collected)}` : "—",
    },
    {
      labelKey: "payments.payment_count",
      value: stats ? String(stats.payment_count) : "—",
    },
    {
      labelKey: "payments.average_payment",
      value: stats ? `${currency} ${money(stats.average_payment)}` : "—",
    },
    stats?.active_paid_farms === null || stats === null
      ? { labelKey: "payments.farms_with_payments", value: stats ? String(stats.farms_with_payments) : "—" }
      : { labelKey: "payments.active_paid_farms", value: String(stats.active_paid_farms) },
  ];
});

const maxMonthly = computed(() =>
  Math.max(1, ...(props.statistics?.monthly ?? []).map((point) => point.amount)),
);

function barHeight(amount: number): string {
  return `${Math.max(2, (amount / maxMonthly.value) * 100)}%`;
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-slate-500">
      {{ t(scope === "platform" ? "payments.scope_platform" : "payments.scope_farm") }}
    </p>

    <div v-if="loading && !statistics" class="card text-slate-500">
      {{ t("payments.loading") }}
    </div>

    <template v-if="statistics">
      <section>
        <h2 class="section-title">{{ t("payments.statistics") }}</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="card in cards" :key="card.labelKey" class="card">
            <p class="label">{{ t(card.labelKey) }}</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-brand-700">
              {{ card.value }}
            </p>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="section-title">{{ t("payments.monthly_revenue") }}</h2>
        <div class="flex h-48 items-end gap-2 border-b border-slate-200 pb-1 sm:gap-4">
          <div
            v-for="point in statistics.monthly"
            :key="point.month"
            class="flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <div
              class="w-full rounded-t bg-brand-600/80"
              :style="{ height: barHeight(point.amount) }"
              :title="`${point.label}: ${money(point.amount)} (${point.count})`"
            ></div>
          </div>
        </div>
        <div class="mt-2 flex gap-2 sm:gap-4">
          <p
            v-for="point in statistics.monthly"
            :key="point.month"
            class="min-w-0 flex-1 text-center text-xs text-slate-500"
          >
            {{ point.label }}
          </p>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-3">
        <div class="card">
          <h3 class="section-title">{{ t("payments.status_breakdown") }}</h3>
          <ul class="space-y-2 text-sm">
            <li
              v-for="row in statistics.status_breakdown"
              :key="row.status"
              class="flex items-center justify-between gap-2"
            >
              <span class="badge" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
              <span class="font-semibold tabular-nums">{{ row.count }}</span>
            </li>
          </ul>
        </div>

        <div class="card">
          <h3 class="section-title">{{ t("payments.by_plan") }}</h3>
          <p v-if="!statistics.by_plan.length" class="text-sm text-slate-500">
            {{ t("payments.empty") }}
          </p>
          <ul v-else class="space-y-2 text-sm">
            <li
              v-for="row in statistics.by_plan"
              :key="row.plan_code"
              class="flex items-center justify-between gap-2"
            >
              <span class="text-slate-700">{{ row.plan_name }}</span>
              <span class="font-semibold tabular-nums">
                {{ statistics.currency }} {{ money(row.amount) }}
              </span>
            </li>
          </ul>
          <p class="mt-3 text-xs text-slate-500">
            {{ t("payments.upgrades") }}: {{ statistics.upgrades }}
            <span class="mx-1">·</span>
            {{ t("payments.cancellations") }}: {{ statistics.cancellations }}
          </p>
        </div>

        <div v-if="scope === 'platform'" class="card">
          <h3 class="section-title">{{ t("payments.by_farm") }}</h3>
          <p v-if="!statistics.by_farm.length" class="text-sm text-slate-500">
            {{ t("payments.empty") }}
          </p>
          <ul v-else class="space-y-2 text-sm">
            <li
              v-for="row in statistics.by_farm"
              :key="row.tenant_id"
              class="flex items-center justify-between gap-2"
            >
              <span class="text-slate-700">{{ row.tenant_name }}</span>
              <span class="font-semibold tabular-nums">
                {{ statistics.currency }} {{ money(row.amount) }}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <section class="card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="section-title">{{ t("payments.history") }}</h2>
        <p v-if="meta" class="text-xs text-slate-500">
          {{ t("payments.page", { page: meta.page, total: meta.last_page }) }}
        </p>
      </div>

      <form class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent="apply">
        <label class="block">
          <span class="label">{{ t("common.status") }}</span>
          <select v-model="draft.status" class="input mt-1">
            <option value="">{{ t("payments.all_statuses") }}</option>
            <option v-for="status in statuses" :key="status" :value="status">
              {{ statusLabel(status) }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="label">{{ t("payments.plan_code") }}</span>
          <input v-model="draft.plan_code" class="input mt-1" type="text" maxlength="50" />
        </label>
        <label v-if="scope === 'platform'" class="block">
          <span class="label">{{ t("payments.farm_id") }}</span>
          <input v-model.number="draft.tenant_id" class="input mt-1" type="number" min="1" />
        </label>
        <label class="block">
          <span class="label">{{ t("payments.from") }}</span>
          <input v-model="draft.from" class="input mt-1" type="date" />
        </label>
        <label class="block">
          <span class="label">{{ t("payments.to") }}</span>
          <input v-model="draft.to" class="input mt-1" type="date" />
        </label>
        <div class="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" class="btn-primary btn-sm" :disabled="loading">
            <Search :size="14" />
            {{ t("payments.apply") }}
          </button>
          <button type="button" class="btn-outline btn-sm" @click="reset">
            <RotateCcw :size="14" />
            {{ t("payments.reset") }}
          </button>
        </div>
      </form>

      <p v-if="!history.length && !loading" class="mt-4 text-sm text-slate-500">
        {{ t("payments.empty") }}
      </p>

      <div v-else-if="history.length" class="table-wrap mt-4">
        <table class="data-table min-w-[880px]">
          <thead>
            <tr>
              <th>{{ t("payments.farm") }}</th>
              <th>{{ t("payments.plan") }}</th>
              <th>{{ t("payments.amount") }}</th>
              <th>{{ t("common.status") }}</th>
              <th>{{ t("payments.reference") }}</th>
              <th>{{ t("payments.payment_date") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in history" :key="request.id">
              <td>
                <p class="font-semibold text-slate-900">{{ request.tenant_name }}</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ formatDate(request.created_at) }}</p>
              </td>
              <td>
                <p class="font-medium text-slate-800">{{ request.plan_name }}</p>
                <p v-if="request.invoice_number" class="mt-0.5 text-xs text-slate-500">
                  {{ request.invoice_number }}
                </p>
              </td>
              <td class="whitespace-nowrap font-medium tabular-nums">
                {{ request.currency }} {{ money(request.amount) }}
              </td>
              <td>
                <span class="badge" :class="statusClass(request.status)">
                  {{ statusLabel(request.status) }}
                </span>
              </td>
              <td class="max-w-[180px] truncate">{{ request.payment_reference ?? "—" }}</td>
              <td class="whitespace-nowrap">{{ formatDate(request.payment_date) }}</td>
              <td>
                <button
                  v-if="request.invoice_number"
                  type="button"
                  class="btn-outline btn-sm"
                  @click="emit('download', request)"
                >
                  <Download :size="14" />
                  {{ t("payments.download") }}
                </button>
                <span v-else class="text-slate-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.last_page > 1" class="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          class="btn-outline btn-sm"
          :disabled="meta.page <= 1 || loading"
          @click="emit('page', meta.page - 1)"
        >
          {{ t("payments.previous") }}
        </button>
        <button
          type="button"
          class="btn-outline btn-sm"
          :disabled="meta.page >= meta.last_page || loading"
          @click="emit('page', meta.page + 1)"
        >
          {{ t("payments.next") }}
        </button>
      </div>
    </section>
  </div>
</template>
