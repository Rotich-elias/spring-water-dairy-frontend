import { api, type Paginated } from "@/api";

export interface Task {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  title: string;
  description: string | null;
  type: string;
  due_date: string | null;
  is_completed: boolean;
  completion_note: string | null;
  created_at: string;
  updated_at: string;
}

export function useTasks() {
  async function listTasks(params?: {
    page?: number;
    per_page?: number;
    is_completed?: boolean;
  }) {
    const res = await api.get<Paginated<Task>>("tasks", { params });
    return res.data.data;
  }

  async function createTask(body: {
    title: string;
    description?: string;
    type?: string;
    due_date?: string;
    user_id?: number;
  }) {
    const res = await api.post<{ data: Task }>("tasks", body);
    return res.data.data;
  }

  async function getTask(id: number) {
    const res = await api.get<{ data: Task }>(`tasks/${id}`);
    return res.data.data;
  }

  async function updateTask(id: number, body: Partial<Task>) {
    const res = await api.patch<{ data: Task }>(`tasks/${id}`, body);
    return res.data.data;
  }

  async function deleteTask(id: number) {
    await api.delete(`tasks/${id}`);
  }

  async function toggleTask(
    id: number,
    isCompleted: boolean,
    completionNote?: string | null,
  ) {
    const body: { is_completed: boolean; completion_note?: string | null } = {
      is_completed: isCompleted,
    };
    if (completionNote !== undefined) {
      body.completion_note = completionNote;
    }
    const res = await api.patch<{ data: Task }>(`tasks/${id}`, body);
    return res.data.data;
  }

  return {
    listTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    toggleTask,
  };
}
