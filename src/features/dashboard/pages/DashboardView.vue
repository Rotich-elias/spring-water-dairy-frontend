<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  ArrowUpRight,
  BarChart3,
  Beef,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  Droplets,
  HeartPulse,
  Milk,
  Plus,
  Syringe,
  TriangleAlert,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import {
  useDashboard,
  type BreedShare,
  type CompositionItem,
  type DashboardStats,
  type MilkTrendPoint,
  type UpcomingEvent,
} from "@/features/dashboard/api/dashboard";

const { t, locale } = useI18n();
const auth = useAuthStore();
const {
  fetchStats,
  fetchMilkTrend,
  fetchBreedShare,
  fetchComposition,
  fetchUpcoming,
} = useDashboard();

const stats = ref<DashboardStats | null>(null);
const milkTrend = ref<MilkTrendPoint[]>([]);
const breedShare = ref<BreedShare[]>([]);
const composition = ref<CompositionItem[]>([]);
const upcoming = ref<UpcomingEvent[]>([]);
const loading = ref(true);
const error = ref("");

const firstName = computed(() => auth.user?.name?.trim().split(/\s+/)[0] ?? "");

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.greeting_morning");
  if (hour < 17) return t("dashboard.greeting_afternoon");
  return t("dashboard.greeting_evening");
});

const longDate = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date()),
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";

  const results = await Promise.allSettled([
    fetchStats(),
    fetchMilkTrend(),
    fetchBreedShare(),
    fetchComposition(),
    fetchUpcoming(),
  ]);

  const [statsRes, trendRes, breedRes, compRes, upcomingRes] = results;

  if (statsRes?.status === "fulfilled") stats.value = statsRes.value;
  if (trendRes?.status === "fulfilled") milkTrend.value = trendRes.value;
  if (breedRes?.status === "fulfilled") breedShare.value = breedRes.value;
  if (compRes?.status === "fulfilled") composition.value = compRes.value;
  if (upcomingRes?.status === "fulfilled") upcoming.value = upcomingRes.value;

  if (statsRes?.status === "rejected") {
    error.value = t("errors.unexpected");
  }

  loading.value = false;
}

onMounted(load);

/* ------------------------------------------------------------------ */
/*  Milk chart                                                        */
/* ------------------------------------------------------------------ */

const CHART_WIDTH = 720;
const CHART_HEIGHT = 240;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 196;
const PLOT_LEFT = 14;
const PLOT_RIGHT = 706;

const hasMilkData = computed(() => milkTrend.value.some((point) => point.litres > 0));

const milkTotal = computed(() =>
  milkTrend.value.reduce((sum, point) => sum + point.litres, 0),
);

const milkAverage = computed(() => {
  const days = milkTrend.value.filter((point) => point.litres > 0).length;
  return days > 0 ? milkTotal.value / days : 0;
});

const maxLitres = computed(() => {
  const max = Math.max(...milkTrend.value.map((point) => point.litres), 0);
  if (max === 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / magnitude) * magnitude;
});

const chartPoints = computed(() => {
  const points = milkTrend.value;
  if (points.length === 0) return [];

  const plotWidth = PLOT_RIGHT - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  return points.map((point, index) => ({
    ...point,
    x: PLOT_LEFT + step * index,
    y: PLOT_BOTTOM - (point.litres / maxLitres.value) * plotHeight,
  }));
});

const linePath = computed(() => {
  const points = chartPoints.value;
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
});

const areaPath = computed(() => {
  const points = chartPoints.value;
  if (points.length === 0) return "";
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `M${first.x.toFixed(1)},${PLOT_BOTTOM} ${linePath.value.slice(1)} L${last.x.toFixed(1)},${PLOT_BOTTOM} Z`;
});

const yTicks = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(maxLitres.value * ratio),
    y: PLOT_BOTTOM - (PLOT_BOTTOM - PLOT_TOP) * ratio,
  })),
);

const xLabels = computed(() => {
  const points = chartPoints.value;
  if (points.length === 0) return [];
  const count = Math.min(6, points.length);
  const step = Math.max(1, Math.floor((points.length - 1) / Math.max(1, count - 1)));
  return points
    .filter((_, index) => index % step === 0 || index === points.length - 1)
    .map((point) => ({
      x: point.x,
      label: point.date.slice(5),
    }));
});

const latestPoint = computed(() =>
  chartPoints.value.length > 0 ? chartPoints.value[chartPoints.value.length - 1] : null,
);

/* ------------------------------------------------------------------ */
/*  Other display helpers                                             */
/* ------------------------------------------------------------------ */

const breedMax = computed(() => {
  const values = breedShare.value.map((breed) => breed.count);
  return values.length > 0 ? Math.max(...values, 1) : 1;
});

const attentionCount = computed(
  () => (stats.value?.treatments_in_withholding ?? 0) + (stats.value?.vaccines_due ?? 0),
);

const weeklyMetrics = computed(() => [
  {
    label: t("dashboard.services_this_week"),
    value: stats.value?.services_this_week ?? 0,
  },
  {
    label: t("dashboard.pregnancies_pending"),
    value: stats.value?.pregnancies_pending ?? 0,
  },
  {
    label: t("dashboard.calvings_expected_this_week"),
    value: stats.value?.calvings_expected_this_week ?? 0,
  },
  {
    label: t("dashboard.treatments_in_withholding"),
    value: stats.value?.treatments_in_withholding ?? 0,
    alert: (stats.value?.treatments_in_withholding ?? 0) > 0,
  },
  {
    label: t("dashboard.vaccines_due"),
    value: stats.value?.vaccines_due ?? 0,
    alert: (stats.value?.vaccines_due ?? 0) > 0,
  },
]);

const compositionTotal = computed(() =>
  composition.value.reduce((sum, item) => sum + item.count, 0),
);

function priorityClass(priority: string): string {
  switch (priority) {
    case "high":
      return "badge-safety";
    case "medium":
      return "badge-amber";
    default:
      return "badge-slate";
  }
}

function eventIconClass(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-safety-50 text-safety-600";
    case "medium":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-brand-50 text-brand-700";
  }
}
</script>

<template>
  <div class="page">
    <!-- Greeting / header -->
    <section class="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="eyebrow">{{ longDate }}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
          {{ greeting }}<span v-if="firstName">, {{ firstName }}</span>
        </h1>
        <p class="mt-1.5 text-sm text-slate-500">{{ t("dashboard.todays_overview") }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <router-link v-if="auth.hasPermission('milk.create')" :to="{ name: 'milk.session' }" class="btn-primary">
          <Plus :size="16" />
          {{ t("dashboard.record_milk") }}
        </router-link>
        <router-link
          v-if="auth.hasPermission('animals.create')"
          :to="{ name: 'animals' }"
          class="btn-outline"
        >
          <Beef :size="16" />
          {{ t("dashboard.add_animal") }}
        </router-link>
        <router-link
          v-if="auth.hasPermission('alerts.view')"
          :to="{ name: 'alerts' }"
          class="icon-btn-bordered relative"
          :aria-label="t('dashboard.review_alerts')"
          :title="t('dashboard.review_alerts')"
        >
          <Bell :size="18" />
          <span
            v-if="attentionCount > 0"
            class="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-safety-500 px-1 text-[9px] font-bold text-white ring-2 ring-cream"
          >
            {{ attentionCount }}
          </span>
        </router-link>
      </div>
    </section>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-5">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in 4" :key="i" class="skeleton h-32"></div>
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="skeleton h-80 lg:col-span-2"></div>
        <div class="skeleton h-80"></div>
      </div>
    </div>

    <template v-else-if="stats">
      <!-- Attention strip -->
      <div
        v-if="attentionCount > 0"
        class="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-start gap-3">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <TriangleAlert :size="18" />
          </span>
          <div>
            <p class="text-sm font-semibold text-amber-900">{{ t("dashboard.attention") }}</p>
            <p class="text-xs text-amber-700">
              {{ stats.treatments_in_withholding }} {{ t("dashboard.withholding_active") }} ·
              {{ stats.vaccines_due }} {{ t("dashboard.vaccines_due_count") }}
            </p>
          </div>
        </div>
        <router-link
          v-if="auth.hasPermission('alerts.view')"
          :to="{ name: 'alerts' }"
          class="btn-sm btn-outline self-start bg-white/70 sm:self-auto"
        >
          {{ t("dashboard.review_alerts") }}
          <ArrowUpRight :size="14" />
        </router-link>
      </div>

      <!-- KPI cards -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="stat-card group">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ t("dashboard.total_animals") }}
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ stats.total_animals }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ t("dashboard.herd_breakdown") }}</p>
            </div>
            <span
              class="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:scale-105"
            >
              <Beef :size="21" />
            </span>
          </div>
          <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full w-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"></div>
          </div>
        </article>

        <article class="stat-card group">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ t("dashboard.lactating_cows") }}
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ stats.lactating_cows }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ t("dashboard.cows_milked") }}</p>
            </div>
            <span
              class="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:scale-105"
            >
              <Droplets :size="21" />
            </span>
          </div>
          <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full w-3/4 rounded-full bg-gradient-to-r from-sky-400 to-sky-600"></div>
          </div>
        </article>

        <article class="stat-card group">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ t("dashboard.todays_milk") }}
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {{ stats.todays_milk_litres.toFixed(1) }}
                <span class="text-base font-semibold text-slate-400">L</span>
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ stats.lactating_cows > 0 ? (stats.todays_milk_litres / stats.lactating_cows).toFixed(1) : "0.0" }}
                {{ t("dashboard.avg_per_cow") }}
              </p>
            </div>
            <span
              class="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:scale-105"
            >
              <Milk :size="21" />
            </span>
          </div>
          <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full w-2/3 rounded-full bg-gradient-to-r from-teal-400 to-teal-600"></div>
          </div>
        </article>

        <article class="stat-card group">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ t("dashboard.heats_this_week") }}
              </p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ stats.heats_this_week }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ t("dashboard.this_week") }}</p>
            </div>
            <span
              class="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-500 transition group-hover:scale-105"
            >
              <HeartPulse :size="21" />
            </span>
          </div>
          <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full w-1/2 rounded-full bg-gradient-to-r from-rose-300 to-rose-500"></div>
          </div>
        </article>
      </section>

      <!-- Weekly metrics -->
      <section class="card mt-4 p-0">
        <div class="grid grid-cols-2 divide-slate-100 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          <div
            v-for="(metric, index) in weeklyMetrics"
            :key="metric.label"
            class="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 lg:border-b-0"
            :class="index >= 3 ? 'sm:border-b-0' : ''"
          >
            <div class="min-w-0">
              <p class="truncate text-xs text-slate-500">{{ metric.label }}</p>
              <p
                class="mt-1 text-xl font-bold tracking-tight"
                :class="metric.alert ? 'text-amber-600' : 'text-slate-900'"
              >
                {{ metric.value }}
              </p>
            </div>
            <span
              v-if="metric.alert"
              class="badge-amber shrink-0"
            >
              {{ t("dashboard.attention") }}
            </span>
          </div>
        </div>
      </section>

      <!-- Milk trend + upcoming -->
      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <article class="card lg:col-span-2">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold tracking-tight text-slate-900">{{ t("dashboard.milk_trend") }}</h2>
              <p class="mt-0.5 text-xs text-slate-500">{{ t("dashboard.last_30_days") }}</p>
            </div>
            <div class="flex items-center gap-5">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {{ t("dashboard.total") }}
                </p>
                <p class="text-lg font-bold text-slate-900">
                  {{ milkTotal.toFixed(0) }} <span class="text-xs font-medium text-slate-400">L</span>
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {{ t("dashboard.avg_per_cow") }}
                </p>
                <p class="text-lg font-bold text-slate-900">
                  {{ milkAverage.toFixed(1) }} <span class="text-xs font-medium text-slate-400">L</span>
                </p>
              </div>
            </div>
          </div>

          <div v-if="hasMilkData" class="relative">
            <svg
              :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
              class="h-56 w-full sm:h-64"
              role="img"
              :aria-label="t('dashboard.milk_trend')"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="milk-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.28" />
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="milk-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#059669" />
                  <stop offset="100%" stop-color="#14b8a6" />
                </linearGradient>
              </defs>

              <line
                v-for="tick in yTicks"
                :key="`grid-${tick.y}`"
                :x1="PLOT_LEFT"
                :x2="PLOT_RIGHT"
                :y1="tick.y"
                :y2="tick.y"
                stroke="#e2e8f0"
                stroke-width="1"
                stroke-dasharray="4 5"
              />

              <path :d="areaPath" fill="url(#milk-fill)" />
              <path
                :d="linePath"
                fill="none"
                stroke="url(#milk-line)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />

              <circle
                v-if="latestPoint"
                :cx="latestPoint.x"
                :cy="latestPoint.y"
                r="5"
                fill="#059669"
                stroke="#ffffff"
                stroke-width="2.5"
                vector-effect="non-scaling-stroke"
              >
                <title>{{ latestPoint.date }} — {{ latestPoint.litres }} L</title>
              </circle>

              <circle
                v-for="(point, index) in chartPoints"
                :key="`point-${index}`"
                :cx="point.x"
                :cy="point.y"
                r="8"
                fill="transparent"
              >
                <title>{{ point.date }} — {{ point.litres }} L</title>
              </circle>
            </svg>

            <div class="mt-1 flex justify-between px-1 text-[10px] font-medium text-slate-400">
              <span v-for="label in xLabels" :key="label.x">{{ label.label }}</span>
            </div>

            <div class="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-brand-600"></span>
                {{ t("dashboard.litres") }}
              </span>
              <span class="text-slate-300">·</span>
              <span>0 – {{ maxLitres }} L</span>
            </div>
          </div>

          <div v-else class="empty-state border-slate-200 bg-slate-50/60 py-14">
            <span class="empty-state-icon"><BarChart3 :size="22" /></span>
            <p class="text-sm font-semibold text-slate-700">{{ t("dashboard.no_milk_data") }}</p>
            <p class="max-w-xs text-xs text-slate-500">{{ t("dashboard.no_milk_hint") }}</p>
            <router-link v-if="auth.hasPermission('milk.create')" :to="{ name: 'milk.session' }" class="btn-primary btn-sm mt-3">
              <Plus :size="14" />
              {{ t("dashboard.record_milk") }}
            </router-link>
          </div>
        </article>

        <article class="card flex flex-col">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold tracking-tight text-slate-900">
              {{ t("dashboard.upcoming_events") }}
            </h2>
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-400">
              <CalendarDays :size="17" />
            </span>
          </div>

          <div v-if="upcoming.length > 0" class="space-y-2.5">
            <div
              v-for="event in upcoming.slice(0, 6)"
              :key="`${event.type}-${event.date}-${event.animal_id}`"
              class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl" :class="eventIconClass(event.priority)">
                <Clock :size="16" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">{{ event.title }}</p>
                <p class="truncate text-xs text-slate-500">
                  {{ event.ear_tag ?? t("dashboard.general_event") }} · {{ event.date }}
                </p>
              </div>
              <span :class="priorityClass(event.priority)" class="shrink-0 capitalize">
                {{ event.priority }}
              </span>
            </div>
          </div>

          <div v-else class="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <span class="empty-state-icon"><CalendarDays :size="22" /></span>
            <p class="text-sm font-semibold text-slate-700">{{ t("dashboard.no_upcoming") }}</p>
            <p class="mt-1 max-w-[15rem] text-xs text-slate-500">{{ t("dashboard.no_events_hint") }}</p>
          </div>
        </article>
      </section>

      <!-- Breed share + composition -->
      <section class="mt-4 grid gap-4 lg:grid-cols-3">
        <article class="card">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold tracking-tight text-slate-900">
              {{ t("dashboard.breed_share") }}
            </h2>
          </div>

          <div v-if="breedShare.length > 0" class="space-y-3.5">
            <div v-for="breed in breedShare.slice(0, 6)" :key="breed.breed">
              <div class="mb-1.5 flex items-baseline justify-between gap-2">
                <span class="truncate text-sm text-slate-700">{{ breed.breed }}</span>
                <span class="text-xs font-semibold text-slate-900">{{ breed.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                  :style="{ width: `${breedMax > 0 ? Math.max((breed.count / breedMax) * 100, breed.count > 0 ? 4 : 0) : 0}%` }"
                ></div>
              </div>
            </div>
          </div>

          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t("common.no_data") }}</p>
        </article>

        <article class="card lg:col-span-2">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-semibold tracking-tight text-slate-900">
                {{ t("dashboard.herd_composition") }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ t("dashboard.total") }}: {{ compositionTotal }}
              </p>
            </div>
            <router-link :to="{ name: 'animals' }" class="btn-sm btn-ghost text-brand-700">
              {{ t("dashboard.view_animals") }}
              <ChevronRight :size="14" />
            </router-link>
          </div>

          <div v-if="composition.length > 0" class="table-wrap">
            <table class="data-table min-w-[560px]">
              <thead>
                <tr>
                  <th>{{ t("common.category") }}</th>
                  <th class="text-right">{{ t("dashboard.target") }}</th>
                  <th class="text-right">{{ t("common.count") }}</th>
                  <th class="text-right">{{ t("dashboard.variance") }}</th>
                  <th>{{ t("dashboard.note") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in composition" :key="item.category">
                  <td class="font-medium text-slate-900">{{ item.category }}</td>
                  <td class="text-right tabular-nums text-slate-500">{{ item.target }}</td>
                  <td class="text-right font-semibold tabular-nums">{{ item.count }}</td>
                  <td class="text-right">
                    <span
                      class="inline-flex min-w-[3rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                      :class="item.target - item.count <= 0 ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'"
                    >
                      {{ item.target - item.count > 0 ? "+" : "" }}{{ item.target - item.count }}
                    </span>
                  </td>
                  <td class="text-slate-500">{{ item.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t("common.no_data") }}</p>
        </article>
      </section>

      <!-- Footer quick links -->
      <section class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <router-link
          v-for="link in [
            { name: 'milk.session', label: t('nav.milk'), icon: Milk },
            { name: 'health', label: t('nav.health'), icon: Syringe },
            { name: 'reports', label: t('dashboard.view_reports'), icon: BarChart3 },
            { name: 'alerts', label: t('nav.alerts'), icon: Bell },
          ]"
          :key="link.name"
          :to="{ name: link.name }"
          class="card card-hover flex items-center gap-3 p-4"
        >
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-600">
            <component :is="link.icon" :size="17" />
          </span>
          <span class="truncate text-sm font-medium text-slate-700">{{ link.label }}</span>
          <ArrowUpRight :size="15" class="ml-auto shrink-0 text-slate-300" />
        </router-link>
      </section>
    </template>
  </div>
</template>
