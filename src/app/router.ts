import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";

export type Role = "Owner" | "Manager" | "Milker" | "AI Tech" | "Vet" | "Viewer";

interface RouteMeta {
  requiresAuth?: boolean;
  permission?: string;
  roles?: Role[];
  title?: string;
  hideForRoles?: Role[];
}

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/features/auth/pages/LoginView.vue"),
    meta: { title: "Login", hideForRoles: [] },
  },
  {
    path: "/",
    name: "home",
    component: () => import("@/features/dashboard/pages/DashboardView.vue"),
    meta: { requiresAuth: true, title: "Dashboard" },
  },
  {
    path: "/animals",
    name: "animals",
    component: () => import("@/features/animals/pages/AnimalListView.vue"),
    meta: { requiresAuth: true, permission: "animals.view", title: "Animals" },
  },
  {
    path: "/animals/:id",
    name: "animals.detail",
    component: () => import("@/features/animals/pages/AnimalDetailView.vue"),
    meta: { requiresAuth: true, permission: "animals.view", title: "Animal" },
  },
  {
    path: "/milk",
    name: "milk.session",
    component: () => import("@/features/milk/pages/MilkSessionView.vue"),
    meta: { requiresAuth: true, permission: "milk.view", title: "Milk" },
  },
  {
    path: "/milk/bulk-tank",
    name: "milk.bulk-tank",
    component: () => import("@/features/milk/pages/BulkTankView.vue"),
    meta: { requiresAuth: true, permission: "milk.view", title: "Bulk tank" },
  },
  {
    path: "/animals/:id/milk",
    name: "animals.milk",
    component: () => import("@/features/milk/pages/CowMilkView.vue"),
    meta: { requiresAuth: true, permission: "milk.view", title: "Cow milk" },
  },
  {
    path: "/breeding",
    name: "breeding",
    component: () => import("@/features/breeding/views/BreedingDashboardView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Breeding" },
  },
  {
    path: "/breeding/heats",
    name: "breeding.heats",
    component: () => import("@/features/breeding/views/HeatListView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Heats" },
  },
  {
    path: "/breeding/services",
    name: "breeding.services",
    component: () => import("@/features/breeding/views/ServiceListView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Services" },
  },
  {
    path: "/breeding/pregnancy-checks",
    name: "breeding.pregnancy-checks",
    component: () => import("@/features/breeding/views/PregnancyCheckListView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Pregnancy Checks" },
  },
  {
    path: "/breeding/calvings",
    name: "breeding.calvings",
    component: () => import("@/features/breeding/views/CalvingListView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Calvings" },
  },
  {
    path: "/breeding/semen-straws",
    name: "breeding.semen-straws",
    component: () => import("@/features/breeding/views/SemenStrawListView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Semen Straws" },
  },
  {
    path: "/breeding/calendar",
    name: "breeding.calendar",
    component: () => import("@/features/breeding/views/BreedingCalendarView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "Calendar" },
  },
  {
    path: "/breeding/kpis",
    name: "breeding.kpis",
    component: () => import("@/features/breeding/views/BreedingKPIView.vue"),
    meta: { requiresAuth: true, permission: "breeding.view", title: "KPIs" },
  },
  {
    path: "/calves/nursery",
    name: "calves.nursery",
    component: () => import("@/features/calves/views/CalfNurseryView.vue"),
    meta: { requiresAuth: true, permission: "calves.view", title: "Calf Nursery" },
  },
  {
    path: "/calves/weigh",
    name: "calves.weigh",
    component: () => import("@/features/calves/views/CalfWeighView.vue"),
    meta: { requiresAuth: true, permission: "calves.view", title: "Calf Weights" },
  },
  {
    path: "/animals/:id/growth",
    name: "animals.growth",
    component: () => import("@/features/calves/views/CalfGrowthView.vue"),
    meta: { requiresAuth: true, permission: "calves.view", title: "Calf Growth" },
  },
  {
    path: "/health/treatments",
    name: "health.treatments",
    component: () => import("@/features/health/views/TreatmentListView.vue"),
    meta: { requiresAuth: true, permission: "health.view", title: "Treatments" },
  },
  {
    path: "/health/vaccinations",
    name: "health.vaccinations",
    component: () => import("@/features/health/views/VaccinationListView.vue"),
    meta: { requiresAuth: true, permission: "health.view", title: "Vaccinations" },
  },
  {
    path: "/health/sick-bay",
    name: "health.sick-bay",
    component: () => import("@/features/health/views/SickBayView.vue"),
    meta: { requiresAuth: true, permission: "health.view", title: "Sick Bay" },
  },
  {
    path: "/animals/:id/health",
    name: "animals.health",
    component: () => import("@/features/health/views/AnimalHealthView.vue"),
    meta: { requiresAuth: true, permission: "health.view", title: "Animal Health" },
  },
  {
    path: "/health",
    name: "health",
    component: () => import("@/features/health/pages/HealthView.vue"),
    meta: { requiresAuth: true, permission: "health.view", title: "Health" },
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/features/admin/pages/AdminView.vue"),
    meta: {
      requiresAuth: true,
      roles: ["Owner", "Manager"],
      title: "Admin",
    },
  },
  {
    path: "/admin/users",
    name: "admin.users",
    component: () => import("@/features/admin/pages/UsersView.vue"),
    meta: {
      requiresAuth: true,
      permission: "users.view",
      title: "Users",
    },
  },
  {
    path: "/admin/settings",
    name: "admin.settings",
    component: () => import("@/features/admin/pages/SettingsView.vue"),
    meta: {
      requiresAuth: true,
      permission: "settings.update",
      title: "Settings",
    },
  },
  {
    path: "/admin/lookups",
    name: "admin.lookups",
    component: () => import("@/features/admin/pages/LookupsView.vue"),
    meta: {
      requiresAuth: true,
      permission: "lookups.view",
      title: "Lookups",
    },
  },
  {
    path: "/setup",
    name: "setup",
    component: () => import("@/features/setup/pages/SetupView.vue"),
    meta: { requiresAuth: true, title: "Setup" },
  },
  {
    path: "/reports",
    name: "reports",
    component: () => import("@/features/reports/pages/ReportsView.vue"),
    meta: { requiresAuth: true, permission: "reports.view", title: "Reports" },
  },
  {
    path: "/alerts",
    name: "alerts",
    component: () => import("@/features/alerts/pages/AlertsView.vue"),
    meta: { requiresAuth: true, permission: "alerts.view", title: "Alerts" },
  },
  {
    path: "/notifications",
    name: "notifications",
    component: () => import("@/features/alerts/pages/NotificationsView.vue"),
    meta: { requiresAuth: true, permission: "notifications.view", title: "Notifications" },
  },
  {
    path: "/tasks",
    name: "tasks",
    component: () => import("@/features/tasks/pages/TasksView.vue"),
    meta: { requiresAuth: true, permission: "tasks.view", title: "Tasks" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  if (to.meta?.requiresAuth && !auth.isAuthenticated) {
    return next({ name: "login", query: { redirect: String(to.fullPath) } });
  }

  if (to.meta?.permission && !auth.hasPermission(to.meta.permission as string)) {
    return next({ name: "home" });
  }

  const currentRole = String(auth.role ?? "");
  const roles = (to.meta?.roles as Role[] | undefined) ?? [];
  if (roles.length && !roles.includes(currentRole as Role)) {
    return next({ name: "home" });
  }

  next();
});

export default router;
