<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Grid2x2, X } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import {
  bottomNavItems,
  isNavActive,
  navGroups,
  type NavItem,
} from "@/app/navigation";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const sheetOpen = ref(false);

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

const primaryItems = computed(() =>
  bottomNavItems.filter((item) => canAccess(item)),
);

const moreGroups = computed(() =>
  navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          canAccess(item) &&
          !bottomNavItems.some((primary) => primary.name === item.name),
      ),
    }))
    .filter((group) => group.items.length > 0),
);

const moreActive = computed(() =>
  moreGroups.value.some((group) =>
    group.items.some((item) => isNavActive(route.name, item)),
  ),
);

function toggleSheet(): void {
  sheetOpen.value = !sheetOpen.value;
}

function closeSheet(): void {
  sheetOpen.value = false;
}

function goTo(item: NavItem): void {
  closeSheet();
  void router.push({ name: item.name });
}

watch(
  () => route.name,
  () => closeSheet(),
);

watch(
  sheetOpen,
  (open) => {
    document.body.style.overflow = open ? "hidden" : "";
  },
  { immediate: false },
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <nav
    class="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl lg:hidden"
    :aria-label="t('nav.main')"
  >
    <div class="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-1.5">
      <button
        v-for="item in primaryItems"
        :key="item.name"
        type="button"
        class="bottom-link"
        :class="{ 'bottom-link-active': isNavActive(route.name, item) }"
        :aria-current="isNavActive(route.name, item) ? 'page' : undefined"
        @click="goTo(item)"
      >
        <span
          class="grid h-7 w-10 place-items-center rounded-full transition"
          :class="isNavActive(route.name, item) ? 'bg-brand-100/80' : ''"
        >
          <component :is="item.icon" :size="19" :stroke-width="isNavActive(route.name, item) ? 2.4 : 1.9" />
        </span>
        <span class="leading-none">{{ t(item.labelKey) }}</span>
      </button>

      <button
        type="button"
        class="bottom-link"
        :class="{ 'bottom-link-active': moreActive }"
        :aria-expanded="sheetOpen"
        @click="toggleSheet"
      >
        <span
          class="grid h-7 w-10 place-items-center rounded-full transition"
          :class="moreActive ? 'bg-brand-100/80' : ''"
        >
          <Grid2x2 :size="19" :stroke-width="moreActive ? 2.4 : 1.9" />
        </span>
        <span class="leading-none">{{ t("nav.more") }}</span>
      </button>
    </div>
  </nav>

  <Teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="sheetOpen" class="fixed inset-0 z-50 lg:hidden">
        <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" @click="closeSheet"></div>

        <div
          class="safe-bottom absolute inset-x-0 bottom-0 max-h-[85vh] animate-sheet-up overflow-y-auto rounded-t-[1.75rem] border-t border-slate-200 bg-cream shadow-lift"
          role="dialog"
          aria-modal="true"
          :aria-label="t('nav.more')"
        >
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-cream/95 px-5 py-4 backdrop-blur">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ t("nav.more") }}</p>
              <p class="text-xs text-slate-500">{{ t("nav.all_destinations") }}</p>
            </div>
            <button type="button" class="icon-btn-bordered" :aria-label="t('common.cancel')" @click="closeSheet">
              <X :size="18" />
            </button>
          </div>

          <div class="px-4 pb-8 pt-4">
            <div v-for="group in moreGroups" :key="group.labelKey" class="mb-5 last:mb-0">
              <p class="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {{ t(group.labelKey) }}
              </p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="item in group.items"
                  :key="item.name"
                  type="button"
                  class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
                  :class="{ 'border-brand-300 bg-brand-50/60': isNavActive(route.name, item) }"
                  @click="goTo(item)"
                >
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-900/5 text-ink-800">
                    <component :is="item.icon" :size="18" />
                  </span>
                  <span class="truncate text-sm font-medium text-slate-700">{{ t(item.labelKey) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
