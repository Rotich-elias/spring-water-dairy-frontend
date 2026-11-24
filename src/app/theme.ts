/* ------------------------------------------------------------------ */
/*  Runtime theming                                                    */
/* ------------------------------------------------------------------ */
/* Colours are published as RGB triplets (`16 185 129`) so Tailwind can
   apply opacity modifiers via `rgb(var(--brand-500) / <alpha-value>)`.
   Legacy `--color-brand-*` / `--color-teal-*` hex tokens are kept in sync
   for any plain CSS that still consumes them.                          */

export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "evergreen" | "ocean" | "sunrise" | "violet" | "slate";

export interface ThemePresetOption {
  /** English label, used as a fallback before translations land. */
  label: string;
  labelKey: string;
  primary: string;
  accent: string;
}

export const PRESETS: Record<ThemePreset, ThemePresetOption> = {
  evergreen: {
    label: "Evergreen",
    labelKey: "appearance.presets.evergreen",
    primary: "#10b981",
    accent: "#0d9488",
  },
  ocean: {
    label: "Ocean",
    labelKey: "appearance.presets.ocean",
    primary: "#0ea5e9",
    accent: "#06b6d4",
  },
  sunrise: {
    label: "Sunrise",
    labelKey: "appearance.presets.sunrise",
    primary: "#f97316",
    accent: "#f59e0b",
  },
  violet: {
    label: "Violet",
    labelKey: "appearance.presets.violet",
    primary: "#8b5cf6",
    accent: "#d946ef",
  },
  slate: {
    label: "Slate",
    labelKey: "appearance.presets.slate",
    primary: "#475569",
    accent: "#64748b",
  },
};

export const PRESET_KEYS = Object.keys(PRESETS) as ThemePreset[];
export const DEFAULT_PRESET: ThemePreset = "evergreen";
export const DEFAULT_PRIMARY = PRESETS[DEFAULT_PRESET].primary;
export const DEFAULT_ACCENT = PRESETS[DEFAULT_PRESET].accent;

export interface ThemeOptions {
  mode: ThemeMode;
  preset: string;
  primary?: string;
  accent?: string;
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
/** Header colour used by the dark sidebar; also the PWA background. */
const DARK_HEADER: RGB = [7, 32, 25];

type RGB = [number, number, number];
type Shades = Record<number, RGB>;

let systemQuery: MediaQueryList | null = null;
let systemListener: ((event: MediaQueryListEvent) => void) | null = null;

export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function isThemePreset(value: unknown): value is ThemePreset {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PRESETS, value);
}

function hexToRgb(hex: string): RGB {
  const value = hex.slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mix(from: RGB, to: RGB, amount: number): RGB {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ];
}

function rgbToTriplet(rgb: RGB): string {
  return rgb.map((channel) => Math.max(0, Math.min(255, Math.round(channel)))).join(" ");
}

function rgbToHex(rgb: RGB): string {
  return `#${rgb
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Build a familiar 50–900 ramp from a single brand colour. */
function shadesFor(base: RGB): Shades {
  return {
    50: mix(base, WHITE, 0.92),
    100: mix(base, WHITE, 0.82),
    200: mix(base, WHITE, 0.66),
    300: mix(base, WHITE, 0.45),
    400: mix(base, WHITE, 0.22),
    500: base,
    600: mix(base, BLACK, 0.14),
    700: mix(base, BLACK, 0.32),
    800: mix(base, BLACK, 0.48),
    900: mix(base, BLACK, 0.62),
  };
}

function detachSystemListener(): void {
  if (systemQuery && systemListener) {
    if (typeof systemQuery.removeEventListener === "function") {
      systemQuery.removeEventListener("change", systemListener);
    } else {
      systemQuery.removeListener(systemListener);
    }
  }
  systemQuery = null;
  systemListener = null;
}

/**
 * Publish the selected theme on <html> and watch OS colour-scheme changes
 * while `mode === "system"`. Calling this again replaces the old listener.
 * The returned function removes the listener (useful for component cleanup).
 */
export function applyTheme(options: ThemeOptions): () => void {
  detachSystemListener();

  const preset = PRESETS[isThemePreset(options.preset) ? options.preset : DEFAULT_PRESET] ?? PRESETS[DEFAULT_PRESET];
  const primaryHex = isValidHex(options.primary) ? options.primary : preset.primary;
  const accentHex = isValidHex(options.accent) ? options.accent : preset.accent;
  const mode: ThemeMode = isThemeMode(options.mode) ? options.mode : "system";
  const primaryRgb = hexToRgb(primaryHex);
  const accentRgb = hexToRgb(accentHex);
  const darkHeader = rgbToHex(mix(primaryRgb, DARK_HEADER, 0.82));

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const primaryShades = shadesFor(primaryRgb);
    const accentShades = shadesFor(accentRgb);

    for (const [shade, rgb] of Object.entries(primaryShades)) {
      root.style.setProperty(`--brand-${shade}`, rgbToTriplet(rgb));
      root.style.setProperty(`--color-brand-${shade}`, rgbToHex(rgb));
    }

    for (const shade of [50, 100, 500, 600, 900]) {
      const rgb = accentShades[shade];
      if (!rgb) continue;
      root.style.setProperty(`--teal-${shade}`, rgbToTriplet(rgb));
      root.style.setProperty(`--color-teal-${shade}`, rgbToHex(rgb));
    }

    const paint = (dark: boolean): void => {
      root.setAttribute("data-theme", dark ? "dark" : "light");
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta) meta.content = dark ? darkHeader : primaryHex;
    };

    if (mode === "system" && typeof window !== "undefined" && window.matchMedia) {
      const query = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (event: MediaQueryListEvent): void => paint(event.matches);
      systemQuery = query;
      systemListener = listener;
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", listener);
      } else {
        query.addListener(listener);
      }
      paint(query.matches);
    } else {
      paint(mode === "dark");
    }
  }

  const capturedQuery = systemQuery;
  return () => {
    if (systemQuery === capturedQuery) detachSystemListener();
  };
}
