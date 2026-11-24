import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "@/app/router";
import { i18n } from "@/app/i18n";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useTenantStore } from "@/stores/tenant";
import { consumeSellerRestore } from "@/api";
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

  const loginRoutes = ["login", "seller.login"];

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
      localStorage.removeItem("swd.tenant_id");
    }
  });

  // A farm session accepted on a login screen loads its workspace once the
  // router actually enters the dashboard.
  router.afterEach((to) => {
    if (to.meta.requiresAuth && auth.isAuthenticated && !auth.isPlatformAdmin) {
      void loadTenantData();
    }
  });

  // Redirect to login on 401 from any API call. Login screens are exempt:
  // a rejected seller sign-in can have stale in-flight requests, and the
  // seller-access error must stay visible instead of bouncing to /login.
  window.addEventListener("swd:unauthenticated", () => {
    useAuthStore().clear();
    localStorage.removeItem("swd.tenant_id");
    const routeName = router.currentRoute.value.name;
    if (routeName !== "login" && routeName !== "seller.login") {
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
