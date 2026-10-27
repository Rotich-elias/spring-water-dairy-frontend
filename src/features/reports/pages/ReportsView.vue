<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useReports, type ReportDefinition } from "@/features/reports/api/reports";

const { t } = useI18n();
const { listReports, generateReport, downloadPdf } = useReports();

const reports = ref<ReportDefinition[]>([]);
const loading = ref(false);
const generating = ref(false);
const downloading = ref(false);
const error = ref("");
const notice = ref("");
const result = ref<any>(null);
const selectedType = ref<string>("");
const fromDate = ref("");
const toDate = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    reports.value = await listReports();
  } catch (e: any) {
    error.value = await messageFor(e);
  } finally {
    loading.value = false;
  }
}

function filters(): { from?: string; to?: string } {
  const params: { from?: string; to?: string } = {};
  if (fromDate.value) params.from = fromDate.value;
  if (toDate.value) params.to = toDate.value;
  return params;
}

async function generate() {
  if (!selectedType.value) return;
  generating.value = true;
  error.value = "";
  notice.value = "";
  result.value = null;
  try {
    result.value = await generateReport(selectedType.value, filters());
  } catch (e: any) {
    error.value = await messageFor(e);
  } finally {
    generating.value = false;
  }
}

async function downloadPdfReport() {
  if (!selectedType.value) return;
  downloading.value = true;
  error.value = "";
  notice.value = "";
  try {
    const filename = await downloadPdf(selectedType.value, filters());
    notice.value = `${t("reports.pdf_downloaded")}: ${filename}`;
  } catch (e: any) {
    error.value = await messageFor(e);
  } finally {
    downloading.value = false;
  }
}

async function messageFor(e: any): Promise<string> {
  let data = e.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = undefined;
    }
  }
  return data?.error?.message ?? e.message ?? t("errors.unexpected");
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-900">{{ t("reports.title") }}</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      {{ error }}
    </div>

    <div v-if="notice" class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
      {{ notice }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else-if="reports.length > 0">
      <div class="mb-4 flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1">
          <label class="block text-xs font-semibold text-slate-500 mb-1">{{ t("nav.reports") }}</label>
          <select v-model="selectedType" class="w-full p-2 border border-slate-200 rounded-lg">
            <option value="" disabled>{{ t("reports.select_report") }}</option>
            <option v-for="r in reports" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <p class="text-xs text-slate-500 mt-1">{{ selectedType ? reports.find(r => r.id === selectedType)?.description : "" }}</p>
        </div>
        <div class="flex-1">
          <label class="block text-xs font-semibold text-slate-500 mb-1">{{ t("common.from") }}</label>
          <input v-model="fromDate" type="date" class="w-full p-2 border border-slate-200 rounded-lg" />
        </div>
        <div class="flex-1">
          <label class="block text-xs font-semibold text-slate-500 mb-1">{{ t("common.to") }}</label>
          <input v-model="toDate" type="date" class="w-full p-2 border border-slate-200 rounded-lg" />
        </div>
        <div class="flex-1 flex gap-2">
          <button
            @click="generate"
            :disabled="generating || !selectedType"
            class="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {{ generating ? t("common.loading") : t("reports.generate") }}
          </button>
          <button
            @click="downloadPdfReport"
            :disabled="downloading || !selectedType"
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {{ downloading ? t("common.loading") : t("reports.download_pdf") }}
          </button>
        </div>
      </div>

      <div v-if="result" class="card mt-4">
        <h3 class="text-xs font-semibold text-slate-500 uppercase mb-3">{{ t("reports.result") }}</h3>
        <pre class="text-xs overflow-x-auto p-3 bg-slate-50 rounded">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>

      <div class="mt-6 card">
        <h3 class="text-xs font-semibold text-slate-500 uppercase mb-3">{{ t("reports.title") }}</h3>
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("common.name") }}</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("common.description") }}</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500">{{ t("common.type") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="r in reports" :key="r.id" class="text-slate-700">
              <td class="px-3 py-2 font-medium">{{ r.name }}</td>
              <td class="px-3 py-2 text-slate-600">{{ r.description }}</td>
              <td class="px-3 py-2 text-slate-600 text-xs">{{ r.type }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card text-center py-12">{{ t("reports.no_reports") }}</div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
