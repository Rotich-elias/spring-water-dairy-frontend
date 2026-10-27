import { api } from "@/api";

export interface DashboardStats {
  total_animals: number;
  animals_by_status: Record<string, number>;
  animals_by_category: Record<string, number>;
  lactating_cows: number;
  todays_milk_litres: number;
  heats_this_week: number;
  services_this_week: number;
  pregnancies_pending: number;
  calvings_expected_this_week: number;
  treatments_in_withholding: number;
  vaccines_due: number;
}

export interface MilkTrendPoint {
  date: string;
  litres: number;
}

export interface BreedShare {
  breed: string;
  count: number;
  percent: number;
}

export interface CompositionItem {
  category: string;
  target: number;
  count: number;
  percent: number;
  note: string;
}

export interface UpcomingEvent {
  type: string;
  title: string;
  animal_id: number;
  ear_tag?: string | null;
  date: string;
  priority: string;
}

export function useDashboard() {
  async function fetchStats(): Promise<DashboardStats> {
    const res = await api.get<{ data: DashboardStats }>("dashboard/stats");
    return res.data.data;
  }

  async function fetchMilkTrend(days = 30): Promise<MilkTrendPoint[]> {
    const res = await api.get<{ data: MilkTrendPoint[] }>(
      "dashboard/charts/milk-trend",
      { params: { days } },
    );
    return res.data.data;
  }

  async function fetchBreedShare(): Promise<BreedShare[]> {
    const res = await api.get<{ data: BreedShare[] }>(
      "dashboard/charts/breed-share",
    );
    return res.data.data;
  }

  async function fetchComposition(): Promise<CompositionItem[]> {
    const res = await api.get<{ data: CompositionItem[] }>(
      "dashboard/charts/composition",
    );
    return res.data.data;
  }

  async function fetchUpcoming(): Promise<UpcomingEvent[]> {
    const res = await api.get<{ data: UpcomingEvent[] }>(
      "dashboard/upcoming",
    );
    return res.data.data;
  }

  return {
    fetchStats,
    fetchMilkTrend,
    fetchBreedShare,
    fetchComposition,
    fetchUpcoming,
  };
}
