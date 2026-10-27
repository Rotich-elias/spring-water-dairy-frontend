<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const { t } = useI18n();
const auth = useAuthStore();
const settingsStore = useSettingsStore();

const settings = ref<Record<string, any>>({});
const loading = ref(false);
const saving = ref(false);
const message = ref("");
const error = ref("");

const canManage = computed(() => auth.hasPermission("settings.update"));

const otherSettings = computed(() =>
  Object.fromEntries(
    Object.entries(settings.value).filter(
      ([key]) => key !== "milk_sessions_per_day"
    )
  )
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get<{ data: Record<string, any> }>("/settings");
    settings.value = res.data.data;
    if (settings.value.milk_sessions_per_day === undefined) {
      settings.value.milk_sessions_per_day = 2;
    }
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  message.value = "";
  error.value = "";
  try {
    await api.patch("/settings", { settings: settings.value });
    // Refresh the shared public settings so milk screens pick up the new
    // session schedule without requiring a full page reload.
    await settingsStore.load(true);
    message.value = t("common.success");
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4 max-w-2xl">
    <h1 class="section-title">{{ t("nav.admin") }}</h1>

    <p v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </p>

    <p v-if="message" class="mb-4 p-3 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-sm">
      {{ message }}
    </p>

    <div v-if="canManage" class="card">
      <form @submit.prevent="save" class="space-y-4">
        <div class="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <label class="label" for="milk-sessions-per-day">Milk sessions per day</label>
          <select
            id="milk-sessions-per-day"
            v-model.number="settings.milk_sessions_per_day"
            class="select"
          >
            <option :value="1">1 — Morning</option>
            <option :value="2">2 — Morning and evening</option>
            <option :value="3">3 — Morning, midday and evening</option>
          </select>
          <p class="text-xs text-slate-500">
            Milkers only see the selected sessions on the milk entry screens.
            Existing records for other sessions are kept.
          </p>
        </div>

        <div v-for="(value, key) in otherSettings" :key="key" class="space-y-2">
          <label class="label">{{ key }}</label>
          <input
            v-model="settings[key]"
            :type="typeof value === 'number' ? 'number' : 'text'"
            class="input"
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? t("common.loading") : t("common.save") }}
        </button>
      </form>
    </div>

    <div v-else class="card">
      <p class="text-slate-500">{{ t("errors.forbidden") }}</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-6 shadow-xl;
}
</style>
