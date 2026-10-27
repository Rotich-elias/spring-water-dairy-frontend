<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useBreeding, type Heat } from "@/features/breeding/api/breeding";
import { useAuthStore } from "@/stores/auth";
import BreedingNav from "@/features/breeding/BreedingNav.vue";
import { createClientUuid } from "@/api";

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const { listHeats, createHeat } = useBreeding();

const heats = ref<Heat[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);
const form = ref<{
  client_uuid: string;
  animal_id: string;
  heat_date: string;
  observed_by: string;
  notes: string;
}>({
  client_uuid: "",
  animal_id: "",
  heat_date: new Date().toISOString().slice(0, 10),
  observed_by: "",
  notes: "",
});
const formErrors = ref<Record<string, string[]>>({});
const canCreate = ref(auth.hasPermission("breeding.create"));
const animalId = computed(() => {
  const raw = route.query.animal_id;
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    heats.value = await listHeats({ per_page: 100, animal_id: animalId.value });
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
    await createHeat({
      client_uuid: createClientUuid(),
      animal_id: Number(form.value.animal_id),
      heat_date: form.value.heat_date,
      observed_by: form.value.observed_by,
      notes: form.value.notes,
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

onMounted(() => {
  if (route.query.new === "1" && canCreate.value) {
    showForm.value = true;
  }
  void load();
});
</script>

<template>
  <div class="page p-4">
    <BreedingNav />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Heats</h1>
      <button
        v-if="canCreate"
        class="btn-primary"
        @click="showForm = true"
      >
        + Record Heat
      </button>
    </div>

    <div
      v-if="animalId"
      class="mb-4 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800"
    >
      <span>Showing records for animal #{{ animalId }}</span>
      <router-link :to="{ name: 'breeding.heats' }" class="text-xs font-semibold underline">
        Clear filter
      </router-link>
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
              Heat Date
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Observed By
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Notes
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="h in heats" :key="h.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ h.animal_ear_tag }}</td>
            <td class="px-3 py-2 text-slate-600">{{ h.heat_date }}</td>
            <td class="px-3 py-2 text-slate-600">{{ h.observed_by ?? "—" }}</td>
            <td class="px-3 py-2 text-slate-600">{{ h.notes ?? "—" }}</td>
          </tr>
          <tr v-if="heats.length === 0">
            <td colspan="4" class="px-3 py-6 text-center text-slate-500">
              No heats recorded
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Record Heat
      </h3>
      <form @submit.prevent="handleCreate" class="space-y-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="col-span-2 md:col-span-2">
          <label class="label">Animal ID</label>
          <input v-model="form.animal_id" type="number" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Heat Date</label>
          <input v-model="form.heat_date" type="date" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Observed By</label>
          <input v-model="form.observed_by" type="text" class="input" />
        </div>
        <div class="col-span-2">
          <label class="label">Notes</label>
          <input v-model="form.notes" type="text" class="input" />
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
              {{ saving ? "Saving…" : "Record Heat" }}
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
