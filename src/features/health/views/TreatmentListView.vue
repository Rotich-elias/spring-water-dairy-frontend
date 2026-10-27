<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  useHealth,
  type Treatment,
} from "@/features/health/api/health";
import { useAuthStore } from "@/stores/auth";
import { createClientUuid } from "@/api";

const { t } = useI18n();
const auth = useAuthStore();
const { listTreatments, createTreatment, deleteTreatment } = useHealth();

const treatments = ref<Treatment[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);
const form = ref({
  client_uuid: "",
  animal_id: "",
  treatment_date: new Date().toISOString().slice(0, 16),
  condition_id: "",
  drug_name: "",
  dose: "",
  route: "IM" as "IM" | "IV" | "SC" | "Oral" | "Topical",
  milk_withholding_days: "",
  meat_withholding_days: "",
});
const formErrors = ref<Record<string, string[]>>({});
const canCreate = ref(auth.hasPermission("health.create"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    treatments.value = await listTreatments({ per_page: 100 });
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  saving.value = true;
  formErrors.value = {};
  try {
    await createTreatment({
      client_uuid: createClientUuid(),
      animal_id: Number(form.value.animal_id),
      treatment_date: form.value.treatment_date,
      condition_id: form.value.condition_id
        ? Number(form.value.condition_id)
        : undefined,
      drug_name: form.value.drug_name,
      dose: form.value.dose,
      route: form.value.route,
      milk_withholding_days:
        Number(form.value.milk_withholding_days) || 0,
      meat_withholding_days:
        Number(form.value.meat_withholding_days) || 0,
    });
    showForm.value = false;
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      formErrors.value = e.response.data.error?.fields ?? {};
    } else {
      error.value =
        e.response?.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    saving.value = false;
  }
}

async function removeTreatment(id: number) {
  if (!window.confirm("Delete this treatment record?")) return;
  try {
    await deleteTreatment(id);
    await load();
  } catch {
    error.value = t("errors.unexpected");
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Treatments</h1>
      <button
        v-if="canCreate"
        class="btn-primary"
        @click="showForm = true"
      >
        + Record Treatment
      </button>
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
              Animal
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Date
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Drug
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Dose/Route
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
          <tr v-for="t in treatments" :key="t.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">
              {{ t.animal_ear_tag }}
            </td>
            <td class="px-3 py-2 text-slate-600">
              {{ t.treatment_date }}
            </td>
            <td class="px-3 py-2 text-slate-600">
              {{ t.drug_name }}
            </td>
            <td class="px-3 py-2 text-slate-600">
              {{ t.dose }} {{ t.route }}
            </td>
            <td class="px-3 py-2 text-right text-slate-600">
              {{ t.milk_safe_date || "—" }}
            </td>
            <td class="px-3 py-2 text-right text-slate-600">
              {{ t.meat_safe_date || "—" }}
            </td>
          </tr>
          <tr v-if="treatments.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-slate-500">
              No treatment records
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Record Treatment
      </h3>
      <form
        @submit.prevent="handleCreate"
        class="space-y-3 grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div class="col-span-2 md:col-span-2">
          <label class="label">Animal ID</label>
          <input
            v-model="form.animal_id"
            type="number"
            class="input"
            required
          />
        </div>
        <div class="md:col-span-1">
          <label class="label">Treatment Date</label>
          <input
            v-model="form.treatment_date"
            type="datetime-local"
            class="input"
            required
          />
        </div>
        <div class="md:col-span-1">
          <label class="label">Condition ID</label>
          <input v-model="form.condition_id" type="number" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Drug Name</label>
          <input v-model="form.drug_name" type="text" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Dose</label>
          <input v-model="form.dose" type="text" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Route</label>
          <select v-model="form.route" class="input">
            <option value="IM">IM</option>
            <option value="IV">IV</option>
            <option value="SC">SC</option>
            <option value="Oral">Oral</option>
            <option value="Topical">Topical</option>
          </select>
        </div>
        <div class="md:col-span-1">
          <label class="label">Milk Withholding (days)</label>
          <input
            v-model="form.milk_withholding_days"
            type="number"
            class="input"
          />
        </div>
        <div class="md:col-span-1">
          <label class="label">Meat Withholding (days)</label>
          <input
            v-model="form.meat_withholding_days"
            type="number"
            class="input"
          />
        </div>
        <div class="col-span-2">
          <p
            v-for="(msgs, field) in formErrors"
            :key="field"
            class="text-xs text-safety-600"
          >
            {{ msgs.join(" ") }}
          </p>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn-outline" @click="showForm = false">
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="saving"
            >
              {{ saving ? "Saving…" : "Record Treatment" }}
            </button>
          </div>
        </div>
      </form>
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