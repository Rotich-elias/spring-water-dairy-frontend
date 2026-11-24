<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getErrorMessage, type PlanChangeRequest } from "@/api";
import { downloadPlanRequestInvoice } from "@/features/billing/api/planRequests";
import PaymentReports from "@/features/billing/components/PaymentReports.vue";
import type { PaymentHistoryFilters } from "@/features/billing/api/payments";
import { useSellerStore } from "@/stores/seller";

const { t } = useI18n();
const seller = useSellerStore();

const error = computed(() => seller.error);
const filters = computed(() => seller.paymentFilters);
const response = computed(() => seller.payments);

function updateFilters(value: PaymentHistoryFilters): void {
  void seller.loadPayments(value);
}

function goToPage(page: number): void {
  void seller.loadPayments({ ...filters.value, page });
}

async function download(request: PlanChangeRequest): Promise<void> {
  try {
    await downloadPlanRequestInvoice(
      `/seller/plan-requests/${request.id}/invoice`,
      `${request.invoice_number ?? "invoice"}.pdf`,
    );
  } catch (e: unknown) {
    seller.setPaymentError(getErrorMessage(e, t("payments.error")));
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="alert-error" role="alert">{{ error }}</div>

    <PaymentReports
      :statistics="response?.statistics ?? null"
      :history="response?.data ?? []"
      :meta="response?.meta ?? null"
      :filters="filters"
      scope="platform"
      :loading="seller.loading"
      @update:filters="updateFilters"
      @page="goToPage"
      @download="download"
    />
  </div>
</template>
