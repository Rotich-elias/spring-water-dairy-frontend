<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { ArrowRight, LogOut, X } from "lucide-vue-next";
import AppSidebar from "@/components/AppSidebar.vue";
import BottomNav from "@/components/BottomNav.vue";
import SyncChip from "@/components/SyncChip.vue";
import TopBar from "@/components/TopBar.vue";
import { readImpersonation } from "@/api";
import { useSellerStore } from "@/stores/seller";

const route = useRoute();
const { t, locale } = useI18n();
const seller = useSellerStore();

const showShell = computed(
  () => route.name !== "login" && route.name !== "seller.login" && route.name !== "landing",
);

const impersonation = computed(() => readImpersonation());
const returning = ref(false);

const expiryLabel = computed(() => {
  const value = impersonation.value?.expires_at;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale.value, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
});

async function returnToSeller(): Promise<void> {
  returning.value = true;
  await seller.returnToSellerConsole();
}

/* Friendly one-time notices from the route guard / impersonation flow. */
const noticeDismissed = ref(false);
const noticeKey = computed(() => {
  if (noticeDismissed.value) return null;
  const notice = route.query.notice;
  if (notice === "seller_access_required") return "seller.access_required_notice";
  if (notice === "impersonation_ended") return "seller.session_expired";
  if (notice === "impersonation_returned") return "seller.session_returned";
  return null;
});
</script>

<template>
  <div class="min-h-screen bg-cream" :class="impersonation ? 'pt-[52px]' : ''">
    <div
      v-if="impersonation"
      class="fixed inset-x-0 top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900 shadow-sm sm:text-sm"
      role="status"
    >
      <span>
        {{ t("seller.impersonation.banner", {
          user: impersonation.user,
          tenant: impersonation.tenant,
        }) }}
      </span>
      <span v-if="expiryLabel" class="text-amber-800">
        {{ t("seller.impersonation.expires", { time: expiryLabel }) }}
      </span>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-white/70 px-2 py-1 font-semibold transition hover:bg-white disabled:opacity-50"
        :disabled="returning"
        @click="returnToSeller"
      >
        <LogOut :size="13" />
        {{ returning ? t("seller.impersonation.returning") : t("seller.impersonation.return") }}
        <ArrowRight v-if="!returning" :size="13" />
      </button>
    </div>

    <div
      v-else-if="noticeKey"
      class="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 border-b border-brand-200 bg-brand-50 px-4 py-2 text-center text-xs font-medium text-brand-900 shadow-sm sm:text-sm"
      role="status"
    >
      <span>{{ t(noticeKey) }}</span>
      <button
        type="button"
        class="rounded-lg p-1 text-brand-700 transition hover:bg-brand-100"
        :aria-label="t('common.cancel')"
        @click="noticeDismissed = true"
      >
        <X :size="15" />
      </button>
    </div>

    <template v-if="showShell">
      <AppSidebar />

      <div class="flex min-h-screen flex-col lg:pl-[var(--sidebar-width)]">
        <TopBar />

        <main class="flex-1 pb-24 lg:pb-10">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>

      <BottomNav />
      <SyncChip />
    </template>

    <router-view v-else />
  </div>
</template>

<style scoped>
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-leave-active {
  transition: opacity 0.12s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
}
</style>
