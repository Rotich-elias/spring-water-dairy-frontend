<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useHealth, type AnimalHealth } from "@/features/health/api/health";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { getAnimalHealth } = useHealth();

const id = ref(Number(route.params.id));
const health = ref<AnimalHealth | null>(null);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    health.value = await getAnimalHealth(id.value);
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
      <button
        class="btn-outline btn-sm"
        @click="$router.back"
        :aria-label="t('common.back')"
      >
        ←
      </button>
      <h1 class="text-xl font-bold text-slate-900 ml-3 inline">
        Animal #{{ health?.animal_id }} — Health
      </h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else-if="health" class="space-y-4">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xl font-bold text-slate-900">{{ health.ear_tag }}</span>
          <span
            class="text-xs font-medium px-2 py-0.5 rounded"
            :class="{
              'text-safety-700 bg-safety-50': health.in_withholding,
              'text-teal-700 bg-teal-50': !health.in_withholding,
            }"
          >
            {{ health.in_withholding ? "IN WITHHOLDING" : "NOT IN WITHHOLDING" }}
          </span>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Treatments
        </h3>
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Date
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Condition
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Drug / Dose
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Route
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                Milk Safe
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                Meat Safe
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in health.treatments" :key="t.id" class="text-sm">
              <td class="px-3 py-2 text-slate-600">{{ t.treatment_date }}</td>
              <td class="px-3 py-2 text-slate-600">{{ t.condition || "—" }}</td>
              <td class="px-3 py-2 text-slate-600">{{ t.drug_name }} {{ t.dose }}</td>
              <td class="px-3 py-2 text-slate-600">{{ t.route }}</td>
              <td class="px-3 py-2 text-right text-slate-600">{{ t.milk_safe_date || "—" }}</td>
              <td class="px-3 py-2 text-right text-slate-600">{{ t.meat_safe_date || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Vaccinations
        </h3>
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Date
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Vaccine
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                Dose / Route
              </th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                Next Due
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="v in health.vaccinations" :key="v.id" class="text-sm">
              <td class="px-3 py-2 text-slate-600">{{ v.vaccination_date }}</td>
              <td class="px-3 py-2 text-slate-600">{{ v.vaccine_name }}</td>
              <td class="px-3 py-2 text-slate-600">{{ v.dose }} {{ v.route }}</td>
              <td class="px-3 py-2 text-right text-slate-600">{{ v.next_due_date || "—" }}</td>
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
