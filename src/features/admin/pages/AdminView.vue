<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const items = [
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
];

const canEnter = (item: (typeof items)[number]) =>
  !item.permission || auth.hasPermission(item.permission);
</script>

<template>
  <div class="page p-6 max-w-4xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-900">{{ t("nav.admin") }}</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <p class="text-sm text-slate-500">Manage {{ item.label.toLowerCase() }}</p>
      </div>
    </div>

    <div v-if="!items.some((i) => canEnter(i))" class="mt-8 card">
      <p class="text-slate-500">No admin sections available for your role.</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-6 shadow-xl;
}
</style>
