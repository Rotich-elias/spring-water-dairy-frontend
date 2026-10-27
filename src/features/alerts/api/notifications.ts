import { api, type Paginated } from "@/api";

export interface Notification {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  async function listNotifications(params?: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  }) {
    const res = await api.get<Paginated<Notification>>("notifications", {
      params,
    });
    return res.data.data;
  }

  async function markRead(id: number) {
    const res = await api.patch<{ data: Notification }>(
      `notifications/${id}/read`,
    );
    return res.data.data;
  }

  async function readAll() {
    const res = await api.post<{ data: { read_all: boolean } }>(
      "notifications/read-all",
    );
    return res.data.data;
  }

  return { listNotifications, markRead, readAll };
}
