<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ArrowUpRight, ShieldCheck, Stethoscope, Syringe } from "lucide-vue-next";

const { t } = useI18n();

const sections = [
  {
    name: "health.treatments",
    titleKey: "health.treatments",
    hintKey: "health.treatments_hint",
    icon: Syringe,
  },
  {
    name: "health.vaccinations",
    titleKey: "health.vaccinations",
    hintKey: "health.vaccinations_hint",
    icon: ShieldCheck,
  },
  {
    name: "health.sick-bay",
    titleKey: "health.sick_bay",
    hintKey: "health.sick_bay_hint",
    icon: Stethoscope,
  },
] as const;
</script>

<template>
  <div class="page p-4">
    <div class="mb-4">
      <h1 class="section-title">{{ t("nav.health") }}</h1>
      <p class="mt-1 text-sm text-slate-500">{{ t("health.subtitle") }}</p>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <router-link
        v-for="section in sections"
        :key="section.name"
        :to="{ name: section.name }"
        class="card card-hover flex items-start gap-3 p-4"
      >
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <component :is="section.icon" :size="19" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-slate-900">{{ t(section.titleKey) }}</span>
          <span class="mt-1 block text-xs leading-relaxed text-slate-500">{{ t(section.hintKey) }}</span>
        </span>
        <ArrowUpRight :size="15" class="mt-1 shrink-0 text-slate-300" />
      </router-link>
    </div>
  </div>
</template>
