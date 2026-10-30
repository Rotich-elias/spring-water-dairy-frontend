import { api, type Paginated, type LookupRow } from "@/api";
import type { Animal, AnimalImage } from "@/features/animals/types";

export interface AnimalFilters {
  page?: number;
  per_page?: number;
  category_id?: number;
  status_id?: number;
  pen_id?: number;
  breed_id?: number;
  sex?: "M" | "F";
  q?: string;
  sort?: string;
}

export function useAnimals() {
  async function list(filters: AnimalFilters = {}) {
    const res = await api.get<Paginated<Animal>>("animals", { params: filters });
    return res.data.data;
  }

  async function create(body: {
    ear_tag: string;
    name?: string;
    category_id: number;
    pen_id?: number;
    status_id?: number;
    breed_id?: number;
    sex: "M" | "F";
    birth_date?: string;
    client_uuid?: string;
  }) {
    const res = await api.post<{ data: Animal }>("animals", body);
    return res.data.data;
  }

  async function importCsv(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ data: { created: number; failed: number; results: any[] } }>(
      "animals/import",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  }

  async function get(id: number) {
    const res = await api.get<{ data: Animal }>(`/animals/${id}`);
    return res.data.data;
  }

  async function update(
    id: number,
    body: Partial<{
      ear_tag: string;
      name: string | null;
      category_id: number;
      pen_id: number | null;
      status_id: number | null;
      breed_id: number | null;
      sex: "M" | "F";
      birth_date: string | null;
    }>,
    ifMatch?: number
  ) {
    const res = await api.patch<{ data: Animal }>(`/animals/${id}`, body, {
      headers: ifMatch !== undefined ? { "If-Match": String(ifMatch) } : {},
    });
    return res.data.data;
  }

  async function move(
    id: number,
    body: { category_id?: number; pen_id?: number; status_id?: number; reason: string }
  ) {
    const res = await api.post<{ data: Animal }>(`/animals/${id}/move`, body);
    return res.data.data;
  }

  async function exit(
    id: number,
    body: {
      exit_date: string;
      reason: string;
      price?: number;
      override?: boolean;
      override_reason?: string;
    }
  ) {
    const res = await api.post<{ data: Animal }>(`/animals/${id}/exit`, body);
    return res.data.data;
  }

  async function destroy(id: number) {
    await api.delete(`/animals/${id}`);
  }

  async function timeline(id: number) {
    const res = await api.get<{ data: any[] }>(`/animals/${id}/timeline`);
    return res.data.data;
  }

  async function lineage(id: number) {
    const res = await api.get<{ data: any }>(`/animals/${id}/lineage`);
    return res.data.data;
  }

  async function lookup(tag: string) {
    const res = await api.get<{ data: Animal[] }>("animals/lookup", {
      params: { tag },
    });
    return res.data.data;
  }

  async function uploadImage(id: number, file: File, isPrimary = false) {
    const formData = new FormData();
    formData.append("imageable_type", "animal");
    formData.append("imageable_id", String(id));
    formData.append("image", file);
    if (isPrimary) {
      formData.append("is_primary", "1");
    }

    const res = await api.post<{ data: AnimalImage }>("images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  }

  async function setPrimaryImage(imageId: number, isPrimary = true) {
    const res = await api.patch<{ data: AnimalImage }>(`/images/${imageId}`, {
      is_primary: isPrimary,
    });
    return res.data.data;
  }

  async function deleteImage(imageId: number) {
    await api.delete(`/images/${imageId}`);
  }

  return {
    list,
    create,
    importCsv,
    get,
    update,
    move,
    exit,
    destroy,
    timeline,
    lineage,
    lookup,
    uploadImage,
    setPrimaryImage,
    deleteImage,
  };
}
