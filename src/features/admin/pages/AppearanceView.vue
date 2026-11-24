<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Droplets } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useAppearanceStore, type AppearancePayload } from "@/stores/appearance";
import { useSettingsStore } from "@/stores/settings";
import {
  applyTheme,
  isValidHex,
  PRESETS,
  PRESET_KEYS,
  type ThemeMode,
  type ThemePreset,
} from "@/app/theme";

const { t } = useI18n();
const auth = useAuthStore();
const appearance = useAppearanceStore();
const settingsStore = useSettingsStore();

const canManage = computed(() => auth.hasPermission("appearance.update"));
const form = reactive<AppearancePayload>({ ...appearance.settings });
const message = ref("");

/** Show English until the parent adds appearance.* translations. */
function tr(key: string, fallback: string): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

const modeOptions: { value: ThemeMode; labelKey: string; label: string }[] = [
  { value: "light", labelKey: "appearance.light", label: "Light" },
  { value: "dark", labelKey: "appearance.dark", label: "Dark" },
  { value: "system", labelKey: "appearance.system", label: "System" },
];

const presetOptions = PRESET_KEYS.map((key) => ({
  key,
  ...(PRESETS[key] ?? PRESETS.evergreen),
}));

const validationError = computed(() => {
  if (!isValidHex(form.theme_primary)) {
    return "Primary colour must be a 6-digit hex value (e.g. #10b981).";
  }
  if (!isValidHex(form.theme_accent)) {
    return "Accent colour must be a 6-digit hex value (e.g. #0d9488).";
  }
  return "";
});

function choosePreset(key: ThemePreset): void {
  const preset = PRESETS[key];
  if (!preset) return;
  form.theme_preset = key;
  form.theme_primary = preset.primary;
  form.theme_accent = preset.accent;
}

// Preview changes live; saving persists them.
watch(
  () => ({ ...form }),
  () => {
    if (validationError.value) return;
    applyTheme({
      mode: form.theme_mode,
      preset: form.theme_preset,
      primary: form.theme_primary,
      accent: form.theme_accent,
    });
  },
  { deep: true },
);

async function save(): Promise<void> {
  if (validationError.value) return;
  message.value = "";
  const saved = await appearance.save({ ...form });
  if (saved) message.value = tr("appearance.saved", t("common.success"));
}

onMounted(async () => {
  await appearance.load();
  Object.assign(form, appearance.settings);
});

onUnmounted(() => {
  // Discard unsaved preview changes when leaving the page.
  if (appearance.loaded) {
    appearance.apply();
  } else {
    applyTheme(settingsStore.theme);
  }
});
</script>

<template>
  <div class="page max-w-3xl space-y-4 p-4">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ tr("appearance.title", "Appearance") }}</h1>
        <p class="page-subtitle">
          {{ tr("appearance.subtitle", "Brand colours, theme mode and the name shown across the app.") }}
        </p>
      </div>
    </div>

    <p v-if="!canManage" class="alert alert-error">
      {{ tr("appearance.forbidden", t("errors.forbidden")) }}
    </p>

    <template v-else>
      <p v-if="appearance.error || validationError" class="alert alert-error">
        {{ appearance.error || validationError }}
      </p>
      <p v-if="message" class="alert alert-success">{{ message }}</p>

      <form class="space-y-4" @submit.prevent="save">
        <section class="card">
          <h2 class="section-title">{{ tr("appearance.theme_mode", "Colour mode") }}</h2>
          <div class="grid grid-cols-3 gap-2" role="group" :aria-label="tr('appearance.theme_mode', 'Colour mode')">
            <button
              v-for="option in modeOptions"
              :key="option.value"
              type="button"
              class="btn"
              :class="form.theme_mode === option.value ? 'btn-primary' : 'btn-outline'"
              :aria-pressed="form.theme_mode === option.value"
              @click="form.theme_mode = option.value"
            >
              {{ tr(option.labelKey, option.label) }}
            </button>
          </div>
          <p class="mt-3 text-xs text-slate-500">
            {{ tr("appearance.mode.hint", "System follows your device's light or dark setting.") }}
          </p>
        </section>

        <section class="card">
          <h2 class="section-title">{{ tr("appearance.colour_preset", "Colour preset") }}</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              v-for="preset in presetOptions"
              :key="preset.key"
              type="button"
              class="rounded-xl border p-3 text-left transition hover:-translate-y-0.5"
              :class="
                form.theme_preset === preset.key
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white'
              "
              :aria-pressed="form.theme_preset === preset.key"
              @click="choosePreset(preset.key)"
            >
              <span class="flex items-center gap-2">
                <span
                  class="h-6 w-6 rounded-full ring-1 ring-black/10"
                  :style="{ backgroundColor: preset.primary }"
                  aria-hidden="true"
                ></span>
                <span
                  class="h-6 w-6 rounded-full ring-1 ring-black/10"
                  :style="{ backgroundColor: preset.accent }"
                  aria-hidden="true"
                ></span>
              </span>
              <span class="mt-2 block text-sm font-semibold text-slate-700">
                {{ tr(preset.labelKey, preset.label) }}
              </span>
            </button>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">{{ tr("appearance.custom_colours", "Custom colours") }}</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="label" for="primary-colour">
                {{ tr("appearance.primary_colour", "Primary colour") }}
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.theme_primary"
                  type="color"
                  class="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
                  :aria-label="tr('appearance.primary_colour', 'Primary colour')"
                />
                <input
                  id="primary-colour"
                  v-model.trim="form.theme_primary"
                  type="text"
                  maxlength="7"
                  spellcheck="false"
                  class="input font-mono uppercase"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="label" for="accent-colour">
                {{ tr("appearance.accent_colour", "Accent colour") }}
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.theme_accent"
                  type="color"
                  class="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
                  :aria-label="tr('appearance.accent_colour', 'Accent colour')"
                />
                <input
                  id="accent-colour"
                  v-model.trim="form.theme_accent"
                  type="text"
                  maxlength="7"
                  spellcheck="false"
                  class="input font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">{{ tr("appearance.preview", "Live preview") }}</h2>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center gap-3 rounded-xl bg-brand-700 px-4 py-3 text-white">
              <Droplets :size="20" />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">
                  {{ form.farm_name || "Spring Water Dairy" }}
                </p>
                <p class="text-xs text-white/70">{{ t("app.tagline") }}</p>
              </div>
              <span class="badge ml-auto bg-white/15 text-white">
                {{ tr("appearance.preview.badge", "Live") }}
              </span>
            </div>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p class="text-xs font-semibold text-brand-700">
                  {{ tr("appearance.primary_colour", "Primary colour") }}
                </p>
                <p class="mt-1 font-mono text-lg font-bold text-brand-900">
                  {{ form.theme_primary }}
                </p>
              </div>
              <div class="rounded-xl border border-slate-200 bg-white p-3">
                <p class="text-xs font-semibold text-slate-500">
                  {{ tr("appearance.accent_colour", "Accent colour") }}
                </p>
                <p class="mt-1 font-mono text-lg font-bold" :style="{ color: form.theme_accent }">
                  {{ form.theme_accent }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">{{ tr("appearance.farm_branding", "Farm branding") }}</h2>
          <label class="label" for="appearance-farm-name">
            {{ tr("appearance.farm_name_hint", "Name shown in the sidebar and top bar") }}
          </label>
          <input
            id="appearance-farm-name"
            v-model.trim="form.farm_name"
            type="text"
            class="input"
            placeholder="Spring Water Dairy"
          />
        </section>

        <button
          type="submit"
          class="btn-primary"
          :disabled="appearance.saving || !!validationError"
        >
          {{ appearance.saving ? t("common.loading") : tr("appearance.save", t("common.save")) }}
        </button>
      </form>
    </template>
  </div>
</template>
