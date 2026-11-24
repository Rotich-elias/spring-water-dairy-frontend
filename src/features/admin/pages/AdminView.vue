<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface AdminCard {
  name: string;
  label: string;
  icon: string;
  permission?: string;
  platformAdmin?: boolean;
  descriptionKey?: string;
}

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const items: AdminCard[] = [
  {
    name: "admin.users",
    label: t("nav.users") || "Users",
    icon: "",
    permission: "users.view",
  },
  {
    name: "admin.settings",
    label: t("nav.settings") || "Settings",
    icon: "",
    permission: "settings.update",
  },
  {
    name: "admin.lookups",
    label: t("nav.lookups") || "Lookups",
    icon: "",
    permission: "lookups.view",
  },
  {
    name: "seller",
    label: t("nav.seller_console"),
    icon: "",
    platformAdmin: true,
    descriptionKey: "seller.quick_link_description",
  },
];

const canEnter = (item: AdminCard) =>
  (!item.permission || auth.hasPermission(item.permission)) &&
  (!item.platformAdmin || auth.isPlatformAdmin);

const visibleItems = computed(() => items.filter(canEnter));
</script>

<template>
  <div class="page p-6 max-w-4xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-900">{{ t("nav.admin") }}</h1>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.name"
        class="card cursor-pointer group"
        :class="{ 'opacity-50 pointer-events-none': !canEnter(item) }"
        @click="canEnter(item) && router.push({ name: item.name })"
      >
        <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
          {{ item.icon }}
        </div>
        <h3 class="mt-4 text-lg font-semibold text-slate-900">{{ item.label }}</h3>
        <p class="text-sm text-slate-500">
          {{ item.descriptionKey ? t(item.descriptionKey) : `Manage ${item.label.toLowerCase()}` }}
        </p>
      </div>
    </div>

    <div v-if="visibleItems.length === 0" class="mt-8 card">
      <p class="text-slate-500">{{ t("common.empty") }}</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-6 shadow-xl;
}
</style>
