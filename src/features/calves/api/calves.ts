import { api, type Paginated } from "@/api";

export interface Weight {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  weight_date: string;
  weight_kg: number;
  adg?: number | null;
  on_target: boolean;
  version: number;
}

export interface CalfRecord {
  id: number;
  animal_id: number;
  animal_ear_tag?: string;
  colostrum_litres?: number;
  colostrum_hours?: number;
  navel_dip: boolean;
  disbudding: boolean;
  weaning_date?: string;
  weaning_weight?: number;
  birth_weight?: number;
  outcome: string;
}

export interface CalfNurseryItem {
  id: number;
  ear_tag: string;
  age_days?: number;
  latest_weight?: number;
  adg?: number;
  readiness: any;
  flags: string[];
}

export interface AnimalGrowth {
  animal_id: number;
  ear_tag: string;
  birth_date?: string;
  birth_weight?: number;
  overall_adg?: number;
  series: Array<{
    date: string;
    weight_kg: number;
    adg?: number;
    on_target?: boolean;
    benchmark?: number;
  }>;
}

export function useCalves() {
  async function listWeights(params?: {
    animal_id?: number;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Weight>>("weights", { params });
    return res.data.data;
  }

  async function createWeight(body: {
    client_uuid: string;
    animal_id: number;
    weight_date: string;
    weight_kg: number;
  }) {
    const res = await api.post<{ data: Weight }>("weights", body);
    return res.data.data;
  }

  async function animalGrowth(animalId: number) {
    const res = await api.get<{ data: AnimalGrowth }>(
      `/animals/${animalId}/growth`
    );
    return res.data.data;
  }

  async function listCalfRecords(params?: {
    animal_id?: number;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<CalfRecord>>(
      "calf-records",
      { params }
    );
    return res.data.data;
  }

  async function createCalfRecord(body: {
    animal_id: number;
    colostrum_litres?: number;
    colostrum_hours?: number;
    navel_dip?: boolean;
    disbudding?: boolean;
    birth_weight?: number;
    outcome: string;
  }) {
    const res = await api.post<{ data: CalfRecord }>(
      "calf-records",
      body
    );
    return res.data.data;
  }

  async function weanCalf(recordId: number, body: {
    weaning_date: string;
    weaning_weight: number;
  }) {
    const res = await api.post<{ data: CalfRecord }>(
      `/calf-records/${recordId}/wean`,
      body
    );
    return res.data.data;
  }

  async function getNursery() {
    const res = await api.get<{ data: CalfNurseryItem[] }>(
      "calves/nursery"
    );
    return res.data.data;
  }

  return {
    listWeights,
    createWeight,
    animalGrowth,
    listCalfRecords,
    createCalfRecord,
    weanCalf,
    getNursery,
  };
}
