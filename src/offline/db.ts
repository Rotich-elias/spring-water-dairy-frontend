import Dexie, { type Table } from "dexie";

export type PendingWrite = {
  id?: number;
  method: "post" | "put" | "patch" | "delete";
  url: string;
  body?: any;
  headers?: Record<string, string>;
  created_at: string;
  retries: number;
};

export type CachedEntity = {
  id?: number;
  type: string;
  record_id: number;
  data: any;
  updated_at: string;
};

export class SwdDb extends Dexie {
  pendingWrites!: Table<PendingWrite, number>;
  cachedEntities!: Table<CachedEntity, number>;

  constructor() {
    super("SwdDb");
    this.version(1).stores({
      pendingWrites: "++id, method, url, created_at, retries",
      cachedEntities: "++id, type, record_id, updated_at",
    });
  }
}

export const db = new SwdDb();
