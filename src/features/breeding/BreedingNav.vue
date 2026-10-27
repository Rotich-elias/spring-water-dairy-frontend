<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = [
  { name: "breeding", label: "Overview" },
  { name: "breeding.heats", label: "Heats" },
  { name: "breeding.services", label: "Services" },
  { name: "breeding.pregnancy-checks", label: "PD Checks" },
  { name: "breeding.calvings", label: "Calvings" },
  { name: "breeding.semen-straws", label: "Semen Straws" },
  { name: "breeding.calendar", label: "Calendar" },
  { name: "breeding.kpis", label: "KPIs" },
];
</script>

<template>
  <nav
    class="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto border-b border-slate-200 px-1 pb-2"
    aria-label="Breeding sections"
  >
    <router-link
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition"
      :class="
        route.name === tab.name
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      "
    >
      {{ tab.label }}
    </router-link>
  </nav>
</template>
