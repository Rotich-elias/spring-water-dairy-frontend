<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMilk, type BulkTankRecord, type MilkSessionKey } from "@/features/milk/api/milk";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { createClientUuid } from "@/api";

const { t } = useI18n();
const auth = useAuthStore();
const settings = useSettingsStore();
const { listBulkTank, saveBulkTank } = useMilk();

const records = ref<BulkTankRecord[]>([]);
const loading = ref(false);
const error = ref("");
const saving = ref(false);
const saveError = ref("");

const form = ref({
  record_date: new Date().toISOString().slice(0, 10),
  session: "morning" as MilkSessionKey,
  litres_collected: "",
  litres_sold: "",
  litres_discarded: "",
  buyer: "",
  price_per_litre: "",
});

const canCreate = computed(() => auth.hasPermission("milk.create"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await listBulkTank({ per_page: 50 });
    records.value = res;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  saveError.value = "";
  try {
    await saveBulkTank({
      client_uuid: createClientUuid(),
      record_date: form.value.record_date,
      session: form.value.session,
      litres_collected: Number(form.value.litres_collected) || 0,
      litres_sold: Number(form.value.litres_sold) || 0,
      litres_discarded: Number(form.value.litres_discarded) || 0,
      buyer: form.value.buyer || undefined,
      price_per_litre: form.value.price_per_litre ? Number(form.value.price_per_litre) : undefined,
    });
    form.value.litres_collected = "";
    form.value.litres_sold = "";
    form.value.litres_discarded = "";
    await load();
  } catch (e: any) {
    saveError.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    saving.value = false;
  }
}

const totals = computed(() => {
  const collected = records.value.reduce(
    (sum: number, r: BulkTankRecord) => sum + Number(r.litres_collected || 0),
    0
  );
  const sold = records.value.reduce(
    (sum: number, r: BulkTankRecord) => sum + Number(r.litres_sold || 0),
    0
  );
  const discarded = records.value.reduce(
    (sum: number, r: BulkTankRecord) => sum + Number(r.litres_discarded || 0),
    0
  );
  return { collected, sold, discarded };
});

onMounted(async () => {
  await settings.load(true);
  form.value.session = settings.defaultSessionKey();
  await load();
});
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Bulk tank</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
      <div class="card p-3">
        <div class="text-xs text-slate-500">Total collected</div>
        <div class="text-lg font-bold">{{ totals.collected.toFixed(1) }} L</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-slate-500">Total sold</div>
        <div class="text-lg font-bold text-teal-600">{{ totals.sold.toFixed(1) }} L</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-slate-500">Total discarded</div>
        <div class="text-lg font-bold text-safety-600">{{ totals.discarded.toFixed(1) }} L</div>
      </div>
    </div>

    <div v-if="canCreate" class="card mb-4">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Record collection
      </h3>
      <form @submit.prevent="handleSave" class="space-y-3 grid grid-cols-2 md:grid-cols-6 gap-3">
        <div class="col-span-2 md:col-span-2">
          <label class="label">Date</label>
          <input v-model="form.record_date" type="date" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Session</label>
          <select v-model="form.session" class="input">
            <option
              v-for="option in settings.milkSessions"
              :key="option.key"
              :value="option.key"
            >
              {{ t(option.labelKey) }}
            </option>
          </select>
        </div>
        <div class="md:col-span-1">
          <label class="label">Collected (L)</label>
          <input v-model="form.litres_collected" type="number" step="0.1" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Sold (L)</label>
          <input v-model="form.litres_sold" type="number" step="0.1" class="input" required />
        </div>
        <div class="md:col-span-1">
          <label class="label">Discarded (L)</label>
          <input v-model="form.litres_discarded" type="number" step="0.1" class="input" required />
        </div>
        <div class="md:col-span-2">
          <label class="label">Buyer</label>
          <input v-model="form.buyer" type="text" class="input" placeholder="e.g. Dairy Co" />
        </div>
        <div class="md:col-span-1">
          <label class="label">Price/L (KES)</label>
          <input v-model="form.price_per_litre" type="number" step="0.01" class="input" />
        </div>
        <div class="col-span-full">
          <p v-if="saveError" class="text-xs text-safety-600">{{ saveError }}</p>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Saving…" : "Save" }}
          </button>
        </div>
      </form>
    </div>

    <div v-else class="card mb-4">
      <p class="text-slate-500">You do not have permission to record bulk tank data.</p>
    </div>

    <div class="card overflow-x-auto">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Records
      </h3>
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">Session</th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">Collected</th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">Sold</th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">Discarded</th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">Buyer</th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">Price/L</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="r in records" :key="r.id" class="text-sm">
            <td class="px-3 py-2 text-slate-700">{{ r.record_date }}</td>
            <td class="px-3 py-2 text-slate-600">{{ t(settings.labelKeyFor(r.session)) }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ Number(r.litres_collected || 0).toFixed(1) }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ Number(r.litres_sold || 0).toFixed(1) }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ Number(r.litres_discarded || 0).toFixed(1) }}</td>
            <td class="px-3 py-2 text-slate-600">{{ r.buyer ?? "—" }}</td>
            <td class="px-3 py-2 text-right text-slate-600">{{ r.price_per_litre ? Number(r.price_per_litre).toFixed(2) : "—" }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="7" class="px-3 py-6 text-center text-slate-500">No records yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-3 shadow-sm;
}
.label {
  @apply block text-xs font-medium text-slate-700 mb-1;
}
</style>
