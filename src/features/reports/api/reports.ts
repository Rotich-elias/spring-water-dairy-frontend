import { api } from "@/api";

export interface ReportDefinition {
  id: number | string;
  name: string;
  description: string;
  type: string;
}

export function useReports() {
  async function listReports(): Promise<ReportDefinition[]> {
    const res = await api.get<{ data: ReportDefinition[] }>("reports");
    return res.data.data;
  }

  async function generateReport(
    type: string,
    params?: { from?: string; to?: string },
  ): Promise<any> {
    const res = await api.get<{ data: any }>(`reports/${type}`, { params });
    return res.data.data;
  }

  /**
   * Download a PDF report. The backend returns the actual PDF binary, so the
   * browser saves it directly instead of rendering a JSON preview.
   */
  async function downloadPdf(
    type: string,
    params?: { from?: string; to?: string },
  ): Promise<string> {
    const res = await api.get(`reports/${type}/pdf`, {
      params,
      responseType: "blob",
    });

    const filename = filenameFromDisposition(
      res.headers["content-disposition"] as string | undefined,
      `${type}-${new Date().toISOString().slice(0, 10)}.pdf`,
    );

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return filename;
  }

  return { listReports, generateReport, downloadPdf };
}

function filenameFromDisposition(
  disposition: string | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback;

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);

  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] ?? fallback;
}
