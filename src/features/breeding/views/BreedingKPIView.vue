<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useBreeding, type BreedingKPIs } from "@/features/breeding/api/breeding";
import BreedingNav from "@/features/breeding/BreedingNav.vue";

const { t } = useI18n();
const { getKPIs } = useBreeding();

const from = ref(new Date().toISOString().slice(0, 10));
const to = ref(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
const kpis = ref<BreedingKPIs | null>(null);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    kpis.value = await getKPIs(from.value, to.value);
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <BreedingNav />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Breeding KPIs</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-2">Conception Rate</h3>
        <div class="text-3xl font-bold text-teal-600">{{ kpis?.conception_rate ?? "--" }}%</div>
        <p class="text-xs text-slate-500 mt-1">Services resulting in pregnancy</p>
      </div>
      <div class="card p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-2">Services per Conception</h3>
        <div class="text-3xl font-bold text-teal-600">{{ kpis?.services_per_conception ?? "--" }}</div>
        <p class="text-xs text-slate-500 mt-1">Average services per pregnant cow</p>
      </div>
      <div class="card p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-2">Days Open</h3>
        <div class="text-3xl font-bold text-amber-600">{{ kpis?.days_open ?? "--" }}</div>
        <p class="text-xs text-slate-500 mt-1">Days from calving to conception</p>
      </div>
      <div class="card p-6">
        <h3 class="text-sm font-semibold text-slate-700 mb-2">Calving Interval</h3>
        <div class="text-3xl font-bold text-amber-600">{{ kpis?.calving_interval ?? "--" }}</div>
        <p class="text-xs text-slate-500 mt-1">Days between consecutive calvings</p>
      </div>
    </div>

    <div class="mt-6 card p-4">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Period
      </h3>
      <div class="flex gap-3">
        <div>
          <label class="label">From</label>
          <input v-model="from" type="date" class="input" @change="load" />
        </div>
        <div>
          <label class="label">To</label>
          <input v-model="to" type="date" class="input" @change="load" />
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
.label {
  @apply block text-xs font-medium text-slate-700 mb-1;
}
</style>
