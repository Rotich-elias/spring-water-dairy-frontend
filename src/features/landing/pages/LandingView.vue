<script setup lang="ts">
import { computed, markRaw, onMounted, reactive, ref } from "vue";
import type { Component } from "vue";
import { useI18n } from "vue-i18n";
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
import {
  api,
  getFieldErrors,
  type Plan,
  type SiteItem,
} from "@/api";
import { useSiteStore } from "@/stores/site";

const { t } = useI18n();
const site = useSiteStore();

const year = new Date().getFullYear();

/* ------------------------------------------------------------------ */
/*  Public site content (API first, translations as fallback)          */
/* ------------------------------------------------------------------ */
const platformName = computed(() => site.text("platform_name", t("app.name")));
const parentCompany = computed(() => site.text("parent_company", t("app.parent_company")));
const parentUrl = computed(() => {
  const configured = site.content.parent_company_url;
  return typeof configured === "string" && configured.trim()
    ? configured
    : "https://teto.co.ke";
});
const poweredBy = computed(() => site.text("powered_by_label", t("app.powered_by")));
const businessName = computed(() => site.text("business_name", platformName.value));
const businessEmail = computed(() => site.text("business_email", t("landing.footer_contact")));
const businessPhone = computed(() => site.text("business_phone", ""));
const businessAddress = computed(() => site.text("business_address", ""));
const heroTitle = computed(() => site.text("hero_title", t("landing.hero_title")));
const heroSubtitle = computed(() => site.text("hero_subtitle", t("landing.hero_subtitle")));
const finalTitle = computed(() => site.text("final_title", t("landing.final_title")));
const finalSubtitle = computed(() => site.text("final_subtitle", t("landing.final_subtitle")));

interface Tile {
  icon: Component;
  title: string;
  body: string;
}

interface Faq {
  question: string;
  answer: string;
}

const ICONS: Record<string, Component> = {
  beef: markRaw(Beef),
  milk: markRaw(Milk),
  heart: markRaw(HeartPulse),
  health: markRaw(Stethoscope),
  stethoscope: markRaw(Stethoscope),
  reports: markRaw(FileChartColumnIncreasing),
  buildings: markRaw(Building2),
  building: markRaw(Building2),
  bell: markRaw(BellRing),
  clipboard: markRaw(ClipboardList),
  droplet: markRaw(Droplets),
  sprout: markRaw(Sprout),
  shield: markRaw(ShieldCheck),
  wifi: markRaw(WifiOff),
  pin: markRaw(MapPin),
  sparkles: markRaw(Sparkles),
};

const defaultFeatures: Tile[] = [
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
];

const defaultSteps: Tile[] = [
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
];

const defaultFaqs: Faq[] = [
  { question: t("landing.faq_q1"), answer: t("landing.faq_a1") },
  { question: t("landing.faq_q2"), answer: t("landing.faq_a2") },
  { question: t("landing.faq_q3"), answer: t("landing.faq_a3") },
  { question: t("landing.faq_q4"), answer: t("landing.faq_a4") },
];

const defaultTrust = [
  { icon: markRaw(MapPin) as Component, label: t("landing.trust_kenya") },
  { icon: markRaw(WifiOff) as Component, label: t("landing.trust_offline") },
  { icon: markRaw(ShieldCheck) as Component, label: t("landing.trust_roles") },
];

function asRecord(item: SiteItem): Record<string, unknown> {
  if (typeof item === "string") return { title: item };
  return item ?? {};
}

function textOf(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function iconOf(value: unknown, fallback: Component): Component {
  const key = textOf(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  return ICONS[key] ?? fallback;
}

function tilesFrom(items: SiteItem[], fallback: Tile[]): Tile[] {
  if (items.length === 0) return fallback;
  return items.map((item, index) => {
    const row = asRecord(item);
    return {
      icon: iconOf(row.icon ?? row.icon_name, fallback[index]?.icon ?? markRaw(Sparkles)),
      title: textOf(row.title ?? row.name ?? row.label, fallback[index]?.title ?? ""),
      body: textOf(row.body ?? row.description ?? row.text ?? row.subtitle, fallback[index]?.body ?? ""),
    };
  });
}

const features = computed(() => tilesFrom(site.items("feature_items"), defaultFeatures));
const steps = computed(() => tilesFrom(site.items("step_items"), defaultSteps));

const faqs = computed<Faq[]>(() => {
  const items = site.items("faq_items");
  if (items.length === 0) return defaultFaqs;
  return items.map((item, index) => {
    const row = asRecord(item);
    return {
      question: textOf(row.question ?? row.title, defaultFaqs[index]?.question ?? ""),
      answer: textOf(row.answer ?? row.body ?? row.description, defaultFaqs[index]?.answer ?? ""),
    };
  });
});

const trustItems = computed(() => {
  const items = site.items("trust_items");
  if (items.length === 0) return defaultTrust;
  return items.map((item, index) => {
    const row = asRecord(item);
    return {
      icon: iconOf(row.icon, defaultTrust[index % defaultTrust.length]?.icon ?? markRaw(Sparkles)),
      label: textOf(row.label ?? row.title ?? row.text, typeof item === "string" ? item : ""),
    };
  });
});

/* ------------------------------------------------------------------ */
/*  Plans                                                             */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Pre-sales contact form                                            */
/* ------------------------------------------------------------------ */
interface ContactForm {
  name: string;
  farm_name: string;
  email: string;
  phone: string;
  message: string;
}

const contact = reactive<ContactForm>({
  name: "",
  farm_name: "",
  email: "",
  phone: "",
  message: "",
});
const fieldErrors = ref<Record<string, string>>({});
const submitError = ref<string | null>(null);
const submitting = ref(false);
const submitted = ref(false);

function validateContact(): boolean {
  const errors: Record<string, string> = {};
  if (!contact.name.trim()) errors.name = t("landing.contact_validation_required");
  if (!contact.email.trim()) {
    errors.email = t("landing.contact_validation_required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    errors.email = t("landing.contact_validation_email");
  }
  if (!contact.message.trim()) {
    errors.message = t("landing.contact_validation_required");
  } else if (contact.message.trim().length < 10) {
    errors.message = t("landing.contact_validation_message");
  }
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function submitContact(): Promise<void> {
  if (!validateContact()) return;
  submitting.value = true;
  submitError.value = null;
  try {
    await api.post("/contact-inquiries", {
      name: contact.name.trim(),
      farm_name: contact.farm_name.trim() || undefined,
      email: contact.email.trim(),
      phone: contact.phone.trim() || undefined,
      message: contact.message.trim(),
    });
    submitted.value = true;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 429) {
      submitError.value = t("landing.contact_rate_limited");
    } else {
      const apiFields = getFieldErrors(error);
      if (apiFields) {
        const mapped: Record<string, string> = {};
        for (const [field, messages] of Object.entries(apiFields)) {
          mapped[field] = messages[0] ?? t("landing.contact_validation_required");
        }
        fieldErrors.value = mapped;
      }
      submitError.value = t("landing.contact_error");
    }
  } finally {
    submitting.value = false;
  }
}

function resetContact(): void {
  contact.name = "";
  contact.farm_name = "";
  contact.email = "";
  contact.phone = "";
  contact.message = "";
  fieldErrors.value = {};
  submitError.value = null;
  submitted.value = false;
}

onMounted(() => {
  void site.load();
  void loadPlans();
});
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
          <span class="text-sm font-bold tracking-tight sm:text-base">{{ platformName }}</span>
        </router-link>

        <div class="hidden items-center gap-1 md:flex">
          <a
            v-for="link in [
              { href: '#features', label: t('landing.nav_features') },
              { href: '#how-it-works', label: t('landing.nav_how') },
              { href: '#plans', label: t('landing.nav_plans') },
              { href: '#faq', label: t('landing.nav_faq') },
              { href: '#contact', label: t('landing.nav_contact') },
            ]"
            :key="link.href"
            :href="link.href"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-800"
          >
            {{ link.label }}
          </a>
        </div>

        <router-link :to="{ name: 'login' }" class="btn-primary btn-sm">
          {{ t("landing.log_in") }}
          <ArrowRight :size="15" />
        </router-link>
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
              {{ heroTitle }}
            </h1>
            <p class="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ heroSubtitle }}
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a href="#contact" class="btn-primary btn-lg group">
                {{ t("landing.cta_start") }}
                <ArrowRight :size="18" class="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#plans" class="btn-outline btn-lg">
                {{ t("landing.cta_plans") }}
              </a>
            </div>

            <ul class="mt-9 flex flex-wrap gap-2" :aria-label="t('landing.trust_label')">
              <li v-for="trust in trustItems" :key="trust.label" class="chip">
                <component :is="trust.icon" :size="14" class="text-brand-700" />
                {{ trust.label }}
              </li>
            </ul>
            <p class="mt-4 text-xs text-slate-500">{{ poweredBy }}</p>
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
                  <p class="text-sm font-semibold text-slate-900">{{ platformName }}</p>
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

            <a
              href="#contact"
              class="mt-7 w-full"
              :class="plan.code === 'growth' ? 'btn-primary' : 'btn-outline'"
            >
              {{ t("landing.choose_plan") }}
              <ArrowRight :size="16" />
            </a>
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

      <!-- Contact / pre-sales -->
      <section id="contact" class="page scroll-mt-24 py-16 lg:py-24">
        <div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p class="eyebrow">{{ t("landing.contact_eyebrow") }}</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {{ t("landing.contact_title") }}
            </h2>
            <p class="mt-4 text-base leading-relaxed text-slate-600">
              {{ t("landing.contact_subtitle") }}
            </p>
            <ul class="mt-6 space-y-2 text-sm text-slate-600">
              <li v-if="businessEmail" class="flex items-center gap-2">
                <Check :size="15" class="text-brand-700" />
                <a :href="`mailto:${businessEmail}`" class="hover:underline">{{ businessEmail }}</a>
              </li>
              <li v-if="businessPhone" class="flex items-center gap-2">
                <Check :size="15" class="text-brand-700" />
                {{ businessPhone }}
              </li>
              <li v-if="businessAddress" class="flex items-start gap-2">
                <MapPin :size="15" class="mt-0.5 shrink-0 text-brand-700" />
                {{ businessAddress }}
              </li>
            </ul>
          </div>

          <div class="card p-6 sm:p-8">
            <div v-if="submitted" class="alert-success" role="status">
              <div>
                <p class="font-semibold">{{ t("landing.contact_success_title") }}</p>
                <p class="mt-1 text-sm">{{ t("landing.contact_success_body") }}</p>
                <button type="button" class="btn-outline btn-sm mt-4" @click="resetContact">
                  {{ t("landing.contact_another") }}
                </button>
              </div>
            </div>

            <form v-else class="space-y-5" novalidate @submit.prevent="submitContact">
              <div v-if="submitError" class="alert-error" role="alert">
                <span>{{ submitError }}</span>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="label" for="contact-name">{{ t("landing.contact_name") }}</label>
                  <input
                    id="contact-name"
                    v-model="contact.name"
                    class="input"
                    autocomplete="name"
                    required
                    :aria-invalid="!!fieldErrors.name"
                  />
                  <p v-if="fieldErrors.name" class="mt-1 text-xs text-safety-600">
                    {{ fieldErrors.name }}
                  </p>
                </div>
                <div>
                  <label class="label" for="contact-farm">{{ t("landing.contact_farm_name") }}</label>
                  <input id="contact-farm" v-model="contact.farm_name" class="input" autocomplete="organization" />
                  <p v-if="fieldErrors.farm_name" class="mt-1 text-xs text-safety-600">
                    {{ fieldErrors.farm_name }}
                  </p>
                </div>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="label" for="contact-email">{{ t("landing.contact_email") }}</label>
                  <input
                    id="contact-email"
                    v-model="contact.email"
                    type="email"
                    class="input"
                    autocomplete="email"
                    required
                    :aria-invalid="!!fieldErrors.email"
                  />
                  <p v-if="fieldErrors.email" class="mt-1 text-xs text-safety-600">
                    {{ fieldErrors.email }}
                  </p>
                </div>
                <div>
                  <label class="label" for="contact-phone">{{ t("landing.contact_phone") }}</label>
                  <input
                    id="contact-phone"
                    v-model="contact.phone"
                    type="tel"
                    class="input"
                    autocomplete="tel"
                  />
                  <p v-if="fieldErrors.phone" class="mt-1 text-xs text-safety-600">
                    {{ fieldErrors.phone }}
                  </p>
                </div>
              </div>

              <div>
                <label class="label" for="contact-message">{{ t("landing.contact_message") }}</label>
                <textarea
                  id="contact-message"
                  v-model="contact.message"
                  class="input min-h-[140px] resize-y"
                  rows="5"
                  required
                  :aria-invalid="!!fieldErrors.message"
                ></textarea>
                <p v-if="fieldErrors.message" class="mt-1 text-xs text-safety-600">
                  {{ fieldErrors.message }}
                </p>
              </div>

              <button type="submit" class="btn-primary w-full" :disabled="submitting">
                {{ submitting ? t("landing.contact_sending") : t("landing.contact_submit") }}
                <ArrowRight v-if="!submitting" :size="16" />
              </button>
            </form>
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
            {{ finalTitle }}
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            {{ finalSubtitle }}
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#contact" class="btn-primary btn-lg group">
              {{ t("landing.cta_start") }}
              <ArrowRight :size="18" class="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#plans" class="btn btn-lg border border-white/30 text-white hover:bg-white/10">
              {{ t("landing.cta_plans") }}
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200/70 py-10">
      <div class="page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-3">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
            <Droplets :size="18" />
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ platformName }}</p>
            <p class="text-xs text-slate-500">{{ poweredBy }}</p>
          </div>
        </div>

        <div class="text-xs text-slate-500">
          <p class="font-semibold text-slate-700">{{ businessName }}</p>
          <p v-if="businessAddress" class="mt-1">{{ businessAddress }}</p>
          <p v-if="businessPhone" class="mt-1">{{ businessPhone }}</p>
        </div>

        <div class="flex flex-col gap-2 text-xs text-slate-500">
          <a
            v-if="businessEmail"
            :href="`mailto:${businessEmail}`"
            class="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            {{ businessEmail }}
          </a>
          <a
            :href="parentUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="underline-offset-2 hover:underline"
          >
            {{ t("landing.footer_parent_label") }}: {{ parentCompany }}
          </a>
          <router-link
            :to="{ name: 'seller.login', query: { redirect: '/seller' } }"
            class="text-slate-500 underline-offset-2 hover:underline"
          >
            {{ t("landing.footer_seller_login") }}
          </router-link>
        </div>

        <div class="text-xs text-slate-500 sm:text-right">
          <p>© {{ year }} {{ platformName }}</p>
          <p>{{ t("landing.footer_rights") }}</p>
          <p class="mt-1">{{ poweredBy }}</p>
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
