<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useHealth, type SickBayEntry } from "@/features/health/api/health";

const { t } = useI18n();
const { getSickBay } = useHealth();

const entries = ref<SickBayEntry[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    entries.value = await getSickBay();
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
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Sick Bay</h1>
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
              Category
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Pen
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Milk Safe
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Meat Safe
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Days (Milk)
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Days (Meat)
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Drug
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="e in entries" :key="e.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ e.ear_tag }}</td>
            <td class="px-3 py-2 text-slate-600">{{ e.category || "—" }}</td>
            <td class="px-3 py-2 text-slate-600">{{ e.pen || "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ e.milk_safe_date || "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ e.meat_safe_date || "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ e.days_remaining_milk ?? "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ e.days_remaining_meat ?? "—" }}</td>
            <td class="px-3 py-2 text-slate-600">{{ e.drug_name || "—" }}</td>
          </tr>
          <tr v-if="entries.length === 0">
            <td colspan="8" class="px-3 py-6 text-center text-slate-500">
              No animals in withholding
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
