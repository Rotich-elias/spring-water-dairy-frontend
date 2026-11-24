<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  Building2,
  CreditCard,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  ReceiptText,
  RefreshCw,
  Settings2,
} from "lucide-vue-next";
import { useSellerStore } from "@/stores/seller";
import SellerOverview from "@/features/seller/components/SellerOverview.vue";
import SellerSiteForm from "@/features/seller/components/SellerSiteForm.vue";
import SellerContentForm from "@/features/seller/components/SellerContentForm.vue";
import SellerPlans from "@/features/seller/components/SellerPlans.vue";
import SellerPlanRequests from "@/features/seller/components/SellerPlanRequests.vue";
import SellerFarms from "@/features/seller/components/SellerFarms.vue";
import SellerInquiries from "@/features/seller/components/SellerInquiries.vue";

const { t } = useI18n();
const seller = useSellerStore();

const tabs = [
  { id: "overview", labelKey: "seller.tabs.overview", icon: LayoutDashboard },
  { id: "site", labelKey: "seller.tabs.site", icon: Settings2 },
  { id: "content", labelKey: "seller.tabs.content", icon: FileText },
  { id: "plans", labelKey: "seller.tabs.plans", icon: CreditCard },
  { id: "plan_requests", labelKey: "seller.tabs.plan_requests", icon: ReceiptText },
  { id: "farms", labelKey: "seller.tabs.farms", icon: Building2 },
  { id: "inquiries", labelKey: "seller.tabs.inquiries", icon: Inbox },
];

const activeTab = ref("overview");

function navigate(tab: string): void {
  activeTab.value = tab;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  void seller.refreshAll();
});
</script>

<template>
  <div class="page pb-14">
    <header class="page-header">
      <div>
        <p class="eyebrow">{{ t("app.powered_by") }}</p>
        <h1 class="page-title">{{ t("seller.title") }}</h1>
        <p class="page-subtitle">{{ t("seller.subtitle") }}</p>
      </div>
      <div class="toolbar">
        <button type="button" class="btn-outline btn-sm" @click="seller.refreshAll()">
          <RefreshCw :size="14" :class="seller.loading ? 'animate-spin' : ''" />
          {{ t("common.refresh") }}
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">
          <ExternalLink :size="14" />
          {{ t("seller.view_site") }}
        </a>
      </div>
    </header>

    <div v-if="seller.error" class="alert-error" role="alert">
      {{ seller.error }}
    </div>

    <nav class="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px" :aria-label="t('seller.title')">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition sm:px-4"
        :class="
          activeTab === tab.id
            ? 'border-brand-600 text-brand-800'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        "
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        @click="navigate(tab.id)"
      >
        <component :is="tab.icon" :size="16" />
        {{ t(tab.labelKey) }}
      </button>
    </nav>

    <SellerOverview v-if="activeTab === 'overview'" @navigate="navigate" />
    <SellerSiteForm v-else-if="activeTab === 'site'" />
    <SellerContentForm v-else-if="activeTab === 'content'" />
    <SellerPlans v-else-if="activeTab === 'plans'" />
    <SellerPlanRequests v-else-if="activeTab === 'plan_requests'" />
    <SellerFarms v-else-if="activeTab === 'farms'" />
    <SellerInquiries v-else />
  </div>
</template>
