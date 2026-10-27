<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useBreeding, type SemenStraw } from "@/features/breeding/api/breeding";
import { useAuthStore } from "@/stores/auth";
import BreedingNav from "@/features/breeding/BreedingNav.vue";

const { t } = useI18n();
const auth = useAuthStore();
const { listSemenStraws, createSemenStraw } = useBreeding();

const straws = ref<SemenStraw[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);
const form = ref({
  bull_code: "",
  bull_name: "",
  breed: "",
  quantity: "",
  unit_price: "",
  expiry_date: "",
});
const formErrors = ref<Record<string, string[]>>({});
const canCreate = ref(auth.hasPermission("breeding.create"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    straws.value = await listSemenStraws({ per_page: 100 });
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
    await createSemenStraw({
      bull_code: form.value.bull_code,
      bull_name: form.value.bull_name,
      breed: form.value.breed,
      quantity: Number(form.value.quantity) || 0,
      unit_price: form.value.unit_price ? Number(form.value.unit_price) : undefined,
      expiry_date: form.value.expiry_date,
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
    <BreedingNav />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Semen Straws</h1>
      <button
        v-if="canCreate"
        class="btn-primary"
        @click="showForm = true"
      >
        + Add Straw
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
              Bull Code
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Bull Name
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Breed
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Quantity
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">
              Unit Price
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Expiry
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="s in straws" :key="s.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700 font-medium">{{ s.bull_code }}</td>
            <td class="px-3 py-2 text-slate-600">{{ s.bull_name ?? "—" }}</td>
            <td class="px-3 py-2 text-slate-600">{{ s.breed ?? "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ s.quantity }}</td>
            <td class="px-3 py-2 text-right text-slate-600">
              {{ s.unit_price !== undefined ? s.unit_price.toFixed(2) : "—" }}
            </td>
            <td class="px-3 py-2 text-slate-600">{{ s.expiry_date ?? "—" }}</td>
          </tr>
          <tr v-if="straws.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-slate-500">
              No semen straws in inventory
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Add Semen Straw
      </h3>
      <form @submit.prevent="handleCreate" class="space-y-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="col-span-2 md:col-span-2">
          <label class="label">Bull Code</label>
          <input v-model="form.bull_code" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Bull Name</label>
          <input v-model="form.bull_name" type="text" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Breed</label>
          <input v-model="form.breed" type="text" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Quantity</label>
          <input v-model="form.quantity" type="number" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Unit Price</label>
          <input v-model="form.unit_price" type="number" step="0.01" class="input" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Expiry Date</label>
          <input v-model="form.expiry_date" type="date" class="input" />
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
              {{ saving ? "Saving…" : "Add Straw" }}
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
