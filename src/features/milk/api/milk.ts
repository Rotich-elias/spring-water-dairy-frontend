import { api } from "@/api";
import type { Paginated } from "@/api";

export type MilkSessionKey = "morning" | "midday" | "evening";

export interface MilkSessionCow {
  id: number;
  ear_tag: string;
  name?: string;
  last_yield?: number;
  last_record_date?: string;
  recorded_litres?: number | null;
  day_litres?: number;
  dims?: number;
  in_withholding: boolean;
  already_recorded: boolean;
}

export interface MilkSessionSheet {
  date: string;
  session: string;
  cows: MilkSessionCow[];
  alerts: any[];
  summary: {
    cows_milked: number;
    cows_missing: number;
    total_last_yield: number;
    session_total: number;
    day_total: number;
  };
}

export interface MilkSessionEntry {
  animal_id: number;
  litres: number;
  cmt_score?: number | null;
  scc?: number | null;
}

export interface MilkSessionSaveRequest {
  client_uuid: string;
  record_date: string;
  session: MilkSessionKey;
  entries: MilkSessionEntry[];
}

export interface MilkSessionEntryResult {
  animal_id: number;
  status: "saved" | "skipped";
  id?: number;
  reason?: string;
  warning?: string;
}

export interface MilkSessionSaveResponse {
  client_uuid: string;
  saved: number;
  skipped: number;
  warnings: number;
  replayed?: boolean;
  entries: MilkSessionEntryResult[];
}

export interface MilkRecord {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  record_date: string;
  session: string;
  litres: number;
  cmt_score?: number | null;
  scc?: number | null;
  in_withholding: boolean;
  excluded_from_sales: boolean;
  version: number;
}

export interface BulkTankRecord {
  id: number;
  client_uuid?: string;
  record_date: string;
  session: string;
  litres_collected: number;
  litres_sold: number;
  litres_discarded: number;
  buyer?: string;
  price_per_litre?: number;
}

export interface Lactation {
  id: number;
  animal_id: number;
  lactation_number: number;
  started_at: string;
  ended_at?: string;
  total_litres?: number;
  peak_yield?: number;
  peak_day?: number;
  drying_off_date?: string;
  days_in_milk?: number;
  is_dry_off: boolean;
}

export function useMilk() {
  async function sessionSheet(date: string, session: MilkSessionKey) {
    const res = await api.get<{ data: MilkSessionSheet }>("milk/sessions", {
      params: { date, session },
    });
    return res.data.data;
  }

  async function saveSession(body: MilkSessionSaveRequest) {
    const res = await api.post<{ data: MilkSessionSaveResponse }>(
      "milk/sessions",
      body
    );
    return res.data.data;
  }

  async function listMilkRecords(params?: {
    animal_id?: number;
    record_date?: string;
    session?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<MilkRecord>>("milk/milk-records", {
      params,
    });
    return res.data.data;
  }

  async function createMilkRecord(body: {
    client_uuid: string;
    animal_id: number;
    record_date: string;
    session: MilkSessionKey;
    litres: number;
    cmt_score?: number | null;
    scc?: number | null;
  }) {
    const res = await api.post<{ data: MilkRecord }>(
      "milk/milk-records",
      body
    );
    return res.data.data;
  }

  async function updateMilkRecord(
    id: number,
    body: { litres?: number; cmt_score?: number | null; scc?: number | null },
    ifMatch?: number
  ) {
    const res = await api.patch<{ data: MilkRecord }>(
      `/milk/milk-records/${id}`,
      body,
      {
        headers: ifMatch !== undefined ? { "If-Match": String(ifMatch) } : {},
      }
    );
    return res.data.data;
  }

  async function listBulkTank(params?: {
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<BulkTankRecord>>(
      "milk/bulk-tank-records",
      { params }
    );
    return res.data.data;
  }

  async function saveBulkTank(body: {
    client_uuid: string;
    record_date: string;
    session: MilkSessionKey;
    litres_collected: number;
    litres_sold: number;
    litres_discarded: number;
    buyer?: string;
    price_per_litre?: number;
  }) {
    const res = await api.post<{ data: BulkTankRecord }>(
      "milk/bulk-tank-records",
      body
    );
    return res.data.data;
  }

  async function listLactations(params?: {
    animal_id?: number;
    active_only?: boolean;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Lactation>>("milk/lactations", {
      params,
    });
    return res.data.data;
  }

  async function animalMilk(animalId: number) {
    const res = await api.get<{
      data: {
        animal_id: number;
        ear_tag: string;
        days_in_milk?: number;
        lactation: any;
        daily_records: any[];
      };
    }>(`/animals/${animalId}/milk`);
    return res.data.data;
  }

  return {
    sessionSheet,
    saveSession,
    listMilkRecords,
    createMilkRecord,
    updateMilkRecord,
    listBulkTank,
    saveBulkTank,
    listLactations,
    animalMilk,
  };
}
