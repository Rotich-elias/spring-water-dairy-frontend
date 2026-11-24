<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { CheckCircle2, Loader2, Trash2 } from "lucide-vue-next";
import { getErrorMessage } from "@/api";
import {
  deleteInquiry,
  getInquiry,
  updateInquiry,
  type SellerInquiry,
} from "@/features/seller/api/seller";
import { useSellerStore } from "@/stores/seller";

const { t, locale } = useI18n();
const seller = useSellerStore();

const filter = ref("all");
const selected = ref<SellerInquiry | null>(null);
const detailLoading = ref(false);
const working = ref(false);
const notice = ref<string | null>(null);
const error = ref<string | null>(null);

const filters = [
  { value: "all", labelKey: "seller.inquiries.all" },
  { value: "new", labelKey: "seller.inquiries.new" },
  { value: "contacted", labelKey: "seller.inquiries.contacted" },
  { value: "closed", labelKey: "seller.inquiries.closed" },
];

const filtered = computed(() =>
  filter.value === "all"
    ? seller.inquiries
    : seller.inquiries.filter((item) => String(item.status ?? "").toLowerCase() === filter.value),
);

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }).format(
    date,
  );
}

function statusLabel(status: unknown): string {
  const value = String(status ?? "new").toLowerCase();
  if (value === "new") return t("seller.inquiries.new");
  if (value === "contacted") return t("seller.inquiries.contacted");
  if (value === "closed") return t("seller.inquiries.closed");
  return value;
}

function statusClass(status: unknown): string {
  const value = String(status ?? "").toLowerCase();
  if (value === "new") return "badge-brand";
  if (value === "contacted") return "badge-amber";
  return "badge-slate";
}

async function open(inquiry: SellerInquiry): Promise<void> {
  notice.value = null;
  error.value = null;
  selected.value = inquiry;
  detailLoading.value = true;
  try {
    selected.value = await getInquiry(inquiry.id);
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    detailLoading.value = false;
  }
}

async function setStatus(status: string): Promise<void> {
  if (!selected.value) return;
  working.value = true;
  error.value = null;
  notice.value = null;
  try {
    const updated = await updateInquiry(selected.value.id, status);
    selected.value = updated;
    notice.value = "seller.inquiries.updated";
    await seller.loadInquiries();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    working.value = false;
  }
}

async function remove(): Promise<void> {
  if (!selected.value || !window.confirm(t("seller.inquiries.delete_confirm"))) return;
  working.value = true;
  error.value = null;
  notice.value = null;
  try {
    await deleteInquiry(selected.value.id);
    selected.value = null;
    notice.value = "seller.inquiries.deleted";
    await seller.loadInquiries();
  } catch (e: unknown) {
    error.value = getErrorMessage(e, t("errors.unexpected"));
  } finally {
    working.value = false;
  }
}

onMounted(() => {
  void seller.loadInquiries();
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">{{ t("seller.inquiries.title") }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t("seller.inquiries.subtitle") }}</p>
      </div>
      <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
        {{ t("seller.inquiries.filter") }}
        <select v-model="filter" class="select py-2 text-xs">
          <option v-for="option in filters" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="notice" class="alert-success" role="status">
      <CheckCircle2 :size="16" class="mt-0.5 shrink-0" />
      <span>{{ t(notice) }}</span>
    </div>
    <div v-if="error || seller.error" class="alert-error" role="alert">
      {{ error ?? seller.error }}
    </div>

    <div class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section class="card">
        <p v-if="filtered.length === 0" class="text-sm text-slate-500">
          {{ t("seller.inquiries.empty") }}
        </p>
        <div v-else class="table-wrap">
          <table class="data-table min-w-[620px]">
            <thead>
              <tr>
                <th>{{ t("seller.inquiries.name") }}</th>
                <th>{{ t("seller.inquiries.farm") }}</th>
                <th>{{ t("seller.inquiries.email") }}</th>
                <th>{{ t("seller.inquiries.status") }}</th>
                <th>{{ t("seller.inquiries.received") }}</th>
                <th>{{ t("common.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="inquiry in filtered"
                :key="inquiry.id"
                :class="selected?.id === inquiry.id ? 'bg-brand-50/70' : ''"
              >
                <td class="font-medium text-slate-900">{{ inquiry.name }}</td>
                <td>{{ inquiry.farm_name || "—" }}</td>
                <td class="text-xs">{{ inquiry.email }}</td>
                <td>
                  <span class="badge" :class="statusClass(inquiry.status)">
                    {{ statusLabel(inquiry.status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap text-xs">{{ formatDate(inquiry.created_at) }}</td>
                <td>
                  <button type="button" class="btn-ghost btn-sm" @click="open(inquiry)">
                    {{ t("seller.inquiries.detail") }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <div v-if="!selected" class="empty-state">
          <span>{{ t("seller.inquiries.no_detail") }}</span>
        </div>

        <div v-else>
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">{{ selected.name }}</h3>
              <p class="mt-1 text-xs text-slate-500">{{ formatDate(selected.created_at) }}</p>
            </div>
            <span class="badge" :class="statusClass(selected.status)">
              {{ statusLabel(selected.status) }}
            </span>
          </div>

          <Loader2 v-if="detailLoading" :size="20" class="mt-5 animate-spin text-brand-700" />

          <dl v-else class="mt-5 space-y-3 text-sm">
            <div>
              <dt class="label mb-0.5">{{ t("seller.inquiries.farm") }}</dt>
              <dd>{{ selected.farm_name || "—" }}</dd>
            </div>
            <div>
              <dt class="label mb-0.5">{{ t("seller.inquiries.email") }}</dt>
              <dd>
                <a :href="`mailto:${selected.email}`" class="text-brand-700 hover:underline">
                  {{ selected.email }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="label mb-0.5">{{ t("seller.inquiries.phone") }}</dt>
              <dd>{{ selected.phone || "—" }}</dd>
            </div>
            <div>
              <dt class="label mb-0.5">{{ t("seller.inquiries.message") }}</dt>
              <dd class="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-slate-700">
                {{ selected.message }}
              </dd>
            </div>
          </dl>

          <div class="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              class="btn-outline btn-sm"
              :disabled="working"
              @click="setStatus('contacted')"
            >
              {{ t("seller.inquiries.mark_contacted") }}
            </button>
            <button
              type="button"
              class="btn-outline btn-sm"
              :disabled="working"
              @click="setStatus('closed')"
            >
              {{ t("seller.inquiries.mark_closed") }}
            </button>
            <button
              type="button"
              class="btn-ghost btn-sm text-safety-600"
              :disabled="working"
              @click="remove"
            >
              <Trash2 :size="14" />
              {{ t("seller.inquiries.delete") }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
