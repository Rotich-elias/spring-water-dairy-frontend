<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useBreeding } from "@/features/breeding/api/breeding";
import BreedingNav from "@/features/breeding/BreedingNav.vue";
import { createClientUuid } from "@/api";

const { t } = useI18n();
const route = useRoute();
const { listCalvings, createCalving } = useBreeding();

const calvings = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);
const form = ref<{
  client_uuid: string;
  dam_id: string;
  calving_date: string;
  ease_score_id: string;
  retained_placenta: boolean;
  notes: string;
  calves: Array<{
    ear_tag: string;
    sex: "M" | "F";
    birth_weight: number | null;
    outcome: string;
    colostrum_litres: number | null;
    colostrum_hours: number | null;
  }>;
}>({
  client_uuid: "",
  dam_id: "",
  calving_date: localDateTimeValue(),
  ease_score_id: "",
  retained_placenta: false,
  notes: "",
  calves: [newCalf()],
});
const formErrors = ref<Record<string, string[]>>({});

function localDateTimeValue(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function newCalf() {
  return {
    ear_tag: "",
    sex: "F" as "M" | "F",
    birth_weight: null as number | null,
    outcome: "live",
    colostrum_litres: null as number | null,
    colostrum_hours: null as number | null,
  };
}

function addCalf() {
  form.value.calves.push(newCalf());
}

function removeCalf(index: number) {
  if (form.value.calves.length > 1) {
    form.value.calves.splice(index, 1);
  }
}

function resetForm() {
  form.value = {
    client_uuid: "",
    dam_id: "",
    calving_date: localDateTimeValue(),
    ease_score_id: "",
    retained_placenta: false,
    notes: "",
    calves: [newCalf()],
  };
  formErrors.value = {};
}

function numberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatCalvingDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
const animalId = computed(() => {
  const raw = route.query.animal_id;
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    calvings.value = await listCalvings({ per_page: 100, dam_id: animalId.value });
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
    await createCalving({
      client_uuid: createClientUuid(),
      dam_id: Number(form.value.dam_id),
      calving_date: form.value.calving_date,
      ease_score_id: form.value.ease_score_id ? Number(form.value.ease_score_id) : undefined,
      retained_placenta: form.value.retained_placenta,
      notes: form.value.notes,
      calves: form.value.calves
        .filter((calf) => calf.ear_tag.trim())
        .map((calf) => ({
          ear_tag: calf.ear_tag.trim(),
          sex: calf.sex,
          outcome: calf.outcome,
          birth_weight: numberOrNull(calf.birth_weight),
          colostrum_litres: numberOrNull(calf.colostrum_litres),
          colostrum_hours: numberOrNull(calf.colostrum_hours),
        })),
    });
    showForm.value = false;
    resetForm();
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
  if (route.query.new === "1") {
    showForm.value = true;
  }
  void load();
});
</script>

<template>
  <div class="page p-4">
    <BreedingNav />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Calvings</h1>
      <button class="btn-primary" @click="showForm = true">+ Record Calving</button>
    </div>

    <div
      v-if="animalId"
      class="mb-4 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800"
    >
      <span>Showing records for animal #{{ animalId }}</span>
      <router-link :to="{ name: 'breeding.calvings' }" class="text-xs font-semibold underline">
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
              Dam Tag
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Calving Date
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Ease Score
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Retained Placenta
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="c in calvings" :key="c.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ c.dam_ear_tag }}</td>
            <td class="px-3 py-2 text-slate-600">{{ formatCalvingDate(c.calving_date) }}</td>
            <td class="px-3 py-2 text-slate-600">{{ c.ease_score ?? "—" }}</td>
            <td class="px-3 py-2 text-slate-600">{{ c.retained_placenta ? "Yes" : "No" }}</td>
          </tr>
          <tr v-if="calvings.length === 0">
            <td colspan="4" class="px-3 py-6 text-center text-slate-500">
              No calvings recorded
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Record Calving
      </h3>
      <form @submit.prevent="handleCreate" class="space-y-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="col-span-2 md:col-span-2">
          <label class="label">Dam ID</label>
          <input v-model="form.dam_id" type="number" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Calving Date</label>
          <input v-model="form.calving_date" type="datetime-local" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Ease Score ID</label>
          <input v-model="form.ease_score_id" type="number" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Retained Placenta</label>
          <input type="checkbox" v-model="form.retained_placenta" class="rounded" />
        </div>
        <div class="col-span-2">
          <label class="label">Notes</label>
          <input v-model="form.notes" type="text" class="input" />
        </div>

        <div class="col-span-2 md:col-span-4">
          <div class="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-700">Calves</h3>
            <button type="button" class="btn-sm btn-ghost text-brand-700" @click="addCalf">
              + Add calf
            </button>
          </div>

          <div
            v-for="(calf, index) in form.calves"
            :key="index"
            class="mb-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Calf {{ index + 1 }}
              </span>
              <button
                v-if="form.calves.length > 1"
                type="button"
                class="text-xs text-safety-600 hover:underline"
                @click="removeCalf(index)"
              >
                Remove
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div class="col-span-2">
                <label class="label">Ear tag</label>
                <input v-model="calf.ear_tag" type="text" class="input" required />
              </div>
              <div>
                <label class="label">Sex</label>
                <select v-model="calf.sex" class="select">
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </div>
              <div>
                <label class="label">Outcome</label>
                <select v-model="calf.outcome" class="select">
                  <option value="live">Live</option>
                  <option value="stillborn">Stillborn</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div>
                <label class="label">Birth weight (kg)</label>
                <input
                  v-model.number="calf.birth_weight"
                  type="number"
                  min="0"
                  step="0.5"
                  class="input"
                />
              </div>
              <div>
                <label class="label">Colostrum (L)</label>
                <input
                  v-model.number="calf.colostrum_litres"
                  type="number"
                  min="0"
                  step="0.5"
                  class="input"
                />
              </div>
              <div>
                <label class="label">Colostrum (hours)</label>
                <input
                  v-model.number="calf.colostrum_hours"
                  type="number"
                  min="0"
                  step="1"
                  class="input"
                />
              </div>
            </div>
          </div>
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
              {{ saving ? "Saving…" : "Record Calving" }}
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
