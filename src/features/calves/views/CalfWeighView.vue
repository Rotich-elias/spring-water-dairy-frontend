<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useCalves, type Weight } from "@/features/calves/api/calves";
import { createClientUuid } from "@/api";

const { t } = useI18n();
const { listWeights, createWeight } = useCalves();

const weights = ref<Weight[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);
const form = ref<{
  client_uuid: string;
  animal_id: string;
  weight_date: string;
  weight_kg: string;
}>({
  client_uuid: "",
  animal_id: "",
  weight_date: new Date().toISOString().slice(0, 10),
  weight_kg: "",
});
const formErrors = ref<Record<string, string[]>>({});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    weights.value = await listWeights({ per_page: 100 });
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
    await createWeight({
      client_uuid: createClientUuid(),
      animal_id: Number(form.value.animal_id),
      weight_date: form.value.weight_date,
      weight_kg: Number(form.value.weight_kg),
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

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Calf Weights</h1>
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
              Weight Date
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Weight (kg)
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              ADG
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              On Target
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="w in weights" :key="w.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ w.animal_ear_tag }}</td>
            <td class="px-3 py-2 text-slate-600">{{ w.weight_date }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ w.weight_kg }}</td>
            <td class="px-3 py-2 text-right text-slate-600">
              {{ w.adg !== null && w.adg !== undefined ? w.adg.toFixed(3) : "—" }}
            </td>
            <td class="px-3 py-2 text-right text-slate-600">
              <span class="text-xs font-medium" :class="{
                'text-teal-700 bg-teal-50': w.on_target,
                'text-amber-700 bg-amber-50': !w.on_target,
              }">{{ w.on_target ? "Yes" : "No" }}</span>
            </td>
          </tr>
          <tr v-if="weights.length === 0">
            <td colspan="5" class="px-3 py-6 text-center text-slate-500">
              No weight records
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Record Weight
      </h3>
      <form @submit.prevent="handleCreate" class="space-y-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="col-span-2 md:col-span-2">
          <label class="label">Animal ID</label>
          <input v-model="form.animal_id" type="number" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Weight Date</label>
          <input v-model="form.weight_date" type="date" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Weight (kg)</label>
          <input v-model="form.weight_kg" type="number" step="0.1" class="input" required />
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
              {{ saving ? "Saving…" : "Record Weight" }}
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
