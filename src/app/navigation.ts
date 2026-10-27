import type { Component } from "vue";
import {
  BarChart3,
  Beef,
  Bell,
  Database,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Milk,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from "lucide-vue-next";

export interface NavItem {
  /** Route name used for navigation. */
  name: string;
  /** Optional prefix used to resolve the active state (defaults to `name`). */
  activePrefix?: string;
  labelKey: string;
  icon: Component;
  permission?: string;
  roles?: string[];
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [
      { name: "home", labelKey: "nav.overview", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "nav.groups.herd",
    items: [
      { name: "animals", labelKey: "nav.animals", icon: Beef, permission: "animals.view" },
      { name: "milk.session", activePrefix: "milk", labelKey: "nav.milk", icon: Milk, permission: "milk.view" },
      { name: "breeding", labelKey: "nav.breeding", icon: HeartPulse, permission: "breeding.view" },
      { name: "health", labelKey: "nav.health", icon: Stethoscope, permission: "health.view" },
    ],
  },
  {
    labelKey: "nav.groups.operations",
    items: [
      { name: "alerts", labelKey: "nav.alerts", icon: Bell, permission: "alerts.view" },
      { name: "notifications", labelKey: "nav.notifications", icon: Inbox, permission: "notifications.view" },
      { name: "tasks", labelKey: "nav.tasks", icon: ListChecks, permission: "tasks.view" },
      { name: "reports", labelKey: "nav.reports", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    labelKey: "nav.groups.admin",
    items: [
      { name: "admin", labelKey: "nav.admin", icon: Shield, roles: ["Owner", "Manager"] },
      { name: "admin.users", labelKey: "nav.users", icon: Users, permission: "users.view" },
      { name: "admin.settings", labelKey: "nav.settings", icon: Settings, permission: "settings.update" },
      { name: "admin.lookups", labelKey: "nav.lookups", icon: Database, permission: "lookups.view" },
    ],
  },
];

/** The four main destinations shown directly in the mobile tab bar. */
export const bottomNavItems: NavItem[] = [
  { name: "home", labelKey: "nav.overview", icon: Home },
  { name: "animals", labelKey: "nav.animals", icon: Beef, permission: "animals.view" },
  { name: "milk.session", activePrefix: "milk", labelKey: "nav.milk", icon: Milk, permission: "milk.view" },
  { name: "breeding", labelKey: "nav.breeding", icon: HeartPulse, permission: "breeding.view" },
];

export function isNavActive(routeName: unknown, item: NavItem): boolean {
  if (typeof routeName !== "string") {
    return false;
  }

  const prefix = item.activePrefix ?? item.name;

  return routeName === prefix || routeName.startsWith(`${prefix}.`);
}

export function findNavItem(routeName: unknown): NavItem | undefined {
  return navGroups
    .flatMap((group) => group.items)
    .find((item) => isNavActive(routeName, item));
}
