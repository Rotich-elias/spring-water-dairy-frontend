<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useCalves, type CalfNurseryItem } from "@/features/calves/api/calves";

const { t } = useI18n();
const { getNursery } = useCalves();

const calves = ref<CalfNurseryItem[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    calves.value = await getNursery();
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

const flagColor = (flag: string) => {
  const colors: Record<string, string> = {
    behind_target: "text-safety-700 bg-safety-50 border-safety-200",
    due_for_weighing: "text-amber-700 bg-amber-50 border-amber-200",
    due_for_weaning: "text-teal-700 bg-teal-50 border-teal-200",
  };
  return colors[flag] || "text-slate-700 bg-slate-50 border-slate-200";
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Calf Nursery</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Ear Tag
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Age (Days)
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Latest Weight (kg)
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              ADG
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Flags
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="c in calves" :key="c.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ c.ear_tag }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ c.age_days ?? "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">
              {{ c.latest_weight !== undefined ? c.latest_weight.toFixed(1) : "—" }}
            </td>
            <td class="px-3 py-2 text-right text-slate-600">
              {{ c.adg !== undefined ? c.adg.toFixed(3) : "—" }}
            </td>
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="flag in c.flags"
                  :key="flag"
                  class="text-xs font-medium px-2 py-0.5 rounded"
                  :class="flagColor(flag)"
                >
                  {{ flag.replace(/_/g, " ") }}
                </span>
                <span v-if="c.flags.length === 0" class="text-xs text-slate-400">
                  —
                </span>
              </div>
            </td>
          </tr>
          <tr v-if="calves.length === 0">
            <td colspan="5" class="px-3 py-6 text-center text-slate-500">
              No calves in nursery
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
