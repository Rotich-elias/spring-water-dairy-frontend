<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Droplets, LogOut, Wifi } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { isNavActive, navGroups, type NavItem } from "@/app/navigation";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const initials = computed(() => {
  const name = auth.user?.name?.trim() || "SW";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
});

function canAccess(item: NavItem): boolean {
  if (item.roles && item.roles.length > 0) {
    if (!item.roles.includes(String(auth.role ?? ""))) {
      return false;
    }
  }

  if (item.permission && !auth.hasPermission(item.permission)) {
    return false;
  }

  return true;
}

const visibleGroups = computed(() =>
  navGroups
    .map((group) => ({ ...group, items: group.items.filter(canAccess) }))
    .filter((group) => group.items.length > 0),
);

async function logout(): Promise<void> {
  await auth.logout();
  await router.push({ name: "login" });
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col overflow-hidden bg-ink-900 text-white shadow-lift lg:flex"
  >
    <!-- Ambient background -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"></div>
      <div class="absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent"></div>
    </div>

    <router-link
      :to="{ name: 'home' }"
      class="relative flex items-center gap-3 px-5 pb-5 pt-7"
      :aria-label="t('app.name')"
    >
      <span
        class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 text-ink-900 shadow-lg shadow-brand-900/40"
      >
        <Droplets :size="22" :stroke-width="2.3" />
      </span>
      <span class="min-w-0">
        <span class="block truncate text-sm font-semibold tracking-tight text-white">
          {{ t("app.name") }}
        </span>
        <span class="block text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
          {{ t("app.tagline") }}
        </span>
      </span>
    </router-link>

    <nav class="relative flex-1 overflow-y-auto px-3 pb-4 no-scrollbar" :aria-label="t('nav.main')">
      <div v-for="group in visibleGroups" :key="group.labelKey">
        <p class="nav-section-label">{{ t(group.labelKey) }}</p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.name">
            <router-link
              :to="{ name: item.name }"
              class="nav-link group"
              :class="{ 'nav-link-active': isNavActive(route.name, item) }"
            >
              <component
                :is="item.icon"
                :size="18"
                :stroke-width="1.9"
                class="shrink-0 transition group-hover:scale-110"
              />
              <span class="truncate">{{ t(item.labelKey) }}</span>
              <span
                v-if="isNavActive(route.name, item)"
                class="ml-auto h-1.5 w-1.5 rounded-full bg-brand-300"
              ></span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="relative border-t border-white/10 p-3">
      <div class="mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] font-medium text-white/60">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-brand-400"></span>
        </span>
        <span>{{ t("common.online") }}</span>
        <Wifi :size="14" class="ml-auto text-white/40" />
      </div>

      <div class="flex items-center gap-3 rounded-xl px-2 py-2">
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200 ring-1 ring-inset ring-white/10"
        >
          {{ initials }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-xs font-semibold text-white">
            {{ auth.user?.name ?? t("nav.profile") }}
          </span>
          <span class="block truncate text-[11px] text-white/45">
            {{ auth.role ?? t("nav.profile") }}
          </span>
        </span>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          :aria-label="t('nav.logout')"
          :title="t('nav.logout')"
          @click="logout"
        >
          <LogOut :size="17" />
        </button>
      </div>
    </div>
  </aside>
</template>
