<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useBreeding, type BreedingEvent } from "@/features/breeding/api/breeding";
import BreedingNav from "@/features/breeding/BreedingNav.vue";

const { t } = useI18n();
const { getCalendar } = useBreeding();

const from = ref(new Date().toISOString().slice(0, 10));
const to = ref(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
const events = ref<BreedingEvent[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    events.value = await getCalendar(from.value, to.value);
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

const eventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    pd_due: "text-teal-700 bg-teal-50 border-teal-200",
    dry_off_due: "text-amber-700 bg-amber-50 border-amber-200",
    calving_due: "text-safety-700 bg-safety-50 border-safety-200",
  };
  return colors[type] || "text-slate-700 bg-slate-50 border-slate-200";
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <BreedingNav />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Breeding Calendar</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div class="flex gap-3 mb-4">
      <div>
        <label class="label">From</label>
        <input v-model="from" type="date" class="input" @change="load" />
      </div>
      <div>
        <label class="label">To</label>
        <input v-model="to" type="date" class="input" @change="load" />
      </div>
      <button class="btn-primary" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Date
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Type
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Animal
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Ear Tag
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="e in events" :key="e.date + e.animal_id" class="text-sm">
            <td class="px-3 py-2 text-slate-700">{{ e.date }}</td>
            <td class="px-3 py-2">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded"
                :class="eventTypeColor(e.type)"
              >
                {{ e.title }}
              </span>
            </td>
            <td class="px-3 py-2 text-slate-600">{{ e.animal }}</td>
            <td class="px-3 py-2 text-slate-600">{{ e.ear_tag }}</td>
          </tr>
          <tr v-if="events.length === 0">
            <td colspan="4" class="px-3 py-6 text-center text-slate-500">
              No upcoming breeding events
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
.label {
  @apply block text-xs font-medium text-slate-700 mb-1;
}
</style>
