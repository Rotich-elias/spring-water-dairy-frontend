<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMilk } from "@/features/milk/api/milk";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { useOfflineQueue } from "@/features/milk/composables/useOfflineQueue";
import { createClientUuid } from "@/api";
import { useSettingsStore } from "@/stores/settings";
import type {
  MilkSessionCow,
  MilkSessionKey,
  MilkSessionSaveResponse,
  MilkSessionSheet,
} from "@/features/milk/api/milk";

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const { sessionSheet, saveSession } = useMilk();
const { pendingCount } = useOfflineQueue();
const settings = useSettingsStore();

const date = ref(new Date().toISOString().slice(0, 10));
const session = ref<MilkSessionKey>("morning");
const showCmtScc = ref(false);
const saving = ref(false);
const saveResult = ref<MilkSessionSaveResponse | null>(null);
const saveError = ref("");

const cows = ref<MilkSessionCow[]>([]);
const summary = ref<MilkSessionSheet["summary"] | null>(null);
const loading = ref(false);
const error = ref("");

const focusedIndex = ref(0);
const newEntries = ref<Record<string, number | string>>({});

const availableSessions = computed(() => settings.milkSessions);
const sessionLabel = computed(() =>
  t(settings.labelKeyFor(session.value))
);

// Litres typed but not saved yet; added on top of the server totals below.
const unsavedLitres = computed(() =>
  cows.value.reduce((sum, cow) => {
    if (cow.already_recorded || !hasEntry(cow.id)) return sum;
    return sum + Number(newEntries.value[cow.id]);
  }, 0)
);

const sessionYield = computed(
  () => Number(summary.value?.session_total ?? 0) + unsavedLitres.value
);

const dayYield = computed(
  () => Number(summary.value?.day_total ?? 0) + unsavedLitres.value
);

function formatLitres(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const litres = Number(value);
  return Number.isFinite(litres) ? litres.toFixed(1) : "—";
}

/**
 * A recorded row shows the litres saved for this session; an open row shows
 * the previous session's yield as a starting-point hint.
 */
function litrePlaceholder(cow: MilkSessionCow): string | undefined {
  const value = cow.already_recorded ? cow.recorded_litres : cow.last_yield;
  return value == null ? undefined : formatLitres(value);
}

function hasEntry(id: number): boolean {
  const value = newEntries.value[id];
  if (value === undefined || value === null || value === "") return false;
  return Number.isFinite(Number(value));
}

function optionalNumber(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const pendingEntries = computed(() =>
  cows.value
    .filter((cow) => !cow.already_recorded && hasEntry(cow.id))
    .map((cow) => ({
      animal_id: cow.id,
      litres: Number(newEntries.value[cow.id]),
      cmt_score: optionalNumber(newEntries.value[`${cow.id}_cmt`]),
      scc: optionalNumber(newEntries.value[`${cow.id}_scc`]),
    }))
);

const allRecorded = computed(
  () =>
    cows.value.length > 0 && cows.value.every((cow) => cow.already_recorded)
);

const canSave = computed(
  () => !saving.value && !loading.value && pendingEntries.value.length > 0
);

const cowsMilked = computed(
  () =>
    cows.value.filter(
      (c) => c.already_recorded || hasEntry(c.id)
    ).length
);

const cowsMissing = computed(() =>
  cows.value.filter(
    (c) => !c.already_recorded && !c.in_withholding && !hasEntry(c.id)
  ).length
);

async function load() {
  loading.value = true;
  error.value = "";
  newEntries.value = {};
  summary.value = null;
  try {
    const sheet = await sessionSheet(date.value, session.value);
    cows.value = sheet.cows;
    summary.value = sheet.summary;
    saveResult.value = null;
    saveError.value = "";
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (pendingEntries.value.length === 0) {
    saveError.value = allRecorded.value
      ? "All cows for this session are already recorded."
      : "Enter litres for at least one cow before saving.";
    return;
  }

  saving.value = true;
  saveError.value = "";
  saveResult.value = null;

  const entries = pendingEntries.value;

  try {
    const result = await saveSession({
      client_uuid: createClientUuid(),
      record_date: date.value,
      session: session.value,
      entries,
    });
    await load(); // refresh to show already_recorded
    if (!error.value) {
      saveResult.value = result;
    }
  } catch (e: any) {
    // Network failures are queued automatically by the shared API client.
    if (!e.response) {
      saveError.value = t("errors.network");
      saveResult.value = {
        client_uuid: "",
        saved: 0,
        skipped: 0,
        warnings: 0,
        entries: entries.map((e) => ({
          animal_id: e.animal_id,
          status: "skipped",
          reason: "offline_queued",
        })),
      };
    } else {
      saveError.value = e.response.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    saving.value = false;
  }
}

function rowClass(cow: any, i: number) {
  return [
    "group",
    focusedIndex.value === i ? "bg-teal-50" : "hover:bg-slate-50",
    cow.in_withholding ? "border-l-4 border-safety-600" : "",
    cow.already_recorded ? "opacity-60" : "",
  ];
}

function moveFocus(delta: number) {
  const next = focusedIndex.value + delta;
  if (next >= 0 && next < cows.value.length) {
    focusedIndex.value = next;
  }
}

onMounted(async () => {
  await settings.load(true);
  const initial = settings.defaultSessionKey();

  if (initial !== session.value) {
    session.value = initial;
  } else {
    await load();
  }
});

// If the farm reduces its schedule while the screen is open, fall back to an
// enabled session instead of requesting a hidden one.
watch(availableSessions, (options) => {
  if (!options.some((option) => option.key === session.value)) {
    session.value = settings.defaultSessionKey();
  }
});

watch(
  () => date.value + "|" + session.value,
  () => {
    load();
  }
);
</script>

<template>
  <div class="page p-2 md:p-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900">
          {{ t("nav.milk") }} - Session
        </h1>
        <p class="text-sm text-slate-500">
          {{ date }} · {{ sessionLabel }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span
          v-if="pendingCount > 0"
          class="rounded-full bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700"
          :title="t('common.saved_on_device')"
        >
          {{ pendingCount }} {{ t("common.saved_on_device") }}
        </span>
        <label class="label text-xs">
          <input type="checkbox" v-model="showCmtScc" /> CMT / SCC
        </label>
        <button
          class="btn-primary"
          :disabled="!canSave"
          @click="handleSave"
        >
          {{ saving ? t("common.loading") : t("common.save") }}
        </button>
      </div>
    </div>

    <!-- Session picker: driven by Settings → milk sessions per day. -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium text-slate-500">{{ t("milk.session") }}</span>
      <button
        v-for="option in availableSessions"
        :key="option.key"
        type="button"
        class="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
        :class="
          session === option.key
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        "
        @click="session = option.key"
      >
        {{ t(option.labelKey) }}
      </button>
    </div>

    <div v-if="error" class="mb-3 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="saveError" class="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
      {{ saveError }}
    </div>

    <!-- Summary bar -->
    <div class="card mb-3">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 p-3">
        <div class="text-center">
          <div class="text-xs text-slate-500">Cows</div>
          <div class="text-lg font-bold">{{ cows.length }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Milked</div>
          <div class="text-lg font-bold text-teal-600">{{ cowsMilked }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Missing</div>
          <div class="text-lg font-bold text-safety-600">{{ cowsMissing }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Session yield</div>
          <div class="text-lg font-bold">{{ sessionYield.toFixed(1) }} L</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Today</div>
          <div class="text-lg font-bold">{{ dayYield.toFixed(1) }} L</div>
        </div>
      </div>
    </div>

    <!-- Entry grid: one row per cow -->
    <div v-if="!error" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-24">
              Tag
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-20">
              Last
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-16">
              DIM
            </th>
            <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500 w-24">
              Litres
            </th>
            <th
              v-if="showCmtScc"
              class="px-3 py-2 text-right text-xs font-semibold text-slate-500 w-16"
            >
              CMT
            </th>
            <th
              v-if="showCmtScc"
              class="px-3 py-2 text-right text-xs font-semibold text-slate-500 w-16"
            >
              SCC
            </th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="(cow, i) in cows"
            :key="cow.id"
            :class="rowClass(cow, i)"
          >
            <td class="px-3 py-3 text-sm font-medium text-slate-900">
              {{ cow.ear_tag }}
            </td>
            <td class="px-3 py-3 text-sm text-slate-600">
              {{ cow.last_yield == null ? "—" : formatLitres(cow.last_yield) + " L" }}
            </td>
            <td class="px-3 py-3 text-sm text-slate-600">
              {{ cow.dims ?? "-" }}
            </td>
            <td class="px-3 py-3">
              <input
                v-model.number="newEntries[cow.id]"
                type="number"
                step="0.5"
                min="0"
                max="100"
                class="input w-full text-right text-lg font-bold text-slate-900"
                :class="{
                  'bg-safety-50': cow.in_withholding,
                  'bg-brand-50': cow.already_recorded,
                }"
                :placeholder="litrePlaceholder(cow)"
                @keydown.enter="moveFocus(1)"
                @keydown.arrowdown="moveFocus(1)"
                @keydown.arrowup="moveFocus(-1)"
                :disabled="cow.already_recorded"
              />
            </td>
            <td v-if="showCmtScc" class="px-3 py-3">
              <input
                v-model.number="newEntries[cow.id + '_cmt']"
                type="number"
                step="1"
                min="0"
                max="5"
                class="input w-full text-right text-sm"
                :placeholder="'0'"
                :disabled="cow.already_recorded"
              />
            </td>
            <td v-if="showCmtScc" class="px-3 py-3">
              <input
                v-model.number="newEntries[cow.id + '_scc']"
                type="number"
                step="1"
                min="0"
                class="input w-full text-right text-sm"
                :placeholder="'0'"
                :disabled="cow.already_recorded"
              />
            </td>
            <td class="px-3 py-3">
              <span
                v-if="cow.in_withholding"
                class="badge badge-safety text-xs whitespace-nowrap"
              >
                ⚠ Withholding
              </span>
              <span v-else-if="cow.already_recorded" class="badge badge-brand text-xs">
                Recorded
              </span>
              <span v-else class="text-xs text-slate-400">—</span>
            </td>
          </tr>
          <tr v-if="cows.length === 0">
            <td colspan="7" class="px-3 py-6 text-center text-slate-500">
              No lactating cows for this session.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="error && !loading" class="card mt-4 p-6 text-center">
      <p class="text-sm text-slate-600">{{ t("common.try_again") }}</p>
      <button type="button" class="btn-outline mt-3" @click="load">
        {{ t("common.try_again") }}
      </button>
    </div>

    <div class="mt-3">
      <p v-if="allRecorded" class="text-sm font-medium text-brand-700 mb-1">
        All cows for this session are already recorded.
      </p>
      <p
        v-else-if="cows.length > 0 && pendingEntries.length === 0"
        class="text-sm text-slate-500 mb-1"
      >
        Enter litres for at least one cow to save.
      </p>
      <p class="text-xs text-slate-500 mb-1">
        Cows in withholding can still be recorded; their milk is excluded from sales.
      </p>
      <p class="text-xs text-slate-500">
        Enter → Next cow &nbsp;|&nbsp; ↑↓ Navigate
      </p>
    </div>

    <!-- Session summary after save -->
    <div v-if="saveResult" class="mt-4 card">
      <h3 class="text-sm font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
        Session summary
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
        <div class="text-center">
          <div class="text-xs text-slate-500">Saved</div>
          <div class="text-lg font-bold text-teal-600">
            {{ saveResult.saved }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Skipped</div>
          <div class="text-lg font-bold text-safety-600">
            {{ saveResult.skipped }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Warnings</div>
          <div class="text-lg font-bold text-amber-600">
            {{ saveResult.warnings }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-slate-500">Status</div>
          <div class="text-lg font-bold">
            {{ saveResult.replayed ? "Replayed (idempotent)" : "Saved" }}
          </div>
        </div>
      </div>
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
