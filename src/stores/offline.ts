import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  pushPendingWrites,
  pullChanges,
  pendingWriteCount,
  queueWrite,
  getCachedEntity,
  cacheEntity,
} from "@/offline/sync";

export const useOfflineStore = defineStore("offline", () => {
  const isOnline = ref(navigator.onLine);
  const isSyncing = ref(false);
  const pendingCount = ref(0);
  const lastSync = ref<string | null>(null);
  const syncError = ref<string | null>(null);

  const hasPending = computed(() => pendingCount.value > 0);

  // Refresh pending count from IndexedDB.
  async function refreshPendingCount(): Promise<void> {
    pendingCount.value = await pendingWriteCount();
  }

  async function setOnline(value: boolean): Promise<void> {
    isOnline.value = value;
    if (value) {
      await sync();
    }
  }

  /**
   * Full sync cycle: push pending writes, then pull changes.
   */
  async function sync(): Promise<void> {
    if (isSyncing.value) return;
    isSyncing.value = true;
    syncError.value = null;

    try {
      // Push pending writes first.
      const pushed = await pushPendingWrites();
      refreshPendingCount();

      // Then pull changes.
      const since = lastSync.value ?? undefined;
      await pullChanges(since);
      lastSync.value = new Date().toISOString();

      if (pushed > 0) {
        // After pushing, refresh pending count again.
        await refreshPendingCount();
      }
    } catch (e: any) {
      syncError.value = e?.message ?? "Sync failed.";
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * Queue a failed API write for retry when back online.
   */
  async function queueFailedWrite(write: {
    method: "post" | "put" | "patch" | "delete";
    url: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<void> {
    await queueWrite(write);
    await refreshPendingCount();
  }

  async function getCached(type: string, recordId: number): Promise<any | null> {
    return await getCachedEntity(type, recordId);
  }

  async function setCached(type: string, recordId: number, data: any): Promise<void> {
    await cacheEntity(type, recordId, data);
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    hasPending,
    lastSync,
    syncError,
    setOnline,
    sync,
    queueFailedWrite,
    getCached,
    setCached,
    refreshPendingCount,
  };
});
