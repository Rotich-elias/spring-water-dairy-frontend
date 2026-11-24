import { defineStore } from "pinia";
import { ref } from "vue";
import { api, getErrorMessage, type SiteInfo, type SiteInfoPayload } from "@/api";

type TextKey = {
  [K in keyof SiteInfo]: SiteInfo[K] extends string ? K : never;
}[keyof SiteInfo];

type ItemsKey = {
  [K in keyof SiteInfo]: SiteInfo[K] extends unknown[] ? K : never;
}[keyof SiteInfo];

/**
 * Public marketing content. The store never throws: if the API is down the
 * landing page keeps rendering with its translated defaults.
 */
export const useSiteStore = defineStore("site", () => {
  const content = ref<SiteInfoPayload>({});
  const loaded = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<{ data: SiteInfoPayload }>("/site");
      content.value = response.data?.data ?? {};
      loaded.value = true;
    } catch (e: unknown) {
      error.value = getErrorMessage(e, "Site content unavailable");
      // Keep whatever was loaded previously (or an empty map).
    } finally {
      loading.value = false;
    }
  }

  function text(key: TextKey, fallback: string): string {
    const value = content.value[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  function items(key: ItemsKey): SiteInfo[ItemsKey] {
    const value = content.value[key];
    return Array.isArray(value) && value.length > 0 ? value : [];
  }

  function replace(next: SiteInfoPayload): void {
    content.value = { ...content.value, ...next };
    loaded.value = true;
  }

  return { content, loaded, loading, error, load, text, items, replace };
});
