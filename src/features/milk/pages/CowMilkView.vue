<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useMilk } from "@/features/milk/api/milk";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const { animalMilk } = useMilk();
const settings = useSettingsStore();

const id = computed(() => Number(route.params.id));
const data = ref<any>(null);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await animalMilk(id.value);
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

const dailyRecords = computed(() => data.value?.daily_records ?? []);
const lactation = computed(() => data.value?.lactation?.current ?? null);

function formatLitres(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const litres = Number(value);
  return Number.isFinite(litres) ? litres.toFixed(1) : "—";
}

const chartDates = computed(() =>
  dailyRecords.value.map((d: any) => d.date)
);
const chartTotal = computed(() =>
  dailyRecords.value.map((d: any) => Number(d.total ?? 0))
);

const chartPoints = computed(() => {
  const vals = chartTotal.value;
  if (vals.length === 0) return "";
  const max = Math.max(...vals, 1);
  return vals
    .map((v: number, i: number) => {
      const x = 40 + (i * 540 / Math.max(vals.length - 1, 1));
      const y = 170 - (v / max) * 140;
      return `${x},${y}`;
    })
    .join(" ");
});

const areaPoints = computed(() => {
  const vals = chartTotal.value;
  if (vals.length === 0) return "";
  const max = Math.max(...vals, 1);
  const pts = vals
    .map((v: number, i: number) => {
      const x = 40 + (i * 540 / Math.max(vals.length - 1, 1));
      const y = 170 - (v / max) * 140;
      return `${x},${y}`;
    })
    .join(" ");
  return `40,170 ${pts} 580,170`;
});

onMounted(() => {
  void settings.load(true);
  void load();
});
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <button
          class="btn-outline btn-sm"
          @click="$router.back"
          :aria-label="t('common.back')"
        >
          ←
        </button>
        <h1 class="text-xl font-bold text-slate-900 ml-3 inline">
          {{ data?.ear_tag }} - Milk
        </h1>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else-if="data" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="card p-3">
          <div class="text-xs text-slate-500">DIM</div>
          <div class="text-lg font-bold">{{ data.days_in_milk ?? "—" }}</div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-slate-500">Lactation</div>
          <div class="text-lg font-bold">
            {{ lactation?.lactation_number ?? "—" }}
          </div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-slate-500">Total litres</div>
          <div class="text-lg font-bold">
            {{ formatLitres(lactation?.total_litres) }} L
          </div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-slate-500">Peak yield</div>
          <div class="text-lg font-bold">
            {{ formatLitres(lactation?.peak_yield) }} L
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Lactation curve
        </h3>
        <div class="h-64 w-full relative">
          <svg class="w-full h-full" viewBox="0 0 600 200">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(16,185,129,0.8);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(16,185,129,0.1);stop-opacity:1" />
              </linearGradient>
            </defs>
            <text x="20" y="20" class="text-xs text-slate-400" font-family="Inter">
              Litres
            </text>
            <line
              x1="40"
              y1="170"
              x2="580"
              y2="170"
              stroke="#94a3b8"
              stroke-width="1"
              stroke-dasharray="4"
            />
            <text x="44" y="165" class="text-[10px] text-slate-500">Benchmark</text>
            <polyline :points="chartPoints" fill="none" stroke="#10b981" stroke-width="2" />
            <polyline :points="areaPoints" fill="url(#grad)" stroke="none" />
            <text
              v-for="(d, i) in chartDates"
              :key="i"
              :x="40 + ((i as number) * 540 / Math.max((chartDates as any[]).length - 1, 1))"
              y="190"
              class="text-[10px] text-slate-400"
              text-anchor="middle"
            >
              {{ d.slice(5) }}
            </text>
          </svg>
        </div>
        <p class="text-xs text-slate-500 mt-2">
          Green line = daily total. Dashed = farm benchmark.
        </p>
      </div>

      <div class="card overflow-x-auto">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Daily records
        </h3>
        <table class="min-w-full divide-y divide-slate-100">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Date
              </th>
              <th
                v-for="option in settings.milkSessions"
                :key="option.key"
                class="px-3 py-2 text-right text-xs font-semibold text-slate-500"
              >
                {{ t(option.labelKey) }}
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in dailyRecords"
              :key="d.date"
              class="text-sm"
            >
              <td class="px-3 py-2 text-slate-700">{{ d.date }}</td>
              <td
                v-for="option in settings.milkSessions"
                :key="option.key"
                class="px-3 py-2 text-right text-slate-600"
              >
                {{ formatLitres(d[option.key]) }}
              </td>
              <td class="px-3 py-2 text-right font-medium">
                {{ formatLitres(d.total) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-3 shadow-sm;
}
</style>
