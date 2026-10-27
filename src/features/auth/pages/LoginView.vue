<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { useAuth } from "@/features/auth/composables/useAuth";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const { login, loggingIn, error } = useAuth();

const loginId = ref("");
const password = ref("");
const showPassword = ref(false);

const redirect = router.currentRoute.value.query.redirect ?? "/";

const features = computed(() => [
  t("auth.feature_herd"),
  t("auth.feature_milk"),
  t("auth.feature_offline"),
]);

async function handleLogin(): Promise<void> {
  const result = await login(loginId.value, password.value);
  if (result) {
    await router.push(redirect as string);
  }
}

onMounted(() => {
  if (auth.isAuthenticated) {
    void router.push("/");
  }
});
</script>

<template>
  <div class="min-h-screen bg-cream lg:grid lg:grid-cols-[1.05fr_1fr]">
    <!-- Brand panel -->
    <section
      class="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between"
    >
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl"></div>
        <div class="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/10 blur-3xl"></div>
        <div
          class="absolute inset-0 opacity-[0.07]"
          style="background-image: linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px); background-size: 56px 56px;"
        ></div>
      </div>

      <div class="relative flex items-center gap-3">
        <span
          class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 text-ink-900 shadow-lg shadow-brand-900/50"
        >
          <Droplets :size="24" :stroke-width="2.2" />
        </span>
        <div>
          <p class="text-sm font-semibold tracking-tight">{{ t("app.name") }}</p>
          <p class="text-[10px] font-medium uppercase tracking-[0.24em] text-white/40">
            {{ t("app.tagline") }}
          </p>
        </div>
      </div>

      <div class="relative max-w-lg">
        <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-300">
          {{ t("app.tagline") }}
        </p>
        <h2 class="text-balance text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
          {{ t("auth.hero_title") }}
        </h2>
        <p class="mt-5 text-base leading-relaxed text-white/60">
          {{ t("auth.hero_subtitle") }}
        </p>

        <ul class="mt-8 space-y-3">
          <li v-for="feature in features" :key="feature" class="flex items-center gap-3 text-sm text-white/80">
            <span class="grid h-7 w-7 place-items-center rounded-full bg-brand-400/15 text-brand-300">
              <CheckCircle2 :size="15" />
            </span>
            {{ feature }}
          </li>
        </ul>
      </div>

      <div class="relative flex items-center gap-2 text-xs text-white/40">
        <ShieldCheck :size="15" class="text-brand-300" />
        {{ t("auth.secure_access") }}
      </div>
    </section>

    <!-- Form panel -->
    <section class="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
      <div class="mx-auto w-full max-w-sm">
        <!-- Mobile brand -->
        <div class="mb-10 flex items-center gap-3 lg:hidden">
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
          >
            <Droplets :size="21" />
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ t("app.name") }}</p>
            <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              {{ t("app.tagline") }}
            </p>
          </div>
        </div>

        <p class="eyebrow">{{ t("auth.welcome_back") }}</p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ t("auth.login") }}</h1>
        <p class="mt-2 text-sm leading-relaxed text-slate-500">
          {{ t("auth.sign_in_subtitle") }}
        </p>

        <div v-if="error" class="alert-error mt-6" role="alert">
          <span>{{ error }}</span>
        </div>

        <form class="mt-7 space-y-5" @submit.prevent="handleLogin">
          <div>
            <label class="label" for="login">{{ t("auth.email_or_phone") }}</label>
            <div class="relative">
              <UserRound
                :size="17"
                class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login"
                v-model="loginId"
                type="text"
                class="input pl-10"
                autocapitalize="none"
                autocomplete="username"
                spellcheck="false"
                required
                :placeholder="t('auth.email_or_phone')"
              />
            </div>
          </div>

          <div>
            <label class="label" for="password">{{ t("auth.password") }}</label>
            <div class="relative">
              <Lock
                :size="17"
                class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input pl-10 pr-12"
                autocomplete="current-password"
                required
                :placeholder="t('auth.password')"
              />
              <button
                type="button"
                class="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                :aria-label="t('auth.show_password')"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary btn-lg group w-full" :disabled="loggingIn">
            <Loader2 v-if="loggingIn" :size="18" class="animate-spin" />
            <span>{{ loggingIn ? t("auth.signing_in") : t("auth.login") }}</span>
            <ArrowRight
              v-if="!loggingIn"
              :size="18"
              class="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </form>

        <p class="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck :size="14" />
          {{ t("auth.secure_access") }}
        </p>
      </div>
    </section>
  </div>
</template>
