import { api, type Paginated } from "@/api";

export interface Treatment {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  treatment_date: string;
  condition_id?: number;
  condition?: string;
  drug_name: string;
  dose: string;
  route: string;
  milk_withholding_days: number;
  meat_withholding_days: number;
  milk_safe_date?: string;
  meat_safe_date?: string;
  version: number;
}

export interface Vaccination {
  id: number;
  client_uuid?: string;
  animal_id: number;
  animal_ear_tag?: string;
  condition_id?: number;
  condition?: string;
  vaccination_date: string;
  vaccine_name: string;
  dose: string;
  route: string;
  pen_id?: number;
  pen?: string;
  next_due_date?: string;
  version: number;
}

export interface SickBayEntry {
  id: number;
  ear_tag: string;
  category?: string;
  pen?: string;
  milk_safe_date?: string;
  meat_safe_date?: string;
  days_remaining_milk?: number;
  days_remaining_meat?: number;
  drug_name?: string;
}

export interface AnimalHealth {
  animal_id: number;
  ear_tag: string;
  in_withholding: boolean;
  treatments: Treatment[];
  vaccinations: Vaccination[];
}

export interface UseHealthReturn {
  listTreatments: (
    params?: {
      animal_id?: number;
      from?: string;
      to?: string;
      page?: number;
      per_page?: number;
    }
  ) => Promise<Treatment[]>;
  createTreatment: (
    body: {
      client_uuid: string;
      animal_id: number;
      treatment_date: string;
      condition_id?: number;
      drug_name: string;
      dose: string;
      route: "IM" | "IV" | "SC" | "Oral" | "Topical";
      milk_withholding_days: number;
      meat_withholding_days: number;
    }
  ) => Promise<Treatment>;
  updateTreatment: (
    id: number,
    body: {
      drug_name?: string;
      dose?: string;
      route?: "IM" | "IV" | "SC" | "Oral" | "Topical";
      milk_withholding_days?: number;
      meat_withholding_days?: number;
    }
  ) => Promise<Treatment>;
  deleteTreatment: (id: number) => Promise<void>;
  listVaccinations: (
    params?: {
      animal_id?: number;
      pen_id?: number;
      page?: number;
      per_page?: number;
    }
  ) => Promise<Vaccination[]>;
  createVaccination: (
    body: {
      client_uuid: string;
      animal_id?: number;
      condition_id?: number;
      vaccination_date: string;
      vaccine_name: string;
      dose: string;
      route: "IM" | "SC" | "Oral";
      pen_id?: number;
      next_due_date?: string;
    }
  ) => Promise<Vaccination>;
  deleteVaccination: (id: number) => Promise<void>;
  getSickBay: () => Promise<SickBayEntry[]>;
  getAnimalHealth: (animalId: number) => Promise<AnimalHealth>;
}

export function useHealth(): UseHealthReturn {
  async function listTreatments(params?: {
    animal_id?: number;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Treatment>>("treatments", { params });
    return res.data.data;
  }

  async function createTreatment(body: {
    client_uuid: string;
    animal_id: number;
    treatment_date: string;
    condition_id?: number;
    drug_name: string;
    dose: string;
    route: "IM" | "IV" | "SC" | "Oral" | "Topical";
    milk_withholding_days: number;
    meat_withholding_days: number;
  }) {
    const res = await api.post<{ data: Treatment }>("treatments", body);
    return res.data.data;
  }

  async function updateTreatment(
    id: number,
    body: {
      drug_name?: string;
      dose?: string;
      route?: "IM" | "IV" | "SC" | "Oral" | "Topical";
      milk_withholding_days?: number;
      meat_withholding_days?: number;
    }
  ) {
    const res = await api.patch<{ data: Treatment }>(`/treatments/${id}`, body);
    return res.data.data;
  }

  async function deleteTreatment(id: number) {
    await api.delete(`/treatments/${id}`);
  }

  async function listVaccinations(params?: {
    animal_id?: number;
    pen_id?: number;
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<Vaccination>>("vaccinations", {
      params,
    });
    return res.data.data;
  }

  async function createVaccination(body: {
    client_uuid: string;
    animal_id?: number;
    condition_id?: number;
    vaccination_date: string;
    vaccine_name: string;
    dose: string;
    route: "IM" | "SC" | "Oral";
    pen_id?: number;
    next_due_date?: string;
  }) {
    const res = await api.post<{ data: Vaccination }>(
      "vaccinations",
      body
    );
    return res.data.data;
  }

  async function deleteVaccination(id: number) {
    await api.delete(`/vaccinations/${id}`);
  }

  async function getSickBay() {
    const res = await api.get<{ data: SickBayEntry[] }>("health/sick-bay");
    return res.data.data;
  }

  async function getAnimalHealth(animalId: number) {
    const res = await api.get<{ data: AnimalHealth }>(
      `/animals/${animalId}/health`
    );
    return res.data.data;
  }

  return {
    listTreatments,
    createTreatment,
    updateTreatment,
    deleteTreatment,
    listVaccinations,
    createVaccination,
    deleteVaccination,
    getSickBay,
    getAnimalHealth,
  };
}