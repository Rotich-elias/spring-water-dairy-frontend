import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/api";
import {
  applyTheme,
  DEFAULT_ACCENT,
  DEFAULT_PRESET,
  DEFAULT_PRIMARY,
  isThemeMode,
  isThemePreset,
  isValidHex,
  type ThemeMode,
} from "@/app/theme";
import { useSettingsStore } from "./settings";

export interface AppearanceSettings {
  theme_mode: ThemeMode;
  theme_preset: string;
  theme_primary: string;
  theme_accent: string;
  farm_name: string;
}

export type AppearancePayload = AppearanceSettings;

function defaults(): AppearanceSettings {
  return {
    theme_mode: "light",
    theme_preset: DEFAULT_PRESET,
    theme_primary: DEFAULT_PRIMARY,
    theme_accent: DEFAULT_ACCENT,
    farm_name: "",
  };
}

/** Accept both `{ data: {...} }` and plain/nested response shapes. */
function extractSettings(payload: unknown): Partial<AppearanceSettings> {
  if (!payload || typeof payload !== "object") return {};
  const outer = payload as Record<string, unknown>;
  const data = outer.data;

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const nested = record.appearance;
    if (nested && typeof nested === "object") {
      return nested as Partial<AppearanceSettings>;
    }
    return record as Partial<AppearanceSettings>;
  }

  return outer as Partial<AppearanceSettings>;
}

function errorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { error?: { message?: string } } };
    message?: string;
  };
  return (
    err.response?.data?.error?.message ??
    err.message ??
    "Unable to save appearance settings."
  );
}

/** Re-apply the theme carried by the public settings endpoint. */
export function syncThemeFromSettings(): void {
  applyTheme(useSettingsStore().theme);
}

export const useAppearanceStore = defineStore("appearance", () => {
  const settings = ref<AppearanceSettings>(defaults());
  const loaded = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref("");
  let pending: Promise<void> | null = null;

  const mode = computed<ThemeMode>(() => settings.value.theme_mode);
  const preset = computed(() => settings.value.theme_preset);
  const primary = computed(() => settings.value.theme_primary);
  const accent = computed(() => settings.value.theme_accent);
  const farmName = computed(() => settings.value.farm_name.trim() || "Spring Water Dairy");

  function apply(): void {
    applyTheme({
      mode: mode.value,
      preset: preset.value,
      primary: primary.value,
      accent: accent.value,
    });
  }

  function merge(values: Partial<AppearanceSettings>): void {
    const next: AppearanceSettings = { ...settings.value };

    if (isThemeMode(values.theme_mode)) next.theme_mode = values.theme_mode;
    if (typeof values.theme_preset === "string" && isThemePreset(values.theme_preset)) {
      next.theme_preset = values.theme_preset;
    }
    if (isValidHex(values.theme_primary)) next.theme_primary = values.theme_primary;
    if (isValidHex(values.theme_accent)) next.theme_accent = values.theme_accent;
    if (typeof values.farm_name === "string") next.farm_name = values.farm_name;

    settings.value = next;
    apply();
  }

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) {
      apply();
      return;
    }
    if (pending && !force) return pending;

    loading.value = true;
    pending = api
      .get("/appearance")
      .then((response) => {
        merge(extractSettings(response.data));
        loaded.value = true;
      })
      .catch(() => {
        // Viewers without appearance.view still get the public theme.
        loaded.value = true;
        syncThemeFromSettings();
      })
      .finally(() => {
        loading.value = false;
        pending = null;
      });

    return pending;
  }

  async function save(payload: AppearancePayload): Promise<boolean> {
    saving.value = true;
    error.value = "";
    try {
      const response = await api.patch("/appearance", payload);
      merge({ ...payload, ...extractSettings(response.data) });

      // Mirror into the public settings store so the sidebar/topbar farm
      // name and the whole UI theme update without a reload.
      const settingsStore = useSettingsStore();
      settingsStore.settings = {
        ...settingsStore.settings,
        farm_name: settings.value.farm_name,
        theme_mode: settings.value.theme_mode,
        theme_preset: settings.value.theme_preset,
        theme_primary: settings.value.theme_primary,
        theme_accent: settings.value.theme_accent,
      };

      return true;
    } catch (e: unknown) {
      error.value = errorMessage(e);
      return false;
    } finally {
      saving.value = false;
    }
  }

  return {
    settings,
    loaded,
    loading,
    saving,
    error,
    mode,
    preset,
    primary,
    accent,
    farmName,
    load,
    save,
    apply,
    merge,
  };
});
