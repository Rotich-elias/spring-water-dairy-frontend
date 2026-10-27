import { api } from "@/api";
import { db, type PendingWrite } from "@/offline/db";

const MAX_RETRIES = 5;

/**
 * Push all pending writes to the backend.
 * Returns the number of successfully synced writes.
 */
export async function pushPendingWrites(): Promise<number> {
  const pending = await db.pendingWrites.toArray();
  if (pending.length === 0) return 0;

  let synced = 0;
  const stillPending: PendingWrite[] = [];

  for (const write of pending) {
    try {
      await api.request({
        method: write.method,
        url: write.url,
        data: write.body,
        headers: write.headers,
      });
      await db.pendingWrites.delete(write.id!);
      synced++;
    } catch (e: any) {
      const retries = (write.retries ?? 0) + 1;
      if (retries >= MAX_RETRIES) {
        // Give up on this write — keep it in the queue but stop retrying.
        await db.pendingWrites.update(write.id!, { retries });
        stillPending.push({ ...write, retries });
      } else {
        await db.pendingWrites.update(write.id!, { retries });
        stillPending.push({ ...write, retries });
      }
    }
  }

  return synced;
}

/**
 * Pull changes from the backend since the given timestamp.
 * Returns the timestamp to use for the next pull.
 */
export async function pullChanges(since?: string): Promise<string> {
  const res = await api.get<{ data: any }>("/sync/changes", {
    params: { since },
  });
  const data = res.data.data;

  // Cache updated entities.
  for (const item of data.updated ?? []) {
    await db.cachedEntities.put({
      type: item.type,
      record_id: item.id,
      data: item,
      updated_at: item.changed_at ?? new Date().toISOString(),
    });
  }

  // Remove deleted entities.
  for (const item of data.deleted ?? []) {
    await db.cachedEntities
      .where("type")
      .equals(item.type)
      .and((record) => record.record_id === item.id)
      .delete();
  }

  return data.since ?? since ?? new Date().toISOString();
}

/**
 * Get the count of pending writes.
 */
export async function pendingWriteCount(): Promise<number> {
  return await db.pendingWrites.count();
}

/**
 * Queue a write for later sync when back online.
 */
export async function queueWrite(write: Omit<PendingWrite, "id" | "created_at" | "retries">): Promise<void> {
  await db.pendingWrites.add({
    ...write,
    created_at: new Date().toISOString(),
    retries: 0,
  });
}

/**
 * Clear all pending writes (e.g. after successful full sync).
 */
export async function clearPendingWrites(): Promise<void> {
  await db.pendingWrites.clear();
}

/**
 * Get a cached entity by type and record ID.
 */
export async function getCachedEntity(type: string, recordId: number): Promise<any | null> {
  const entity = await db.cachedEntities
    .where("type")
    .equals(type)
    .and((record) => record.record_id === recordId)
    .first();
  return entity?.data ?? null;
}

/**
 * Cache an entity locally.
 */
export async function cacheEntity(type: string, recordId: number, data: any): Promise<void> {
  await db.cachedEntities.put({
    type,
    record_id: recordId,
    data,
    updated_at: new Date().toISOString(),
  });
}
