<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { CheckCircle2, Loader2, Pencil, Plus, Power, Trash2 } from "lucide-vue-next";
import { getErrorMessage, type Plan } from "@/api";
import {
  createSellerPlan,
  deleteSellerPlan,
  updateSellerPlan,
} from "@/features/seller/api/seller";
import { useSellerStore } from "@/stores/seller";

const { t } = useI18n();
const seller = useSellerStore();

interface PlanForm {
  code: string;
  name: string;
  description: string;
  price_monthly: string;
  sort_order: string;
  is_active: boolean;
  animals: string;
  users: string;
  milk_records_per_month: string;
  alert_rules: string;
}

function blankForm(): PlanForm {
  return {
    code: "",
    name: "",
    description: "",
    price_monthly: "0",
    sort_order: "0",
    is_active: true,
    animals: "",
    users: "",
    milk_records_per_month: "",
    alert_rules: "",
  };
}

const form = reactive<PlanForm>(blankForm());
const editingId = ref<number | null>(null);
const showForm = ref(false);
const saving = ref(false);
const notice = ref<string | null>(null);
const error = ref<string | null>(null);

const LIMIT_KEYS = ["animals", "users", "milk_records_per_month", "alert_rules"] as const;

const extraLimitKeys = computed(() => {
  const keys = new Set<string>();
  for (const plan of seller.plans) {
    for (const key of Object.keys(plan.limits ?? {})) keys.add(key);
  }
  return [...keys].filter((key) => !LIMIT_KEYS.includes(key as (typeof LIMIT_KEYS)[number]));
});

function limitLabel(key: string): string {
  const map: Record<string, string> = {
    animals: "seller.plans.limit_animals",
    users: "seller.plans.limit_users",
    milk_records_per_month: "seller.plans.limit_milk",
    alert_rules: "seller.plans.limit_alerts",
  };
  return map[key] ? t(map[key]!) : key;
}

function limitValue(plan: Plan, key: string): string {
  const value = plan.limits?.[key];
  return value === null || value === undefined ? t("landing.unlimited") : String(value);
}

function openNew(): void {
  Object.assign(form, blankForm());
  editingId.value = null;
  notice.value = null;
  error.value = null;
  showForm.value = true;
}

function asText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function limitText(plan: Plan, key: string): string {
  const value = plan.limits?.[key];
  return value === null || value === undefined ? "" : String(value);
}

function openEdit(plan: Plan): void {
  Object.assign(form, {
    code: asText(plan.code),
    name: asText(plan.name),
    description: asText(plan.description),
    price_monthly: asText(plan.price_monthly ?? 0),
    sort_order: asText(plan.sort_order ?? 0),
    is_active: plan.is_active !== false,
    animals: limitText(plan, "animals"),
    users: limitText(plan, "users"),
    milk_records_per_month: limitText(plan, "milk_records_per_month"),
    alert_rules: limitText(plan, "alert_rules"),
  });
  editingId.value = plan.id;
  notice.value = null;
  error.value = null;
  showForm.value = true;
}

// Vue casts v-model on number inputs to numbers, so submitted values can be
// either strings or numbers depending on how the user reached the field.
function toLimit(raw: unknown): number | null {
  const trimmed = asText(raw).trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
}

async function save(): Promise<void> {
  const price = Number(form.price_monthly);
  const sortOrder = Number(form.sort_order);

  // Keep limits the form does not expose (for example `milk_records`) instead
  // of silently dropping them when a plan is edited.
  const editingPlan =
    editingId.value === null
      ? null
      : seller.plans.find((plan) => plan.id === editingId.value) ?? null;
  const limits: Record<string, number | null> = { ...(editingPlan?.limits ?? {}) };
  for (const key of LIMIT_KEYS) {
    limits[key] = toLimit(form[key]);
  }

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(sortOrder) ||
    Object.values(limits).some((value) => value !== null && (!Number.isFinite(value) || value < 0))
  ) {
    error.value = t("seller.plans.limit_invalid");
    return;
  }

  saving.value = true;
  error.value = null;
  notice.value = null;
  const payload = {
    code: asText(form.code).trim(),
    name: asText(form.name).trim(),
    description: asText(form.description).trim(),
    price_monthly: price,
    sort_order: sortOrder,
    is_active: form.is_active,
    limits,
  };
  try {
    if (editingId.value !== null) {
      await updateSellerPlan(editingId.value, payload);
      notice.value = "seller.plans.updated";
    } else {
      await createSellerPlan(payload);
      notice.value = "seller.plans.created";
    }
    await seller.loadPlans();
    showForm.value = false;
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    saving.value = false;
  }
}

async function activate(plan: Plan): Promise<void> {
  saving.value = true;
  error.value = null;
  notice.value = null;
  try {
    await updateSellerPlan(plan.id, { is_active: true });
    await seller.loadPlans();
    notice.value = "seller.plans.activated";
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    saving.value = false;
  }
}

async function remove(plan: Plan): Promise<void> {
  if (!window.confirm(t("seller.plans.remove_confirm", { name: plan.name }))) return;
  saving.value = true;
  error.value = null;
  notice.value = null;
  try {
    const result = await deleteSellerPlan(plan.id);
    await seller.loadPlans();
    notice.value = result.deactivated ? "seller.plans.deactivated" : "seller.plans.deleted";
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void seller.loadPlans();
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">{{ t("seller.plans.title") }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t("seller.plans.subtitle") }}</p>
      </div>
      <button type="button" class="btn-primary btn-sm" @click="openNew">
        <Plus :size="15" />
        {{ t("seller.plans.new") }}
      </button>
    </div>

    <div v-if="notice" class="alert-success" role="status">
      <CheckCircle2 :size="16" class="mt-0.5 shrink-0" />
      <span>{{ t(notice) }}</span>
    </div>
    <div v-if="error || seller.error" class="alert-error" role="alert">
      {{ error ?? seller.error }}
    </div>

    <form v-if="showForm" class="card space-y-5" @submit.prevent="save">
      <h3 class="section-title">
        {{ editingId === null ? t("seller.plans.new") : t("seller.plans.edit") }}
      </h3>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="label" for="plan-code">{{ t("seller.plans.code") }}</label>
          <input id="plan-code" v-model="form.code" class="input" required />
        </div>
        <div>
          <label class="label" for="plan-name">{{ t("seller.plans.name") }}</label>
          <input id="plan-name" v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label" for="plan-price">{{ t("seller.plans.price") }}</label>
          <input id="plan-price" v-model="form.price_monthly" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label" for="plan-sort">{{ t("seller.plans.sort_order") }}</label>
          <input id="plan-sort" v-model="form.sort_order" type="number" class="input" />
        </div>
      </div>

      <div>
        <label class="label" for="plan-description">{{ t("seller.plans.description") }}</label>
        <textarea id="plan-description" v-model="form.description" class="input min-h-[80px]" rows="3"></textarea>
      </div>

      <div>
        <p class="label">{{ t("seller.plans.limits") }}</p>
        <p class="mb-3 text-xs text-slate-500">{{ t("seller.plans.unlimited_hint") }}</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="key in LIMIT_KEYS" :key="key">
            <label class="label" :for="`plan-${key}`">{{ limitLabel(key) }}</label>
            <input :id="`plan-${key}`" v-model="form[key]" type="number" min="0" class="input" />
          </div>
        </div>
      </div>

      <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
        {{ t("seller.plans.active") }}
      </label>

      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" class="btn-outline" @click="showForm = false">
          {{ t("seller.plans.cancel") }}
        </button>
        <button type="submit" class="btn-primary" :disabled="saving">
          <Loader2 v-if="saving" :size="16" class="animate-spin" />
          {{ t("seller.plans.save") }}
        </button>
      </div>
    </form>

    <div class="card">
      <p v-if="seller.plans.length === 0" class="text-sm text-slate-500">
        {{ t("seller.plans.empty") }}
      </p>
      <div v-else class="table-wrap">
        <table class="data-table min-w-[860px]">
          <thead>
            <tr>
              <th>{{ t("seller.plans.name") }}</th>
              <th>{{ t("seller.plans.code") }}</th>
              <th>{{ t("seller.plans.price") }}</th>
              <th>{{ t("seller.plans.limits") }}</th>
              <th>{{ t("seller.plans.sort_order") }}</th>
              <th>{{ t("common.status") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in seller.plans" :key="plan.id">
              <td>
                <p class="font-semibold text-slate-900">{{ plan.name }}</p>
                <p class="mt-0.5 max-w-xs text-xs text-slate-500">{{ plan.description }}</p>
              </td>
              <td>
                <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{{ plan.code }}</code>
              </td>
              <td class="whitespace-nowrap font-medium">
                KES {{ Number(plan.price_monthly).toLocaleString("en-KE") }}
              </td>
              <td>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="key in [...LIMIT_KEYS, ...extraLimitKeys]"
                    :key="key"
                    class="badge badge-slate"
                  >
                    {{ limitLabel(key) }}: {{ limitValue(plan, key) }}
                  </span>
                </div>
              </td>
              <td>{{ plan.sort_order ?? 0 }}</td>
              <td>
                <span class="badge" :class="plan.is_active ? 'badge-brand' : 'badge-slate'">
                  {{ t(plan.is_active ? "common.active" : "common.inactive") }}
                </span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <button type="button" class="btn-ghost btn-sm" @click="openEdit(plan)">
                    <Pencil :size="14" />
                    {{ t("common.edit") }}
                  </button>
                  <button
                    v-if="!plan.is_active"
                    type="button"
                    class="btn-ghost btn-sm"
                    :disabled="saving"
                    @click="activate(plan)"
                  >
                    <Power :size="14" />
                    {{ t("seller.plans.activate") }}
                  </button>
                  <button
                    type="button"
                    class="btn-ghost btn-sm text-safety-600"
                    :disabled="saving"
                    @click="remove(plan)"
                  >
                    <Trash2 :size="14" />
                    {{ t("seller.plans.remove") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
