<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useCalves, type AnimalGrowth } from "@/features/calves/api/calves";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { animalGrowth } = useCalves();

const id = ref(Number(route.params.id));
const growth = ref<AnimalGrowth | null>(null);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    growth.value = await animalGrowth(id.value);
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

const dailyRecords = computed(() => growth.value?.series ?? []);

const chartDates = computed(() =>
  dailyRecords.value.map((d: any) => d.date)
);
const chartTotal = computed(() =>
  dailyRecords.value.map((d: any) => d.total ?? 0)
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

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <button
        class="btn-outline btn-sm"
        @click="$router.back"
        :aria-label="t('common.back')"
      >
        ←
      </button>
      <h1 class="text-xl font-bold text-slate-900 ml-3 inline">
        {{ growth?.ear_tag }} - Growth
      </h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else-if="growth" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-3">
          <div class="text-xs text-slate-500">Birth Weight</div>
          <div class="text-lg font-bold">
            {{ growth.birth_weight?.toFixed(1) ?? "—" }} kg
          </div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-slate-500">Overall ADG</div>
          <div class="text-lg font-bold">
            {{ growth.overall_adg?.toFixed(3) ?? "—" }} kg/day
          </div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-slate-500">Birth Date</div>
          <div class="text-lg font-bold">{{ growth.birth_date ?? "—" }}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Growth Chart
        </h3>
        <div class="h-64 w-full relative">
          <svg class="w-full h-full" viewBox="0 0 600 200">
            <defs>
              <linearGradient id="growthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(16,185,129,0.8);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(16,185,129,0.1);stop-opacity:1" />
              </linearGradient>
            </defs>
            <text x="20" y="20" class="text-xs text-slate-400" font-family="Inter">
              Weight (kg)
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
            <polyline :points="areaPoints" fill="url(#growthGrad)" stroke="none" />
            <text
              v-for="(d, i) in chartDates"
              :key="i"
              :x="40 + (i * 540 / Math.max(chartDates.length - 1, 1))"
              y="190"
              class="text-[10px] text-slate-400"
              text-anchor="middle"
            >
              {{ d.slice(5) }}
            </text>
          </svg>
          <p class="text-xs text-slate-500 mt-2">
            Green line = actual weight. Dashed = benchmark curve.
          </p>
        </div>
      </div>

      <div class="card overflow-x-auto">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Weight Records
        </h3>
        <table class="min-w-full divide-y divide-slate-100">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Date
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                Weight (kg)
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                ADG
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                On Target
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="s in dailyRecords" :key="s.date" class="text-sm">
              <td class="px-3 py-2 text-slate-700">{{ s.date }}</td>
              <td class="px-3 py-2 text-right text-slate-600">
                {{ s.weight_kg }}
              </td>
              <td class="px-3 py-2 text-right text-slate-600">
                {{ s.adg !== undefined ? s.adg.toFixed(3) : "—" }}
              </td>
              <td class="px-3 py-2 text-right text-slate-600">
                {{ s.on_target ? "Yes" : "No" }}
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
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
