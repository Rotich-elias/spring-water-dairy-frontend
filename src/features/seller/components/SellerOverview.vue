<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  ArrowRight,
  Building2,
  CreditCard,
  Eye,
  Inbox,
  LayoutDashboard,
  Layers3,
} from "lucide-vue-next";
import { useSellerStore } from "@/stores/seller";

const emit = defineEmits<{ navigate: [tab: string] }>();
const { t, locale } = useI18n();
const seller = useSellerStore();

const stats = computed(() => [
  {
    labelKey: "seller.overview.farms",
    value: seller.dashboard?.farms,
    icon: Building2,
    tab: "farms",
  },
  {
    labelKey: "seller.overview.active_subscriptions",
    value: seller.dashboard?.active_subscriptions,
    icon: CreditCard,
    tab: "farms",
  },
  {
    labelKey: "seller.overview.plans",
    value: seller.dashboard?.plans,
    icon: Layers3,
    tab: "plans",
  },
  {
    labelKey: "seller.overview.new_inquiries",
    value: seller.dashboard?.new_inquiries,
    icon: Inbox,
    tab: "inquiries",
  },
  {
    labelKey: "seller.overview.impersonations",
    value: seller.dashboard?.impersonations,
    icon: Eye,
    tab: "farms",
  },
]);

const quickLinks = [
  { tab: "site", labelKey: "seller.tabs.site", icon: LayoutDashboard },
  { tab: "content", labelKey: "seller.tabs.content", icon: Layers3 },
  { tab: "plans", labelKey: "seller.tabs.plans", icon: CreditCard },
  { tab: "farms", labelKey: "seller.tabs.farms", icon: Building2 },
  { tab: "inquiries", labelKey: "seller.tabs.inquiries", icon: Inbox },
];

function labelOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return String((value as { name?: unknown }).name ?? "");
  }
  return "";
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="seller.loading && !seller.dashboard" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div v-for="n in 5" :key="n" class="card space-y-3">
        <div class="skeleton h-4 w-2/3"></div>
        <div class="skeleton h-8 w-1/2"></div>
      </div>
    </div>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <button
          v-for="stat in stats"
          :key="stat.labelKey"
          type="button"
          class="card card-hover text-left"
          @click="emit('navigate', stat.tab)"
        >
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <component :is="stat.icon" :size="19" />
          </span>
          <p class="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {{ Number(stat.value ?? 0).toLocaleString() }}
          </p>
          <p class="mt-1 text-xs font-medium text-slate-500">{{ t(stat.labelKey) }}</p>
        </button>
      </div>

      <div class="grid gap-5 lg:grid-cols-2">
        <section class="card">
          <h2 class="section-title">{{ t("seller.overview.quick_links") }}</h2>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="link in quickLinks"
              :key="link.tab"
              type="button"
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
              @click="emit('navigate', link.tab)"
            >
              <span class="flex items-center gap-2">
                <component :is="link.icon" :size="16" class="text-brand-700" />
                {{ t(link.labelKey) }}
              </span>
              <ArrowRight :size="15" class="text-slate-400" />
            </button>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">{{ t("seller.overview.impersonations") }}</h2>
          <p v-if="seller.impersonations.length === 0" class="text-sm text-slate-500">
            {{ t("common.empty") }}
          </p>
          <ul v-else class="space-y-2">
            <li
              v-for="item in seller.impersonations"
              :key="item.id"
              class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <span>
                <span class="font-semibold text-slate-900">{{ labelOf(item.user) || `#${item.id}` }}</span>
                <span class="text-slate-500"> · {{ labelOf(item.tenant) }}</span>
              </span>
              <span class="text-xs text-slate-500">
                {{ formatDate(item.expires_at) || formatDate(item.ended_at) }}
              </span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
