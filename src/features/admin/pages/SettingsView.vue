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

const FARM_PROFILE_KEYS = [
  "farm_name",
  "farm_address",
  "farm_contact_phone",
  "farm_contact_email",
] as const;

/** Keys edited in dedicated cards, or owned by the appearance screen. */
const DEDICATED_KEYS = new Set<string>([
  "milk_sessions_per_day",
  ...FARM_PROFILE_KEYS,
  "farm_logo_path",
  "theme_mode",
  "theme_preset",
  "theme_primary",
  "theme_accent",
]);

const otherSettings = computed(() =>
  Object.fromEntries(
    Object.entries(settings.value).filter(([key]) => !DEDICATED_KEYS.has(key))
  )
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get<{ data: Record<string, any> }>("/settings");
    settings.value = { ...res.data.data };
    // Fill any missing profile values from the already-loaded public settings.
    for (const key of FARM_PROFILE_KEYS) {
      if (settings.value[key] === undefined || settings.value[key] === null) {
        const publicValue = settingsStore.settings[key];
        if (publicValue !== undefined && publicValue !== null) {
          settings.value[key] = publicValue;
        }
      }
    }
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

    <form v-if="canManage" class="space-y-4" @submit.prevent="save">
      <div class="card">
        <h2 class="section-title">Farm profile</h2>
        <p class="mb-4 text-xs text-slate-500">
          These details identify this farm across the app and its printed records.
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label class="label" for="farm-name">Farm name</label>
            <input
              id="farm-name"
              v-model="settings.farm_name"
              type="text"
              class="input"
              placeholder="Spring Water Dairy"
            />
            <p class="text-xs text-slate-500">Shown in the sidebar and top bar.</p>
          </div>
          <div class="space-y-2">
            <label class="label" for="farm-contact-phone">Contact phone</label>
            <input
              id="farm-contact-phone"
              v-model="settings.farm_contact_phone"
              type="tel"
              class="input"
            />
          </div>
          <div class="space-y-2">
            <label class="label" for="farm-contact-email">Contact email</label>
            <input
              id="farm-contact-email"
              v-model="settings.farm_contact_email"
              type="email"
              class="input"
            />
          </div>
          <div class="space-y-2">
            <label class="label" for="farm-address">Farm address</label>
            <input
              id="farm-address"
              v-model="settings.farm_address"
              type="text"
              class="input"
            />
          </div>
        </div>
      </div>

      <div class="card">
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
      </div>

      <div v-if="Object.keys(otherSettings).length" class="card">
        <h2 class="section-title">Other settings</h2>
        <div v-for="(value, key) in otherSettings" :key="key" class="space-y-2">
          <label class="label">{{ key }}</label>
          <input
            v-model="settings[key]"
            :type="typeof value === 'number' ? 'number' : 'text'"
            class="input"
          />
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? t("common.loading") : t("common.save") }}
      </button>
    </form>

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
