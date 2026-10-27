import { api } from "@/api";
import type { User } from "@/api";

interface UserListResponse {
  data: User[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

export function useUsers() {
  async function list(params?: { page?: number; per_page?: number }) {
    const res = await api.get<UserListResponse>("/users", { params });
    return res.data.data;
  }

  async function create(body: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    role: string;
  }) {
    const res = await api.post<{ data: User }>("/users", body);
    return res.data.data;
  }

  async function get(id: number) {
    const res = await api.get<{ data: User }>(`/users/${id}`);
    return res.data.data;
  }

  async function update(id: number, body: Partial<User>) {
    const res = await api.patch<{ data: User }>(`/users/${id}`, body);
    return res.data.data;
  }

  async function destroy(id: number) {
    await api.delete(`/users/${id}`);
  }

  return { list, create, get, update, destroy };
}
