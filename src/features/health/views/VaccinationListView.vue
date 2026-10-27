<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useHealth, type Vaccination } from "@/features/health/api/health";
import { useAuthStore } from "@/stores/auth";
import { createClientUuid } from "@/api";

const { t } = useI18n();
const auth = useAuthStore();
const { listVaccinations, createVaccination, deleteVaccination } = useHealth();

const vaccinations = ref<Vaccination[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);
const form = ref({
  client_uuid: "",
  animal_id: "",
  condition_id: "",
  vaccination_date: new Date().toISOString().slice(0, 16),
  vaccine_name: "",
  dose: "",
  route: "IM" as "IM" | "SC" | "Oral",
  next_due_date: "",
});
const formErrors = ref<Record<string, string[]>>({});
const canCreate = ref(auth.hasPermission("health.create"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    vaccinations.value = await listVaccinations({ per_page: 100 });
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
    await createVaccination({
      client_uuid: createClientUuid(),
      animal_id: form.value.animal_id ? Number(form.value.animal_id) : undefined,
      condition_id: form.value.condition_id ? Number(form.value.condition_id) : undefined,
      vaccination_date: form.value.vaccination_date,
      vaccine_name: form.value.vaccine_name,
      dose: form.value.dose,
      route: form.value.route,
      next_due_date: form.value.next_due_date,
    });
    showForm.value = false;
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      formErrors.value = e.response.data.error?.fields ?? {};
    } else {
      error.value = e.response?.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    saving.value = false;
  }
}

async function removeVaccination(id: number) {
  if (!window.confirm("Delete this vaccination record?")) return;
  try {
    await deleteVaccination(id);
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
      <h1 class="text-xl font-bold text-slate-900">Vaccinations</h1>
      <button
        v-if="canCreate"
        class="btn-primary"
        @click="showForm = true"
      >
        + Record Vaccination
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
              Vaccine
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Dose/Route
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Next Due
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="v in vaccinations" :key="v.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ v.animal_ear_tag }}</td>
            <td class="px-3 py-2 text-slate-600">{{ v.vaccination_date }}</td>
            <td class="px-3 py-2 text-slate-600">{{ v.vaccine_name }}</td>
            <td class="px-3 py-2 text-slate-600">{{ v.dose }} {{ v.route }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ v.next_due_date || "—" }}</td>
          </tr>
          <tr v-if="vaccinations.length === 0">
            <td colspan="5" class="px-3 py-6 text-center text-slate-500">
              No vaccination records
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Record Vaccination
      </h3>
      <form @submit.prevent="handleCreate" class="space-y-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="col-span-2 md:col-span-2">
          <label class="label">Animal ID</label>
          <input v-model="form.animal_id" type="number" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Condition ID</label>
          <input v-model="form.condition_id" type="number" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Vaccination Date</label>
          <input v-model="form.vaccination_date" type="date" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Vaccine Name</label>
          <input v-model="form.vaccine_name" type="text" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Dose</label>
          <input v-model="form.dose" type="text" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Route</label>
          <select v-model="form.route" class="input">
            <option value="IM">IM</option>
            <option value="SC">SC</option>
            <option value="Oral">Oral</option>
          </select>
        </div>
        <div class="md:col-span-1">
          <label class="label">Next Due Date</label>
          <input v-model="form.next_due_date" type="date" class="input" />
        </div>
        <div class="col-span-2">
          <p v-for="(msgs, field) in formErrors" :key="field" class="text-xs text-safety-600">
            {{ msgs.join(" ") }}
          </p>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn-outline" @click="showForm = false">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? "Saving…" : "Record Vaccination" }}
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