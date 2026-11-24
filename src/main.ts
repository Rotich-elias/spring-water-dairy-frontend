import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "@/app/router";
import { i18n } from "@/app/i18n";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useTenantStore } from "@/stores/tenant";
import {
  consumeSellerRestore,
  IMPERSONATION_KEY,
  SELLER_TOKEN_KEY,
  TENANT_KEY,
  TOKEN_KEY,
} from "@/api";
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
      // A 401 during an impersonated farm view is handled by the API client:
      // it restores the seller token and reloads /seller. Do not clear that
      // restored token here.
      if (!consumeSellerRestore()) auth.clear();
    }
  }

  const settings = useSettingsStore();
  const tenants = useTenantStore();

  const loginRoutes = ["login"];

  async function loadTenantData(force = false): Promise<void> {
    // A Platform Admin has no farm context, and a login screen must not fire
    // tenant-scoped requests for a session that may still be rejected.
    if (
      !auth.isAuthenticated ||
      auth.isPlatformAdmin ||
      loginRoutes.includes(String(router.currentRoute.value.name))
    ) {
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
      localStorage.removeItem(TENANT_KEY);
    }
  });

  // A farm session accepted on a login screen loads its workspace once the
  // router actually enters the dashboard.
  router.afterEach((to) => {
    if (to.meta.requiresAuth && auth.isAuthenticated && !auth.isPlatformAdmin) {
      void loadTenantData();
    }
  });

  // Redirect to login on 401 from any API call. The login screen is exempt
  // so stale in-flight requests never bounce a user away from an error.
  window.addEventListener("swd:unauthenticated", () => {
    useAuthStore().clear();
    localStorage.removeItem(TENANT_KEY);
    if (router.currentRoute.value.name !== "login") {
      void router.replace({ name: "login" });
    }
  });

  // Impersonation switches tokens globally. Other open tabs must pick up the
  // new session (and the return banner) instead of using a stale farm token.
  const sessionKeys = [TOKEN_KEY, SELLER_TOKEN_KEY, IMPERSONATION_KEY, TENANT_KEY];
  window.addEventListener("storage", (event) => {
    if (!event.key || sessionKeys.includes(event.key)) {
      window.location.reload();
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
