<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { CheckCircle2, Download, Loader2 } from "lucide-vue-next";
import { getErrorMessage, type PlanChangeRequest } from "@/api";
import { downloadPlanRequestInvoice } from "@/features/billing/api/planRequests";
import {
  approvePlanRequest,
  issuePlanRequestInvoice,
  markPlanRequestPaid,
  rejectPlanRequest,
} from "@/features/seller/api/seller";
import { useSellerStore } from "@/stores/seller";

const { t } = useI18n();
const seller = useSellerStore();

const FILTERS = ["", "pending", "invoiced", "paid", "approved", "rejected", "cancelled"];
const filter = ref("");
const notice = ref<string | null>(null);
const error = ref<string | null>(null);
const busyId = ref<number | null>(null);
const paidTarget = ref<PlanChangeRequest | null>(null);
const rejectTarget = ref<PlanChangeRequest | null>(null);
const paidForm = reactive({ payment_reference: "", payment_date: "" });
const rejectReason = ref("");

function localDateTime(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function statusLabel(status: string): string {
  return t(`seller.plan_requests.status_${status}`);
}

function statusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: "badge-amber",
    invoiced: "badge-slate",
    paid: "badge-amber",
    approved: "badge-brand",
    rejected: "badge-safety",
    cancelled: "badge-slate",
  };
  return classes[status] ?? "badge-slate";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

async function reload(): Promise<void> {
  notice.value = null;
  error.value = null;
  await seller.loadPlanRequests(filter.value || undefined);
  if (seller.error) {
    error.value = seller.error;
  }
}

async function run(
  request: PlanChangeRequest,
  action: () => Promise<unknown>,
  messageKey: string,
): Promise<boolean> {
  busyId.value = request.id;
  notice.value = null;
  error.value = null;
  try {
    await action();
    await seller.loadPlanRequests(filter.value || undefined);
    notice.value = messageKey;
    return true;
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
    return false;
  } finally {
    busyId.value = null;
  }
}

async function issue(request: PlanChangeRequest): Promise<void> {
  await run(
    request,
    () => issuePlanRequestInvoice(request.id),
    "seller.plan_requests.invoiced",
  );
}

function openPaid(request: PlanChangeRequest): void {
  paidTarget.value = request;
  paidForm.payment_reference = "";
  paidForm.payment_date = localDateTime();
  rejectTarget.value = null;
  notice.value = null;
  error.value = null;
}

async function savePaid(): Promise<void> {
  const request = paidTarget.value;
  if (!request) return;

  const date = new Date(paidForm.payment_date);
  if (Number.isNaN(date.getTime())) {
    error.value = t("seller.plan_requests.invalid_date");
    return;
  }

  const ok = await run(
    request,
    () =>
      markPlanRequestPaid(request.id, {
        payment_reference: paidForm.payment_reference.trim(),
        payment_date: date.toISOString(),
      }),
    "seller.plan_requests.payment_saved",
  );

  if (ok) {
    paidTarget.value = null;
  }
}

async function approve(request: PlanChangeRequest): Promise<void> {
  const confirmed = window.confirm(
    t("seller.plan_requests.approve_confirm", {
      farm: request.tenant_name,
      plan: request.plan_name,
    }),
  );
  if (!confirmed) return;

  await run(
    request,
    () => approvePlanRequest(request.id),
    "seller.plan_requests.approved",
  );
}

function openReject(request: PlanChangeRequest): void {
  rejectTarget.value = request;
  rejectReason.value = "";
  paidTarget.value = null;
  notice.value = null;
  error.value = null;
}

async function saveReject(): Promise<void> {
  const request = rejectTarget.value;
  if (!request) return;

  const ok = await run(
    request,
    () => rejectPlanRequest(request.id, rejectReason.value.trim()),
    "seller.plan_requests.rejected",
  );

  if (ok) {
    rejectTarget.value = null;
  }
}

async function download(request: PlanChangeRequest): Promise<void> {
  error.value = null;
  const filename = request.invoice_number
    ? `${request.invoice_number.toLowerCase()}.pdf`
    : `invoice-${request.id}.pdf`;

  try {
    await downloadPlanRequestInvoice(
      `/seller/plan-requests/${request.id}/invoice`,
      filename,
    );
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  }
}

onMounted(() => {
  void seller.loadPlanRequests();
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">
          {{ t("seller.plan_requests.title") }}
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ t("seller.plan_requests.subtitle") }}
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm">
        <span class="label mb-0">{{ t("seller.plan_requests.filter") }}</span>
        <select v-model="filter" class="input w-auto" @change="reload">
          <option v-for="option in FILTERS" :key="option" :value="option">
            {{ option ? statusLabel(option) : t("seller.plan_requests.all") }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="notice" class="alert-success" role="status">
      <CheckCircle2 :size="16" class="mt-0.5 shrink-0" />
      <span>{{ t(notice) }}</span>
    </div>
    <div v-if="error || seller.error" class="alert-error" role="alert">
      {{ error ?? seller.error }}
    </div>

    <form v-if="paidTarget" class="card space-y-4" @submit.prevent="savePaid">
      <h3 class="section-title">
        {{ t("seller.plan_requests.mark_paid_for", { farm: paidTarget.tenant_name }) }}
      </h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="payment-reference">
            {{ t("seller.plan_requests.payment_reference") }}
          </label>
          <input
            id="payment-reference"
            v-model="paidForm.payment_reference"
            class="input"
            maxlength="120"
            required
          />
        </div>
        <div>
          <label class="label" for="payment-date">
            {{ t("seller.plan_requests.payment_date") }}
          </label>
          <input
            id="payment-date"
            v-model="paidForm.payment_date"
            type="datetime-local"
            class="input"
            required
          />
        </div>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="btn-outline" @click="paidTarget = null">
          {{ t("common.cancel") }}
        </button>
        <button type="submit" class="btn-primary" :disabled="busyId !== null">
          <Loader2 v-if="busyId !== null" :size="16" class="animate-spin" />
          {{ t("seller.plan_requests.save_paid") }}
        </button>
      </div>
    </form>

    <form v-if="rejectTarget" class="card space-y-4" @submit.prevent="saveReject">
      <h3 class="section-title">
        {{ t("seller.plan_requests.reject_for", { farm: rejectTarget.tenant_name }) }}
      </h3>
      <div>
        <label class="label" for="reject-reason">
          {{ t("seller.plan_requests.reason") }}
        </label>
        <textarea
          id="reject-reason"
          v-model="rejectReason"
          class="input min-h-[80px]"
          rows="3"
          maxlength="1000"
          required
        ></textarea>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="btn-outline" @click="rejectTarget = null">
          {{ t("common.cancel") }}
        </button>
        <button type="submit" class="btn-primary" :disabled="busyId !== null">
          <Loader2 v-if="busyId !== null" :size="16" class="animate-spin" />
          {{ t("seller.plan_requests.confirm_reject") }}
        </button>
      </div>
    </form>

    <div class="card">
      <p v-if="seller.planRequests.length === 0" class="text-sm text-slate-500">
        {{ t("seller.plan_requests.empty") }}
      </p>
      <div v-else class="table-wrap">
        <table class="data-table min-w-[1040px]">
          <thead>
            <tr>
              <th>{{ t("seller.plan_requests.farm") }}</th>
              <th>{{ t("seller.plan_requests.plan") }}</th>
              <th>{{ t("seller.plan_requests.requested_by") }}</th>
              <th>{{ t("seller.plan_requests.amount") }}</th>
              <th>{{ t("common.status") }}</th>
              <th>{{ t("seller.plan_requests.invoice") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in seller.planRequests" :key="request.id">
              <td>
                <p class="font-semibold text-slate-900">{{ request.tenant_name }}</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ formatDate(request.created_at) }}
                </p>
                <p v-if="request.note" class="mt-1 max-w-xs text-xs text-slate-500">
                  {{ request.note }}
                </p>
              </td>
              <td>
                <p class="font-medium text-slate-800">{{ request.plan_name }}</p>
                <p v-if="request.current_plan_name" class="mt-0.5 text-xs text-slate-500">
                  {{ t("seller.plan_requests.from", { plan: request.current_plan_name }) }}
                </p>
              </td>
              <td>{{ request.requester_name ?? "—" }}</td>
              <td class="whitespace-nowrap font-medium">
                {{ request.currency }} {{ Number(request.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 }) }}
              </td>
              <td>
                <span class="badge" :class="statusClass(request.status)">
                  {{ statusLabel(request.status) }}
                </span>
                <p v-if="request.rejection_reason" class="mt-1 max-w-xs text-xs text-slate-500">
                  {{ request.rejection_reason }}
                </p>
              </td>
              <td>
                <template v-if="request.invoice_number">
                  <p class="font-medium text-slate-800">{{ request.invoice_number }}</p>
                  <p v-if="request.payment_reference" class="mt-0.5 text-xs text-slate-500">
                    {{ request.payment_reference }}
                  </p>
                  <p v-if="request.payment_date" class="mt-0.5 text-xs text-slate-500">
                    {{ formatDate(request.payment_date) }}
                  </p>
                </template>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-if="request.status === 'pending'"
                    type="button"
                    class="btn-ghost btn-sm"
                    :disabled="busyId !== null"
                    @click="issue(request)"
                  >
                    {{ t("seller.plan_requests.issue_invoice") }}
                  </button>
                  <button
                    v-if="request.invoice_number"
                    type="button"
                    class="btn-ghost btn-sm"
                    @click="download(request)"
                  >
                    <Download :size="14" />
                    {{ t("seller.plan_requests.download") }}
                  </button>
                  <button
                    v-if="request.status === 'invoiced'"
                    type="button"
                    class="btn-ghost btn-sm"
                    :disabled="busyId !== null"
                    @click="openPaid(request)"
                  >
                    {{ t("seller.plan_requests.mark_paid") }}
                  </button>
                  <button
                    v-if="request.status === 'paid'"
                    type="button"
                    class="btn-primary btn-sm"
                    :disabled="busyId !== null"
                    @click="approve(request)"
                  >
                    {{ t("seller.plan_requests.approve") }}
                  </button>
                  <button
                    v-if="['pending', 'invoiced', 'paid'].includes(request.status)"
                    type="button"
                    class="btn-ghost btn-sm text-safety-600"
                    :disabled="busyId !== null"
                    @click="openReject(request)"
                  >
                    {{ t("seller.plan_requests.reject") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
