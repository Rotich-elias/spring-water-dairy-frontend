<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getErrorMessage, type PlanChangeRequest } from "@/api";
import {
  getFarmPayments,
  type PaymentHistoryFilters,
  type PaymentHistoryResponse,
} from "@/features/billing/api/payments";
import { downloadPlanRequestInvoice } from "@/features/billing/api/planRequests";
import PaymentReports from "@/features/billing/components/PaymentReports.vue";

const { t } = useI18n();

const loading = ref(false);
const error = ref<string | null>(null);
const response = ref<PaymentHistoryResponse | null>(null);
const filters = ref<PaymentHistoryFilters>({ page: 1, per_page: 15 });

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    response.value = await getFarmPayments(filters.value);
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("payments.error"));
  } finally {
    loading.value = false;
  }
}

function updateFilters(value: PaymentHistoryFilters): void {
  filters.value = value;
  void load();
}

function goToPage(page: number): void {
  filters.value = { ...filters.value, page };
  void load();
}

async function download(request: PlanChangeRequest): Promise<void> {
  error.value = null;
  try {
    await downloadPlanRequestInvoice(
      `/billing/plan-requests/${request.id}/invoice`,
      `${request.invoice_number ?? "invoice"}.pdf`,
    );
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("payments.error"));
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page pb-14">
    <header class="page-header">
      <div>
        <p class="eyebrow">{{ t("app.powered_by") }}</p>
        <h1 class="page-title">{{ t("payments.title") }}</h1>
        <p class="page-subtitle">{{ t("payments.subtitle") }}</p>
      </div>
      <button type="button" class="btn-outline btn-sm" :disabled="loading" @click="load()">
        {{ t("common.refresh") }}
      </button>
    </header>

    <div v-if="error" class="alert-error mb-4" role="alert">{{ error }}</div>

    <PaymentReports
      :statistics="response?.statistics ?? null"
      :history="response?.data ?? []"
      :meta="response?.meta ?? null"
      :filters="filters"
      scope="farm"
      :loading="loading"
      @update:filters="updateFilters"
      @page="goToPage"
      @download="download"
    />
  </div>
</template>
