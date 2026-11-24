<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from "vue";
import type { Component } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  ArrowRight,
  Beef,
  BellRing,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Droplets,
  FileChartColumnIncreasing,
  HeartPulse,
  MapPin,
  Milk,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Stethoscope,
  WifiOff,
} from "lucide-vue-next";
import { api, type Plan } from "@/api";

const { t } = useI18n();
const router = useRouter();

const year = new Date().getFullYear();
const contactEmail = computed(() => t("landing.footer_contact"));

interface Tile {
  icon: Component;
  title: string;
  body: string;
}

const features = computed<Tile[]>(() => [
  {
    icon: markRaw(Beef),
    title: t("landing.feature_herd_title"),
    body: t("landing.feature_herd_body"),
  },
  {
    icon: markRaw(Milk),
    title: t("landing.feature_milk_title"),
    body: t("landing.feature_milk_body"),
  },
  {
    icon: markRaw(HeartPulse),
    title: t("landing.feature_breeding_title"),
    body: t("landing.feature_breeding_body"),
  },
  {
    icon: markRaw(Stethoscope),
    title: t("landing.feature_health_title"),
    body: t("landing.feature_health_body"),
  },
  {
    icon: markRaw(FileChartColumnIncreasing),
    title: t("landing.feature_reports_title"),
    body: t("landing.feature_reports_body"),
  },
  {
    icon: markRaw(Building2),
    title: t("landing.feature_multifarm_title"),
    body: t("landing.feature_multifarm_body"),
  },
]);

const steps = computed<Tile[]>(() => [
  {
    icon: markRaw(Building2),
    title: t("landing.how_step1_title"),
    body: t("landing.how_step1_body"),
  },
  {
    icon: markRaw(Beef),
    title: t("landing.how_step2_title"),
    body: t("landing.how_step2_body"),
  },
  {
    icon: markRaw(ClipboardList),
    title: t("landing.how_step3_title"),
    body: t("landing.how_step3_body"),
  },
  {
    icon: markRaw(BellRing),
    title: t("landing.how_step4_title"),
    body: t("landing.how_step4_body"),
  },
]);

const faqs = computed(() => [
  { question: t("landing.faq_q1"), answer: t("landing.faq_a1") },
  { question: t("landing.faq_q2"), answer: t("landing.faq_a2") },
  { question: t("landing.faq_q3"), answer: t("landing.faq_a3") },
  { question: t("landing.faq_q4"), answer: t("landing.faq_a4") },
]);

const plans = ref<Plan[]>([]);
const loadingPlans = ref(true);
const plansFailed = ref(false);

async function loadPlans(): Promise<void> {
  loadingPlans.value = true;
  plansFailed.value = false;
  try {
    const response = await api.get<{ data: Plan[] }>("plans");
    plans.value = Array.isArray(response.data?.data) ? response.data.data : [];
  } catch {
    plans.value = [];
    plansFailed.value = true;
  } finally {
    loadingPlans.value = false;
  }
}

onMounted(loadPlans);

function formatPrice(price: number): string {
  if (Number(price) === 0) return t("landing.free");
  return `KES ${Number(price).toLocaleString("en-KE")} ${t("landing.per_month")}`;
}

function formatLimit(value: number | null | undefined): string {
  if (value === null || value === undefined) return t("landing.unlimited");
  return Number(value).toLocaleString("en-KE");
}

function planLimits(plan: Plan): { label: string; value: string }[] {
  const limits = plan.limits ?? {};
  return [
    { label: t("landing.limit_animals"), value: formatLimit(limits.animals) },
    { label: t("landing.limit_users"), value: formatLimit(limits.users) },
    {
      label: t("landing.limit_milk"),
      value: formatLimit(limits.milk_records_per_month),
    },
    { label: t("landing.limit_alerts"), value: formatLimit(limits.alert_rules) },
  ];
}

function goToLogin(planCode?: string): void {
  void router.push({
    name: "login",
    query: planCode ? { plan: planCode } : undefined,
  });
}
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-slate-200/70 bg-cream/90 backdrop-blur">
      <nav
        class="page flex flex-wrap items-center justify-between gap-3 py-3"
        :aria-label="t('landing.nav_label')"
      >
        <router-link
          :to="{ name: 'landing' }"
          class="flex items-center gap-2.5 rounded-xl text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
          >
            <Droplets :size="20" :stroke-width="2.2" />
          </span>
          <span class="text-sm font-bold tracking-tight sm:text-base">{{ t("app.name") }}</span>
        </router-link>

        <div class="hidden items-center gap-1 md:flex">
          <a
            v-for="link in [
              { href: '#features', label: t('landing.nav_features') },
              { href: '#how-it-works', label: t('landing.nav_how') },
              { href: '#plans', label: t('landing.nav_plans') },
              { href: '#faq', label: t('landing.nav_faq') },
            ]"
            :key="link.href"
            :href="link.href"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-800"
          >
            {{ link.label }}
          </a>
        </div>

        <button type="button" class="btn-primary btn-sm" @click="goToLogin()">
          {{ t("landing.log_in") }}
          <ArrowRight :size="15" />
        </button>
      </nav>
    </header>

    <main>
      <!-- Hero -->
      <section class="page pb-14 pt-12 sm:pt-16 lg:pb-20 lg:pt-20">
        <div class="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p class="eyebrow flex items-center gap-2">
              <Sparkles :size="14" />
              {{ t("landing.hero_eyebrow") }}
            </p>
            <h1
              class="mt-4 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl"
            >
              {{ t("landing.hero_title") }}
            </h1>
            <p class="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t("landing.hero_subtitle") }}
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <button type="button" class="btn-primary btn-lg group" @click="goToLogin()">
                {{ t("landing.cta_start") }}
                <ArrowRight :size="18" class="transition-transform group-hover:translate-x-0.5" />
              </button>
              <a href="#plans" class="btn-outline btn-lg">
                {{ t("landing.cta_plans") }}
              </a>
            </div>

            <ul class="mt-9 flex flex-wrap gap-2" :aria-label="t('landing.trust_label')">
              <li class="chip">
                <MapPin :size="14" class="text-brand-700" />
                {{ t("landing.trust_kenya") }}
              </li>
              <li class="chip">
                <WifiOff :size="14" class="text-brand-700" />
                {{ t("landing.trust_offline") }}
              </li>
              <li class="chip">
                <ShieldCheck :size="14" class="text-brand-700" />
                {{ t("landing.trust_roles") }}
              </li>
            </ul>
          </div>

          <!-- Decorative product preview -->
          <div class="relative">
            <div
              class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-200/60 to-teal-100/50 blur-2xl"
              aria-hidden="true"
            ></div>
            <div class="card relative overflow-hidden p-0 shadow-lift">
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div class="flex items-center gap-2.5">
                  <span
                    class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white"
                  >
                    <Droplets :size="18" />
                  </span>
                  <p class="text-sm font-semibold text-slate-900">{{ t("app.name") }}</p>
                </div>
                <span class="badge-brand">
                  <span class="badge-dot"></span>
                  {{ t("landing.hero_preview_status") }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2.5 p-5 sm:gap-3">
                <div class="rounded-xl bg-brand-50 p-3">
                  <Beef :size="17" class="text-brand-700" />
                  <p class="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">128</p>
                  <p class="text-[11px] font-medium text-slate-500">
                    {{ t("landing.hero_preview_herd") }}
                  </p>
                </div>
                <div class="rounded-xl bg-brand-50 p-3">
                  <Milk :size="17" class="text-brand-700" />
                  <p class="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">640</p>
                  <p class="text-[11px] font-medium text-slate-500">
                    {{ t("landing.hero_preview_milk") }}
                  </p>
                </div>
                <div class="rounded-xl bg-brand-50 p-3">
                  <BellRing :size="17" class="text-brand-700" />
                  <p class="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">2</p>
                  <p class="text-[11px] font-medium text-slate-500">
                    {{ t("landing.hero_preview_alerts") }}
                  </p>
                </div>
              </div>

              <div class="border-t border-slate-100 bg-white/60 px-5 py-4">
                <div class="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>{{ t("landing.hero_preview_progress") }}</span>
                  <span>68%</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div class="h-full w-[68%] rounded-full bg-brand-600"></div>
                </div>
                <p class="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Check :size="14" class="text-brand-700" />
                  {{ t("landing.hero_preview_synced") }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Why / features -->
      <section id="features" class="page scroll-mt-24 pb-16 lg:pb-24">
        <div class="mx-auto max-w-2xl">
          <p class="eyebrow">{{ t("landing.why_eyebrow") }}</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {{ t("landing.why_title") }}
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600">
            {{ t("landing.why_subtitle") }}
          </p>
        </div>

        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="feature in features" :key="feature.title" class="card card-hover">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <component :is="feature.icon" :size="21" :stroke-width="1.9" />
            </span>
            <h3 class="mt-4 text-base font-semibold text-slate-900">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ feature.body }}</p>
          </article>
        </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="scroll-mt-24 border-y border-slate-200/70 bg-white py-16 lg:py-24">
        <div class="page">
          <div class="mx-auto max-w-2xl text-center">
            <p class="eyebrow">{{ t("landing.how_eyebrow") }}</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {{ t("landing.how_title") }}
            </h2>
            <p class="mt-4 text-base leading-relaxed text-slate-600">
              {{ t("landing.how_subtitle") }}
            </p>
          </div>

          <ol class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="(step, index) in steps" :key="step.title" class="card card-hover relative">
              <span
                class="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white"
              >
                {{ index + 1 }}
              </span>
              <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <component :is="step.icon" :size="21" :stroke-width="1.9" />
              </span>
              <h3 class="mt-4 pr-8 text-base font-semibold text-slate-900">{{ step.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ step.body }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- Plans -->
      <section id="plans" class="page scroll-mt-24 py-16 lg:py-24">
        <div class="mx-auto max-w-2xl text-center">
          <p class="eyebrow">{{ t("landing.plans_eyebrow") }}</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {{ t("landing.plans_title") }}
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600">
            {{ t("landing.plans_subtitle") }}
          </p>
        </div>

        <div v-if="loadingPlans" class="mt-12 grid gap-5 lg:grid-cols-3" aria-busy="true">
          <span class="sr-only">{{ t("landing.plans_loading") }}</span>
          <div v-for="n in 3" :key="n" class="card space-y-4">
            <div class="skeleton h-5 w-1/2"></div>
            <div class="skeleton h-9 w-2/3"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="space-y-3 pt-2">
              <div v-for="row in 4" :key="row" class="skeleton h-4 w-4/5"></div>
            </div>
            <div class="skeleton h-11 w-full"></div>
          </div>
        </div>

        <div v-else-if="plansFailed" class="alert-error mx-auto mt-12 max-w-lg" role="alert">
          <span class="flex-1">{{ t("landing.plans_load_error") }}</span>
          <button type="button" class="btn-outline btn-sm" @click="loadPlans">
            <RefreshCw :size="14" />
            {{ t("landing.retry") }}
          </button>
        </div>

        <p v-else-if="plans.length === 0" class="card mx-auto mt-12 max-w-lg text-center text-slate-600">
          {{ t("landing.plans_empty") }}
        </p>

        <div v-else class="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          <article
            v-for="plan in plans"
            :key="plan.id"
            class="card relative flex flex-col p-6"
            :class="
              plan.code === 'growth'
                ? 'border-brand-500 ring-2 ring-brand-500/20'
                : 'card-hover'
            "
          >
            <span
              v-if="plan.code === 'growth'"
              class="badge-brand absolute -top-3 left-6 shadow-sm"
            >
              <Sparkles :size="12" />
              {{ t("landing.most_popular") }}
            </span>

            <h3 class="text-lg font-bold text-slate-900">{{ plan.name }}</h3>
            <p class="mt-3 text-2xl font-bold tracking-tight text-brand-800">
              {{ formatPrice(plan.price_monthly) }}
            </p>
            <p class="mt-3 min-h-[3rem] text-sm leading-relaxed text-slate-600">
              {{ plan.description }}
            </p>

            <ul class="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <li
                v-for="limit in planLimits(plan)"
                :key="limit.label"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="flex items-center gap-2 text-slate-600">
                  <Check :size="15" class="shrink-0 text-brand-700" />
                  {{ limit.label }}
                </span>
                <span class="font-semibold text-slate-900">{{ limit.value }}</span>
              </li>
            </ul>

            <button
              type="button"
              class="mt-7 w-full"
              :class="plan.code === 'growth' ? 'btn-primary' : 'btn-outline'"
              @click="goToLogin(plan.code)"
            >
              {{ t("landing.choose_plan") }}
              <ArrowRight :size="16" />
            </button>
          </article>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="scroll-mt-24 border-t border-slate-200/70 bg-white py-16 lg:py-24">
        <div class="page">
          <div class="mx-auto max-w-2xl text-center">
            <p class="eyebrow">{{ t("landing.faq_eyebrow") }}</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {{ t("landing.faq_title") }}
            </h2>
          </div>

          <div class="mx-auto mt-10 max-w-3xl space-y-3">
            <details
              v-for="faq in faqs"
              :key="faq.question"
              class="card group p-0 open:border-brand-300"
            >
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 sm:text-base"
              >
                {{ faq.question }}
                <ChevronDown
                  :size="18"
                  class="shrink-0 text-brand-700 transition-transform group-open:rotate-180"
                />
              </summary>
              <p class="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                {{ faq.answer }}
              </p>
            </details>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="relative overflow-hidden bg-ink-900 py-16 text-white lg:py-20">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"></div>
          <div class="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl"></div>
        </div>
        <div class="page relative text-center">
          <Droplets :size="30" class="mx-auto text-brand-300" />
          <h2 class="mx-auto mt-5 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {{ t("landing.final_title") }}
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            {{ t("landing.final_subtitle") }}
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" class="btn-primary btn-lg group" @click="goToLogin()">
              {{ t("landing.cta_start") }}
              <ArrowRight :size="18" class="transition-transform group-hover:translate-x-0.5" />
            </button>
            <a href="#plans" class="btn btn-lg border border-white/30 text-white hover:bg-white/10">
              {{ t("landing.cta_plans") }}
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200/70 py-10">
      <div class="page flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
            <Droplets :size="18" />
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ t("app.name") }}</p>
            <p class="text-xs text-slate-500">{{ t("app.tagline") }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2 text-xs text-slate-500 sm:items-end">
          <a
            :href="`mailto:${contactEmail}`"
            class="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            {{ contactEmail }}
          </a>
          <p>© {{ year }} {{ t("landing.footer_rights") }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
summary::-webkit-details-marker {
  display: none;
}
</style>
