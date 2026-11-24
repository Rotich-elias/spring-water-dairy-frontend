/** @type {import('tailwindcss').Config} */
/* Runtime-themed colours read RGB triplets from tokens.css / theme.ts.
   Keeping opacity modifiers means existing classes such as
   `bg-brand-500/20` keep working unchanged. */
const themed = (variable) => `rgb(var(${variable}) / <alpha-value>)`;
const brandShades = {
  50: themed("--brand-50"),
  100: themed("--brand-100"),
  200: themed("--brand-200"),
  300: themed("--brand-300"),
  400: themed("--brand-400"),
  500: themed("--brand-500"),
  600: themed("--brand-600"),
  700: themed("--brand-700"),
  800: themed("--brand-800"),
  900: themed("--brand-900"),
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f6f4ec",
        ink: {
          50: "#eef5f1",
          100: "#d6e8de",
          700: "#123b2c",
          800: "#0c2c21",
          900: "#072019",
        },
        brand: brandShades,
        safety: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        farm: {
          50: themed("--brand-50"),
          100: themed("--brand-100"),
          500: themed("--brand-500"),
          600: themed("--brand-600"),
          900: themed("--brand-900"),
        },
        swd: {
          teal: themed("--teal-600"),
          tealDark: themed("--teal-900"),
          cream: "#f6f4ec",
          slate: "#334155",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(7, 32, 25, 0.04), 0 8px 24px -12px rgba(7, 32, 25, 0.18)",
        lift: "0 18px 40px -20px rgba(7, 32, 25, 0.35)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.28s ease-out both",
        "sheet-up": "sheet-up 0.24s ease-out both",
      },
    },
  },
  plugins: [],
};
