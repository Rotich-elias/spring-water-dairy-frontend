import { api, type Paginated } from "@/api";

export interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  animal_id?: number | null;
  animal?: { id: number; ear_tag: string; name?: string | null } | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  created_at: string;
}

export interface AlertRule {
  id: number;
  name: string;
  type: string;
  conditions: Record<string, unknown> | null;
  channels: string[];
  recipients: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAlerts() {
  async function listAlerts(): Promise<Alert[]> {
    const res = await api.get<{ data: Alert[] }>("alerts");
    return res.data.data;
  }

  async function generateAlerts() {
    const res = await api.post<{ data: { created: number } }>("alerts/generate");
    return res.data.data;
  }

  async function markAlertRead(id: number) {
    await api.patch(`alerts/${id}/read`);
  }

  async function dismissAlert(id: number) {
    await api.patch(`alerts/${id}/dismiss`);
  }

  return { listAlerts, generateAlerts, markAlertRead, dismissAlert };
}

export function useAlertRules() {
  async function listAlertRules(params?: {
    page?: number;
    per_page?: number;
  }) {
    const res = await api.get<Paginated<AlertRule>>("alert-rules", {
      params,
    });
    return res.data.data;
  }

  async function createAlertRule(body: {
    name: string;
    type: string;
    conditions?: Record<string, unknown>;
    channels?: string[];
    recipients?: string[];
    is_active?: boolean;
  }) {
    const res = await api.post<{ data: AlertRule }>("alert-rules", body);
    return res.data.data;
  }

  async function getAlertRule(id: number) {
    const res = await api.get<{ data: AlertRule }>(`alert-rules/${id}`);
    return res.data.data;
  }

  async function updateAlertRule(id: number, body: Partial<AlertRule>) {
    const res = await api.patch<{ data: AlertRule }>(
      `alert-rules/${id}`,
      body,
    );
    return res.data.data;
  }

  async function dismissAlertRule(id: number) {
    const res = await api.patch<{ data: AlertRule }>(`alert-rules/${id}`);
    return res.data.data;
  }

  async function deleteAlertRule(id: number) {
    await api.delete(`alert-rules/${id}`);
  }

  async function generateRuleAlerts() {
    const res = await api.post<{ data: { created: number } }>(
      "alert-rules/generate",
    );
    return res.data.data;
  }

  return {
    listAlertRules,
    createAlertRule,
    getAlertRule,
    updateAlertRule,
    dismissAlertRule,
    deleteAlertRule,
    generateRuleAlerts,
  };
}
