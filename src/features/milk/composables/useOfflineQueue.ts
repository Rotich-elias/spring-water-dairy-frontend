import { computed } from "vue";
import { useOfflineStore } from "@/stores/offline";

/**
 * Backwards-compatible wrapper around the shared offline store.
 *
 * The app has a single IndexedDB queue (`SwdDb.pendingWrites`) managed by
 * `stores/offline.ts`. This composable keeps the milk session API stable while
 * delegating all queueing and replay to that single store.
 */
export function useOfflineQueue() {
  const store = useOfflineStore();

  async function enqueue(item: {
    endpoint: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
  }) {
    await store.queueFailedWrite({
      method: item.method.toLowerCase() as "post" | "put" | "patch" | "delete",
      url: item.endpoint,
      body: item.body,
      headers: item.headers,
    });
  }

  async function replayPending() {
    await store.sync();
  }

  return {
    enqueue,
    replayPending,
    pendingCount: computed(() => store.pendingCount),
    isSyncing: computed(() => store.isSyncing),
    syncErrors: computed(() => (store.syncError ? [store.syncError] : [])),
  };
}
