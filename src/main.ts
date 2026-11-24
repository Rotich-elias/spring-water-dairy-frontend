import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "@/app/router";
import { i18n } from "@/app/i18n";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useTenantStore } from "@/stores/tenant";
import "@/assets/main.css";

async function bootstrap(): Promise<void> {
  const app = createApp(App);

  app.use(createPinia());
  app.use(i18n);

  // Restore the session before the router runs its permission guards,
  // otherwise every guarded page would redirect on a hard refresh.
  const auth = useAuthStore();
  if (auth.isAuthenticated) {
    try {
      await auth.fetchMe();
    } catch {
      auth.clear();
    }
  }

  const settings = useSettingsStore();
  const tenants = useTenantStore();

  async function loadTenantData(force = false): Promise<void> {
    if (!auth.isAuthenticated) {
      return;
    }

    await Promise.allSettled([settings.load(force), tenants.load()]);
  }

  await loadTenantData();

  // Farm name and theme are tenant-scoped, so refresh them whenever a user
  // signs in or out without a full page reload.
  watch(() => auth.isAuthenticated, async (isAuthenticated, wasAuthenticated) => {
    if (isAuthenticated && !wasAuthenticated) {
      await loadTenantData(true);
    } else if (!isAuthenticated && wasAuthenticated) {
      localStorage.removeItem("swd.tenant_id");
    }
  });

  // Redirect to login on 401 from any API call.
  window.addEventListener("swd:unauthenticated", () => {
    useAuthStore().clear();
    localStorage.removeItem("swd.tenant_id");
    if (router.currentRoute.value.name !== "login") {
      void router.replace({ name: "login" });
    }
  });

  // Register service worker for PWA installability.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  app.use(router);
  await router.isReady();
  app.mount("#app");
}

void bootstrap();
