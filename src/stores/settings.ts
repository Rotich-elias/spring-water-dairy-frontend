import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { api, type SettingMap } from "@/api";
import {
  applyTheme,
  DEFAULT_PRESET,
  isThemeMode,
  isValidHex,
  type ThemeOptions,
} from "@/app/theme";
import type { MilkSessionKey } from "@/features/milk/api/milk";

export interface MilkSessionOption {
  key: MilkSessionKey;
  labelKey: string;
}

const MILK_SESSION_OPTIONS: Record<MilkSessionKey, MilkSessionOption> = {
  morning: { key: "morning", labelKey: "milk.morning" },
  midday: { key: "midday", labelKey: "milk.midday" },
  evening: { key: "evening", labelKey: "milk.evening" },
};

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<SettingMap>({});
  const loaded = ref(false);
  const loading = ref(false);
  let pending: Promise<void> | null = null;

  /** Farm schedule: 1 = morning, 2 = morning/evening, 3 = morning/midday/evening. */
  const milkSessionsPerDay = computed(() => {
    const parsed = Number(settings.value.milk_sessions_per_day ?? 2);
    if (!Number.isFinite(parsed)) return 2;
    return Math.min(3, Math.max(1, Math.trunc(parsed)));
  });

  /** Public farm name, with a stable fallback before settings load. */
  const farmName = computed(() => {
    const name = String(settings.value.farm_name ?? "").trim();
    return name || "Spring Water Dairy";
  });

  /** Current theme options, derived from the public settings payload. */
  const theme = computed<ThemeOptions>(() => ({
    mode: isThemeMode(settings.value.theme_mode) ? settings.value.theme_mode : "light",
    preset:
      typeof settings.value.theme_preset === "string" && settings.value.theme_preset.trim()
        ? settings.value.theme_preset.trim()
        : DEFAULT_PRESET,
    primary: isValidHex(settings.value.theme_primary) ? settings.value.theme_primary : undefined,
    accent: isValidHex(settings.value.theme_accent) ? settings.value.theme_accent : undefined,
  }));

  // Any settings fetch (bootstrap, save, refresh) instantly repaints the UI.
  watch(settings, () => applyTheme(theme.value), { deep: true, immediate: true });

  const milkSessions = computed<MilkSessionOption[]>(() => {
    const keys: MilkSessionKey[] =
      milkSessionsPerDay.value === 1
        ? ["morning"]
        : milkSessionsPerDay.value === 3
          ? ["morning", "midday", "evening"]
          : ["morning", "evening"];

    return keys.map((key) => MILK_SESSION_OPTIONS[key]);
  });

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return;
    if (pending && !force) return pending;

    loading.value = true;
    pending = api
      .get<{ data: SettingMap }>("settings/public")
      .then((response) => {
        settings.value = response.data.data ?? {};
        loaded.value = true;
      })
      .catch(() => {
        // Operational screens fall back to the two-session default.
      })
      .finally(() => {
        loading.value = false;
        pending = null;
      });

    return pending;
  }

  /** Best-matching session for the current time of day. */
  function defaultSessionKey(hour = new Date().getHours()): MilkSessionKey {
    const keys = milkSessions.value.map((option) => option.key);
    const preferred: MilkSessionKey =
      hour < 11 ? "morning" : hour < 16 ? "midday" : "evening";

    if (keys.includes(preferred)) {
      return preferred;
    }

    return hour < 16 ? (keys[0] ?? "morning") : (keys[keys.length - 1] ?? "evening");
  }

  function labelKeyFor(key: string): string {
    return MILK_SESSION_OPTIONS[key as MilkSessionKey]?.labelKey ?? `milk.${key}`;
  }

  /** Alias for bootstrap code that prefers an explicit name. */
  const ensureLoaded = (force = false): Promise<void> => load(force);

  return {
    settings,
    loaded,
    loading,
    farmName,
    theme,
    milkSessionsPerDay,
    milkSessions,
    load,
    ensureLoaded,
    defaultSessionKey,
    labelKeyFor,
  };
});
