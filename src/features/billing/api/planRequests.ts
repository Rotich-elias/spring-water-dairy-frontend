import { api } from "@/api";

/** Download a plan-request PDF; the API client supplies auth and farm scope. */
export async function downloadPlanRequestInvoice(
  url: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await api.get<Blob>(url, { responseType: "blob" });
  const filename = filenameFromDisposition(
    response.headers["content-disposition"] as string | undefined,
    fallbackFilename,
  );

  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
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
