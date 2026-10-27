<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { CloudOff, RefreshCw, TriangleAlert, Wifi } from "lucide-vue-next";
import { useOfflineStore } from "@/stores/offline";

const { t } = useI18n();
const store = useOfflineStore();

const status = computed(() => {
  if (store.isSyncing) return "syncing";
  if (!store.isOnline) return "offline";
  if (store.pendingCount > 0) return "needs_attention";
  return "online";
});

const visible = computed(
  () => status.value === "offline" || status.value === "syncing" || store.pendingCount > 0,
);

const label = computed(() => {
  switch (status.value) {
    case "syncing":
      return t("common.syncing");
    case "offline":
      return t("common.offline");
    case "needs_attention":
      return t("common.needs_attention");
    default:
      return t("common.online");
  }
});

function handleOnline(): void {
  void store.setOnline(true);
}

function handleOffline(): void {
  void store.setOnline(false);
}

function sync(): void {
  if (!store.isSyncing) {
    void store.sync();
  }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  void store.refreshPendingCount();
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  refreshTimer = setInterval(() => void store.refreshPendingCount(), 10000);
});

onUnmounted(() => {
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <button
      v-if="visible"
      type="button"
      class="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-lift backdrop-blur transition hover:-translate-y-0.5 lg:bottom-6 lg:right-6"
      :class="{
        'border-safety-200 bg-safety-50/95 text-safety-700': status === 'offline',
        'border-amber-200 bg-amber-50/95 text-amber-700': status === 'needs_attention' || status === 'syncing',
      }"
      :title="label"
      @click="sync"
    >
      <RefreshCw v-if="status === 'syncing'" :size="14" class="animate-spin" />
      <CloudOff v-else-if="status === 'offline'" :size="14" />
      <TriangleAlert v-else-if="status === 'needs_attention'" :size="14" />
      <Wifi v-else :size="14" />
      <span>{{ label }}</span>
      <span
        v-if="store.pendingCount > 0"
        class="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white"
      >
        {{ store.pendingCount }}
      </span>
    </button>
  </transition>
</template>
