<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Droplets,
  LogOut,
  Settings,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { navGroups } from "@/app/navigation";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const isHome = computed(() => route.name === "home");
const showBack = computed(() => !isHome.value);

const title = computed(() => {
  const exact = navGroups
    .flatMap((group) => group.items)
    .find((item) => item.name === route.name);

  if (exact) {
    return t(exact.labelKey);
  }

  return (route.meta.title as string | undefined) ?? t("nav.overview");
});

const today = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date()),
);

const initials = computed(() => {
  const name = auth.user?.name?.trim() || "SW";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
});

const canSeeNotifications = computed(() => auth.hasPermission("notifications.view"));
const canSeeSettings = computed(() => auth.hasPermission("settings.update"));

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value;
}

function closeMenu(): void {
  menuOpen.value = false;
}

function handleOutsideClick(event: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu();
  }
}

async function logout(): Promise<void> {
  closeMenu();
  await auth.logout();
  await router.push({ name: "login" });
}

function goBack(): void {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push({ name: "home" });
  }
}

onMounted(() => document.addEventListener("click", handleOutsideClick));
onUnmounted(() => document.removeEventListener("click", handleOutsideClick));
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-slate-200/70 bg-cream/80 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/70"
  >
    <div class="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:h-[72px] lg:px-8">
      <!-- Mobile: back or logo -->
      <button
        v-if="showBack"
        type="button"
        class="icon-btn -ml-1 shrink-0 lg:hidden"
        :aria-label="t('common.back')"
        @click="goBack"
      >
        <ArrowLeft :size="20" />
      </button>
      <router-link
        v-else
        :to="{ name: 'home' }"
        class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm lg:hidden"
        :aria-label="t('app.name')"
      >
        <Droplets :size="18" />
      </router-link>

      <!-- Title -->
      <div class="min-w-0 flex-1">
        <p class="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 lg:block">
          {{ t("app.name") }}
        </p>
        <h1 class="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          {{ title }}
        </h1>
      </div>

      <!-- Date -->
      <span
        class="hidden items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 md:inline-flex"
      >
        {{ today }}
      </span>

      <!-- Notifications -->
      <router-link
        v-if="canSeeNotifications"
        :to="{ name: 'notifications' }"
        class="icon-btn-bordered relative shrink-0"
        :aria-label="t('notifications.title')"
        :title="t('notifications.title')"
      >
        <Bell :size="18" />
        <span class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white"></span>
      </router-link>

      <!-- User menu -->
      <div ref="menuRef" class="relative shrink-0">
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 transition hover:border-slate-300"
          :aria-expanded="menuOpen"
          aria-haspopup="menu"
          @click="toggleMenu"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-ink-700 to-ink-900 text-[11px] font-bold text-white"
          >
            {{ initials }}
          </span>
          <span class="hidden min-w-0 text-left sm:block">
            <span class="block max-w-[9rem] truncate text-xs font-semibold text-slate-900">
              {{ auth.user?.name ?? t("nav.profile") }}
            </span>
            <span class="block text-[10px] text-slate-500">{{ auth.role ?? "" }}</span>
          </span>
          <ChevronDown :size="14" class="hidden text-slate-400 sm:block" />
        </button>

        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="menuOpen"
            class="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift"
            role="menu"
          >
            <div class="border-b border-slate-100 px-3 py-2.5">
              <p class="truncate text-sm font-semibold text-slate-900">{{ auth.user?.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ auth.user?.email ?? auth.role }}</p>
            </div>
            <router-link
              v-if="canSeeSettings"
              :to="{ name: 'admin.settings' }"
              class="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              role="menuitem"
              @click="closeMenu"
            >
              <Settings :size="16" />
              {{ t("nav.settings") }}
            </router-link>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-safety-600 transition hover:bg-safety-50"
              role="menuitem"
              @click="logout"
            >
              <LogOut :size="16" />
              {{ t("nav.logout") }}
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>
