import { api, type Paginated } from "@/api";

export interface Heat {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  heat_date: string;
  observed_by?: string;
  notes?: string;
  version: number;
}

export interface Service {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  service_date: string;
  bull_id?: number;
  bull_code?: string;
  bull_name?: string;
  inseminator?: string;
  service_type: string;
  expected_calving_date: string;
  target_dry_date: string;
  pd_window_start: string;
  pd_window_end: string;
  reproductive_status: string;
  version: number;
}

export interface PregnancyCheck {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  check_date: string;
  pd_result_id?: number;
  pd_result?: string;
  result: string;
  notes?: string;
  version: number;
}

export interface Calving {
  id: number;
  client_uuid?: string;
  dam_id: number;
  dam_ear_tag?: string;
  calving_date: string;
  ease_score_id?: number;
  ease_score?: string;
  retained_placenta: boolean;
  notes?: string;
  version: number;
}

export interface SemenStraw {
  id: number;
  bull_code: string;
  bull_name?: string;
  breed?: string;
  quantity: number;
  unit_price?: number;
  expiry_date?: string;
}

export interface BreedingEvent {
  type: string;
  date: string;
  animal_id: number;
  ear_tag: string;
  title: string;
  animal: string;
}

export interface BreedingKPIs {
  conception_rate: number;
  services_per_conception: number;
  days_open?: number;
  calving_interval?: number;
  period_from: string;
  period_to: string;
}

export function useBreeding() {
  async function listHeats(params?: {
    animal_id?: number;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Heat>>("breeding/heats", { params });
    return res.data.data;
  }

  async function createHeat(body: {
    client_uuid: string;
    animal_id: number;
    heat_date: string;
    observed_by?: string;
    notes?: string;
  }) {
    const res = await api.post<{ data: Heat }>("breeding/heats", body);
    return res.data.data;
  }

  async function listServices(params?: {
    animal_id?: number;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Service>>("breeding/services", {
      params,
    });
    return res.data.data;
  }

  async function createService(body: {
    client_uuid: string;
    animal_id: number;
    service_date: string;
    bull_id?: number;
    inseminator?: string;
    service_type?: "AI" | "Natural";
    override?: boolean;
    override_reason?: string;
  }) {
    const res = await api.post<{ data: Service }>("breeding/services", body);
    return res.data.data;
  }

  async function listPregnancyChecks(params?: {
    animal_id?: number;
    result?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<PregnancyCheck>>(
      "breeding/pregnancy-checks",
      { params }
    );
    return res.data.data;
  }

  async function createPregnancyCheck(body: {
    client_uuid: string;
    animal_id: number;
    check_date: string;
    pd_result_id?: number;
    result: "pregnant" | "open" | "recheck";
    notes?: string;
  }) {
    const res = await api.post<{ data: PregnancyCheck }>(
      "breeding/pregnancy-checks",
      body
    );
    return res.data.data;
  }

  async function listCalvings(params?: {
    dam_id?: number;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Calving>>("breeding/calvings", {
      params,
    });
    return res.data.data;
  }

  async function createCalving(body: {
    client_uuid: string;
    dam_id: number;
    calving_date: string;
    ease_score_id?: number;
    retained_placenta?: boolean;
    notes?: string;
    calves: Array<{
      ear_tag: string;
      sex: "M" | "F";
      birth_weight?: number | null;
      outcome: string;
      colostrum_litres?: number | null;
      colostrum_hours?: number | null;
    }>;
  }) {
    const res = await api.post<{
      data: {
        calving: Calving;
        calves: any[];
        lactation: any;
        dam: any;
      };
    }>("breeding/calvings", body);
    return res.data.data;
  }

  async function listSemenStraws(params?: {
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<SemenStraw>>(
      "breeding/semen-straws",
      { params }
    );
    return res.data.data;
  }

  async function createSemenStraw(body: {
    bull_code: string;
    bull_name?: string;
    breed?: string;
    quantity: number;
    unit_price?: number;
    expiry_date?: string;
  }) {
    const res = await api.post<{ data: SemenStraw }>(
      "breeding/semen-straws",
      body
    );
    return res.data.data;
  }

  async function getCalendar(from: string, to: string) {
    const res = await api.get<{ data: BreedingEvent[] }>(
      "breeding/calendar",
      { params: { from, to } }
    );
    return res.data.data;
  }

  async function getKPIs(from: string, to: string) {
    const res = await api.get<{ data: BreedingKPIs }>("breeding/kpis", {
      params: { from, to },
    });
    return res.data.data;
  }

  return {
    listHeats,
    createHeat,
    listServices,
    createService,
    listPregnancyChecks,
    createPregnancyCheck,
    listCalvings,
    createCalving,
    listSemenStraws,
    createSemenStraw,
    getCalendar,
    getKPIs,
  };
}
