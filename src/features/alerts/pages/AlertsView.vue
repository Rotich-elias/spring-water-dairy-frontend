<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  useAlerts,
  useAlertRules,
  type Alert,
  type AlertRule,
} from "@/features/alerts/api/alerts";
import { useAuthStore } from "@/stores/auth";

const { t } = useI18n();
const auth = useAuthStore();
const canManage = computed(() => auth.hasPermission("alerts.edit"));

const {
  listAlerts,
  generateAlerts,
  markAlertRead,
  dismissAlert,
} = useAlerts();
const {
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  generateRuleAlerts,
} = useAlertRules();

const tab = ref<"alerts" | "rules">("alerts");
const alerts = ref<Alert[]>([]);
const rules = ref<AlertRule[]>([]);
const loading = ref(false);
const generating = ref(false);
const saving = ref(false);
const error = ref("");
const notice = ref("");

const showRuleForm = ref(false);
const newRule = ref({
  name: "",
  type: "pd_due",
  recipients: "Owner,Manager",
  channels: "in_app",
});

const ruleTypes = [
  "pd_due",
  "dry_off_due",
  "calving_due",
  "heat_window",
  "no_service_day_80",
  "withholding_ending",
  "vaccination_due",
  "calf_behind_target",
  "calf_due_weaning",
];

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [alertRows, ruleRows] = await Promise.all([
      listAlerts(),
      listAlertRules(),
    ]);
    alerts.value = alertRows;
    rules.value = ruleRows;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

function messageFor(e: any): string {
  return e.response?.data.error?.message ?? t("errors.unexpected");
}

async function generate() {
  generating.value = true;
  error.value = "";
  notice.value = "";
  try {
    const [dataAlerts, ruleAlerts] = await Promise.all([
      generateAlerts(),
      generateRuleAlerts(),
    ]);
    notice.value = `${dataAlerts.created + ruleAlerts.created} ${t("alerts.generated")}`;
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  } finally {
    generating.value = false;
  }
}

async function markRead(alert: Alert) {
  try {
    await markAlertRead(alert.id);
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  }
}

async function dismiss(alert: Alert) {
  try {
    await dismissAlert(alert.id);
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  }
}

async function toggleActive(rule: AlertRule) {
  try {
    await updateAlertRule(rule.id, { is_active: !rule.is_active });
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  }
}

async function removeRule(id: number) {
  if (!window.confirm(t("common.delete_confirm"))) return;
  try {
    await deleteAlertRule(id);
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  }
}

async function createRule() {
  saving.value = true;
  error.value = "";
  try {
    await createAlertRule({
      name: newRule.value.name.trim(),
      type: newRule.value.type,
      recipients: newRule.value.recipients
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      channels: newRule.value.channels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      is_active: true,
    });
    showRuleForm.value = false;
    newRule.value = {
      name: "",
      type: "pd_due",
      recipients: "Owner,Manager",
      channels: "in_app",
    };
    notice.value = t("alerts.rule_created");
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  } finally {
    saving.value = false;
  }
}

function typeClass(type: string): string {
  switch (type) {
    case "withholding":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "overdue_calving":
      return "bg-red-50 text-red-700 border-red-200";
    case "vaccine_due":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
      <h1 class="text-xl font-bold text-slate-900">{{ t("alerts.title") }}</h1>
      <div class="flex items-center gap-2">
        <button
          @click="generate"
          :disabled="generating"
          class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          {{ generating ? t("common.loading") : t("alerts.generate") }}
        </button>
        <button
          v-if="tab === 'rules' && canManage"
          @click="showRuleForm = !showRuleForm"
          class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          {{ t("alerts.new_rule") }}
        </button>
      </div>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium"
        :class="tab === 'alerts' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'"
        @click="tab = 'alerts'"
      >
        {{ t("alerts.active_alerts") }} ({{ alerts.length }})
      </button>
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium"
        :class="tab === 'rules' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'"
        @click="tab = 'rules'"
      >
        {{ t("alerts.rules") }} ({{ rules.length }})
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      {{ error }}
    </div>
    <div v-if="notice" class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
      {{ notice }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <template v-else-if="tab === 'alerts'">
      <div v-if="alerts.length > 0" class="space-y-3">
        <div v-for="alert in alerts" :key="alert.id" class="card">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold" :class="typeClass(alert.type)">
                  {{ t(`alerts.types.${alert.type}`) === `alerts.types.${alert.type}` ? alert.type : t(`alerts.types.${alert.type}`) }}
                </span>
                <h3 class="text-sm font-semibold text-slate-800">{{ alert.title }}</h3>
                <span v-if="!alert.read_at" class="w-2 h-2 rounded-full bg-brand-500" :title="t('alerts.unread')"></span>
              </div>
              <p class="text-sm text-slate-600 mt-1">{{ alert.message }}</p>
              <p class="text-xs text-slate-400 mt-1">
                <span v-if="alert.animal">#{{ alert.animal.ear_tag }} &middot; </span>
                {{ new Date(alert.created_at).toLocaleString() }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="!alert.read_at"
                class="text-xs text-blue-600 hover:underline"
                @click="markRead(alert)"
              >
                {{ t("alerts.mark_read") }}
              </button>
              <button
                class="text-xs text-red-600 hover:underline"
                @click="dismiss(alert)"
              >
                {{ t("alerts.dismiss") }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-12">{{ t("alerts.no_alerts") }}</div>
    </template>

    <template v-else>
      <div v-if="showRuleForm" class="card mb-4">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">{{ t("alerts.new_rule") }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="label">{{ t("common.name") }}</label>
            <input v-model="newRule.name" class="input" :placeholder="t('alerts.rule_name_placeholder')" />
          </div>
          <div>
            <label class="label">{{ t("common.type") }}</label>
            <select v-model="newRule.type" class="input">
              <option v-for="type in ruleTypes" :key="type" :value="type">{{ type.replace(/_/g, " ") }}</option>
            </select>
          </div>
          <div>
            <label class="label">{{ t("alerts.recipients") }}</label>
            <input v-model="newRule.recipients" class="input" placeholder="Owner,Manager" />
          </div>
          <div>
            <label class="label">{{ t("alerts.channels") }}</label>
            <input v-model="newRule.channels" class="input" placeholder="in_app" />
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="btn-primary" :disabled="saving || !newRule.name.trim()" @click="createRule">
            {{ saving ? t("common.loading") : t("common.save") }}
          </button>
          <button class="btn-outline" @click="showRuleForm = false">{{ t("common.cancel") }}</button>
        </div>
      </div>

      <div v-if="rules.length > 0" class="overflow-x-auto card">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("common.name") }}</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("common.type") }}</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-slate-500">{{ t("common.status") }}</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("alerts.channels") }}</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("alerts.recipients") }}</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-500">{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="r in rules" :key="r.id" class="text-slate-700">
              <td class="px-3 py-2 font-medium">{{ r.name }}</td>
              <td class="px-3 py-2">{{ r.type.replace(/_/g, " ") }}</td>
              <td class="px-3 py-2 text-center">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="r.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'"
                >
                  {{ r.is_active ? t("common.active") : t("common.inactive") }}
                </span>
              </td>
              <td class="px-3 py-2">{{ (r.channels ?? []).join(", ") }}</td>
              <td class="px-3 py-2">{{ (r.recipients ?? []).join(", ") }}</td>
              <td class="px-3 py-2 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="canManage"
                    class="text-xs text-blue-600 hover:underline"
                    @click="toggleActive(r)"
                  >
                    {{ r.is_active ? t("common.deactivate") : t("common.activate") }}
                  </button>
                  <button
                    v-if="canManage"
                    class="text-xs text-red-600 hover:underline"
                    @click="removeRule(r.id)"
                  >
                    {{ t("common.delete") }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card text-center py-12">{{ t("alerts.no_rules") }}</div>
    </template>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
