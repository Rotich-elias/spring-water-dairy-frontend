<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";

interface LookupRow {
  id: number;
  name: string;
  active: boolean;
  sort_order: number;
}

const { t } = useI18n();
const auth = useAuthStore();
const canEdit = computed(() => auth.hasPermission("lookups.edit"));

const lookups = ref<Record<string, LookupRow[]>>({});
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const notice = ref("");
const newNames = ref<Record<string, string>>({});
const editingId = ref<number | null>(null);
const editingName = ref("");

const types = [
  "categories",
  "breeds",
  "pens",
  "animal-statuses",
  "pd-results",
  "calving-ease-scores",
  "health-conditions",
  "feed-groups",
];

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get<{ data: Record<string, LookupRow[]> }>("/lookups/all");
    lookups.value = res.data.data;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

function messageFor(e: any): string {
  return (
    e.response?.data?.error?.fields?.name?.[0] ??
    e.response?.data?.error?.message ??
    t("errors.unexpected")
  );
}

async function add(type: string) {
  const name = (newNames.value[type] ?? "").trim();
  if (!name) return;

  saving.value = true;
  error.value = "";
  notice.value = "";
  try {
    await api.post("/lookups", { type, name, active: true });
    newNames.value[type] = "";
    notice.value = t("lookups.added");
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  } finally {
    saving.value = false;
  }
}

function startEdit(row: LookupRow) {
  editingId.value = row.id;
  editingName.value = row.name;
}

function cancelEdit() {
  editingId.value = null;
  editingName.value = "";
}

async function saveEdit(row: LookupRow) {
  const name = editingName.value.trim();
  if (!name || name === row.name) {
    cancelEdit();
    return;
  }

  saving.value = true;
  error.value = "";
  try {
    await api.patch(`/lookups/${row.id}`, { name });
    notice.value = t("lookups.updated");
    cancelEdit();
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  } finally {
    saving.value = false;
  }
}

async function toggle(row: LookupRow) {
  saving.value = true;
  error.value = "";
  try {
    await api.patch(`/lookups/${row.id}`, { active: !row.active });
    notice.value = t("lookups.updated");
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  } finally {
    saving.value = false;
  }
}

async function remove(row: LookupRow) {
  if (!window.confirm(t("common.delete_confirm"))) return;

  saving.value = true;
  error.value = "";
  try {
    await api.delete(`/lookups/${row.id}`);
    notice.value = t("lookups.deleted");
    await load();
  } catch (e: any) {
    error.value = messageFor(e);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <h1 class="section-title">{{ t("nav.lookups") }}</h1>

    <p v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </p>

    <p v-if="notice" class="mb-4 p-3 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-sm">
      {{ notice }}
    </p>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="type in types" :key="type" class="card">
        <h3 class="text-sm font-semibold text-slate-700 uppercase mb-3">
          {{ type.replace(/-/g, " ") }}
        </h3>

        <ul class="space-y-1">
          <li
            v-for="row in (lookups[type] || [])"
            :key="row.id"
            class="flex items-center justify-between gap-2 py-1.5 text-sm border-b border-slate-100 last:border-0"
          >
            <template v-if="editingId === row.id">
              <input
                v-model="editingName"
                class="input input-sm flex-1"
                @keyup.enter="saveEdit(row)"
                @keyup.esc="cancelEdit"
              />
              <div class="flex items-center gap-1">
                <button class="text-xs text-brand-700 hover:underline" :disabled="saving" @click="saveEdit(row)">
                  {{ t("common.save") }}
                </button>
                <button class="text-xs text-slate-500 hover:underline" @click="cancelEdit">
                  {{ t("common.cancel") }}
                </button>
              </div>
            </template>

            <template v-else>
              <span
                class="flex-1 truncate"
                :class="[row.active ? 'text-slate-700' : 'text-slate-400 line-through']"
              >
                {{ row.name }}
              </span>

              <div v-if="canEdit" class="flex items-center gap-1.5">
                <button class="text-xs text-blue-600 hover:underline" @click="startEdit(row)">
                  {{ t("common.edit") }}
                </button>
                <button class="text-xs text-slate-500 hover:underline" :disabled="saving" @click="toggle(row)">
                  {{ row.active ? t("common.deactivate") : t("common.activate") }}
                </button>
                <button class="text-xs text-red-600 hover:underline" :disabled="saving" @click="remove(row)">
                  ×
                </button>
              </div>

              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                :class="[
                  row.active
                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200',
                ]"
              >
                {{ row.active ? t("common.active") : t("common.inactive") }}
              </span>
            </template>
          </li>

          <li v-if="(lookups[type] || []).length === 0" class="py-1.5 text-xs text-slate-400 italic">
            {{ t("common.empty") }}
          </li>
        </ul>

        <div v-if="canEdit" class="mt-3 flex gap-2">
          <input
            v-model="newNames[type]"
            class="input input-sm flex-1"
            :placeholder="t('lookups.add_placeholder')"
            @keyup.enter="add(type)"
          />
          <button class="btn-primary btn-sm" :disabled="saving || !(newNames[type] ?? '').trim()" @click="add(type)">
            {{ t("common.add") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
