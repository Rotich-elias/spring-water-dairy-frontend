<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import {
  AlertTriangle,
  Beef,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-vue-next";
import { useAnimals } from "@/features/animals/api/animals";
import { formatAge } from "@/features/animals/age";
import { api, type LookupRow } from "@/api";
import { useAuthStore } from "@/stores/auth";
import type { Animal } from "@/features/animals/types";

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const { list, lookup, create, importCsv } = useAnimals();

const animals = ref<Animal[]>([]);
const loading = ref(false);
const error = ref("");
const search = ref("");
const filters = ref({
  category_id: undefined as number | undefined,
  status_id: undefined as number | undefined,
  pen_id: undefined as number | undefined,
  breed_id: undefined as number | undefined,
  sex: undefined as "M" | "F" | undefined,
});

const lookups = ref<Record<string, LookupRow[]>>({});
const showAdd = ref(false);
const newTag = ref("");
const creating = ref(false);
const createError = ref("");

const showImport = ref(false);
const importFile = ref<File | null>(null);
const importing = ref(false);
const importError = ref("");
const importResult = ref<{ created: number; failed: number; results: any[] } | null>(null);

const canCreate = computed(() => auth.hasPermission("animals.create"));
const canExport = computed(() => auth.hasPermission("reports.view"));

const activeFilterCount = computed(
  () =>
    Object.values(filters.value).filter((value) => value !== undefined && value !== null)
      .length + (search.value.trim() ? 1 : 0),
);

const filtered = computed(() =>
  animals.value.filter((animal: Animal) => {
    const term = search.value.trim().toLowerCase();
    if (term && !animal.ear_tag.toLowerCase().includes(term)) return false;
    if (filters.value.category_id && animal.category_id !== filters.value.category_id) return false;
    if (filters.value.status_id && animal.status_id !== filters.value.status_id) return false;
    if (filters.value.pen_id && animal.pen_id !== filters.value.pen_id) return false;
    if (filters.value.breed_id && animal.breed_id !== filters.value.breed_id) return false;
    if (filters.value.sex && animal.sex !== filters.value.sex) return false;
    return true;
  }),
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const [animalsRes, lookupsRes] = await Promise.all([
      list({ per_page: 200 }),
      api.get<{ data: Record<string, LookupRow[]> }>("/lookups/all"),
    ]);
    animals.value = animalsRes;
    lookups.value = lookupsRes.data.data;
  } catch (e: any) {
    error.value = e.response?.data?.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

function lookupName(type: string, id: number | undefined): string {
  if (!id) return "—";
  const row = lookups.value[type]?.find((entry) => entry.id === id);
  return row ? row.name : "—";
}

async function handleSearch(): Promise<void> {
  const term = search.value.trim();
  if (term.length < 2) return;

  try {
    const results = await lookup(term);
    if (results.length === 1) {
      void router.push({ name: "animals.detail", params: { id: results[0]!.id } });
    }
  } catch {
    error.value = t("errors.unexpected");
  }
}

async function handleCreate(): Promise<void> {
  creating.value = true;
  createError.value = "";
  try {
    await create({
      ear_tag: newTag.value.trim(),
      category_id: filters.value.category_id ?? 1,
      sex: "F",
    });
    showAdd.value = false;
    newTag.value = "";
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      createError.value =
        e.response.data.error?.fields?.ear_tag?.[0] ?? t("errors.validation_failed");
    } else {
      createError.value = e.response?.data?.error?.message ?? t("errors.unexpected");
    }
  } finally {
    creating.value = false;
  }
}

function resetFilters(): void {
  search.value = "";
  filters.value = {
    category_id: undefined,
    status_id: undefined,
    pen_id: undefined,
    breed_id: undefined,
    sex: undefined,
  };
}

function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  importFile.value = target.files?.[0] ?? null;
}

async function handleImport(): Promise<void> {
  if (!importFile.value) return;
  importing.value = true;
  importError.value = "";
  importResult.value = null;
  try {
    const res = await importCsv(importFile.value);
    importResult.value = res;
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      importError.value =
        e.response.data.error?.message ??
        e.response.data.message ??
        t("errors.validation_failed");
    } else {
      importError.value = e.response?.data?.error?.message ?? t("errors.unexpected");
    }
  } finally {
    importing.value = false;
  }
}

function downloadSample(): void {
  const csv = "ear_tag,name,sex,birth_date,category_id,pen_id,status_id,breed_id\nCOW-101,Maya,F,2023-03-15,,,\nCOW-102,Nina,F,2023-05-20,,,\nCOW-103,Bella,F,2023-07-10,,,\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "animals_bulk_import_sample.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportAnimals(): void {
  const headers = ["id", "ear_tag", "name", "sex", "birth_date", "category", "pen", "status", "breed", "age", "parity", "days_in_milk", "reproductive_status"];
  const rows = [headers.join(",")];
  for (const animal of filtered.value) {
    const values = [
      animal.id,
      animal.ear_tag ?? "",
      animal.name ?? "",
      animal.sex ?? "",
      animal.birth_date ?? "",
      animal.category ?? "",
      animal.pen ?? "",
      animal.status ?? "",
      animal.breed ?? "",
      animal.age ?? "",
      animal.parity ?? "",
      animal.days_in_milk ?? "",
      animal.reproductive_status ?? "",
    ].map((v) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    });
    rows.push(values.join(","));
  }
  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `animals_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <p class="eyebrow">{{ t("nav.groups.herd") }}</p>
        <h1 class="page-title mt-1">{{ t("nav.animals") }}</h1>
        <p class="page-subtitle">
          {{ filtered.length }} animal{{ filtered.length !== 1 ? "s" : "" }} · {{ t("dashboard.total_animals") }}
          {{ animals.length }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button v-if="canExport" type="button" class="btn-outline" @click="exportAnimals">
          <Download :size="16" />
          <span class="hidden sm:inline">Export</span>
        </button>
        <button v-if="canCreate" type="button" class="btn-outline" @click="showImport = true">
          <Upload :size="16" />
          <span class="hidden sm:inline">Import CSV</span>
        </button>
        <button v-if="canCreate" type="button" class="btn-primary" @click="showAdd = true">
          <Plus :size="16" />
          {{ t("dashboard.add_animal") }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert-error">{{ error }}</div>

    <!-- Import CSV Modal -->
    <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div class="card w-full max-w-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">Import animals from CSV</h3>
          <button type="button" class="text-slate-400 hover:text-slate-600" @click="showImport = false; importFile = null; importError = ''; importResult = null">
            <X :size="18" />
          </button>
        </div>
        <p class="text-sm text-slate-600 mb-3">Upload a CSV file with animal data. You can download a sample template below.</p>
        <button type="button" class="btn-outline mb-4" @click="downloadSample">
          <Download :size="16" />
          Download sample CSV
        </button>
        <div class="space-y-3">
          <div>
            <label class="label">CSV file</label>
            <input type="file" accept=".csv,.txt" class="input" @change="onFileChange" />
          </div>
          <p v-if="importError" class="p-2 rounded bg-safety-50 text-safety-600 text-xs">{{ importError }}</p>
          <div v-if="importResult" class="p-3 rounded bg-slate-50 text-sm">
            <div>Created: <span class="font-semibold">{{ importResult.created }}</span></div>
            <div>Failed: <span class="font-semibold">{{ importResult.failed }}</span></div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-outline" @click="showImport = false; importFile = null; importError = ''; importResult = null">Cancel</button>
            <button type="button" class="btn-primary" :disabled="!importFile || importing" @click="handleImport">
              {{ importing ? 'Importing...' : 'Import' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-5">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div class="relative flex-1">
            <label class="label" for="animal-search">{{ t("common.search") }}</label>
            <Search
              :size="17"
              class="pointer-events-none absolute bottom-3.5 left-3.5 text-slate-400"
            />
            <input
              id="animal-search"
              v-model="search"
              type="search"
              class="input pl-10"
              placeholder="Ear tag…"
              @keyup.enter="handleSearch"
            />
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <div>
              <label class="label">Category</label>
              <select v-model="filters.category_id" class="select">
                <option :value="undefined">All</option>
                <option v-for="category in lookups.categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">{{ t("common.status") }}</label>
              <select v-model="filters.status_id" class="select">
                <option :value="undefined">All</option>
                <option v-for="status in lookups.animal_statuses" :key="status.id" :value="status.id">
                  {{ status.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Pen</label>
              <select v-model="filters.pen_id" class="select">
                <option :value="undefined">All</option>
                <option v-for="pen in lookups.pens" :key="pen.id" :value="pen.id">
                  {{ pen.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Sex</label>
              <select v-model="filters.sex" class="select">
                <option :value="undefined">All</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="activeFilterCount > 0" class="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Filter :size="14" />
            {{ activeFilterCount }} active
          </span>
          <button type="button" class="chip transition hover:border-slate-300" @click="resetFilters">
            Clear filters
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <div v-for="i in 8" :key="i" class="skeleton h-40"></div>
    </div>

    <!-- Herd grid -->
    <div
      v-else-if="filtered.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <article
        v-for="animal in filtered"
        :key="animal.id"
        class="card card-hover group relative cursor-pointer overflow-hidden p-0"
        role="button"
        tabindex="0"
        @click="router.push({ name: 'animals.detail', params: { id: animal.id } })"
        @keydown.enter="router.push({ name: 'animals.detail', params: { id: animal.id } })"
      >
        <span
          class="absolute inset-y-0 left-0 w-1"
          :class="animal.in_withholding ? 'bg-safety-500' : 'bg-brand-500/70'"
        ></span>

        <div class="p-5 pl-6">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {{ animal.sex === "F" ? "Female" : "Male" }}
              </p>
              <h2 class="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900">
                {{ animal.ear_tag }}
              </h2>
            </div>
            <span
              v-if="animal.in_withholding"
              class="badge-safety shrink-0"
              title="Milk withheld"
            >
              <AlertTriangle :size="12" />
              Withholding
            </span>
            <span v-else class="badge-brand shrink-0">{{ animal.status ?? "Active" }}</span>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div class="min-w-0">
              <p class="text-slate-400">Pen</p>
              <p class="truncate font-medium text-slate-700">{{ lookupName("pens", animal.pen_id) }}</p>
            </div>
            <div class="min-w-0">
              <p class="text-slate-400">Breed</p>
              <p class="truncate font-medium text-slate-700">{{ lookupName("breeds", animal.breed_id) }}</p>
            </div>
            <div>
              <p class="text-slate-400">{{ t("common.status") }}</p>
              <p class="truncate font-medium text-slate-700">{{ animal.status ?? "—" }}</p>
            </div>
            <div>
              <p class="text-slate-400">Age</p>
              <p class="font-medium text-slate-700">{{ formatAge(animal.birth_date) }}</p>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div class="flex flex-wrap gap-1.5">
              <span v-if="animal.days_in_milk !== undefined" class="badge-slate">
                DIM {{ animal.days_in_milk }}
              </span>
              <span v-if="animal.parity !== undefined" class="badge-slate">Parity {{ animal.parity }}</span>
            </div>
            <span
              class="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-brand-50 group-hover:text-brand-700"
            >
              <Eye :size="15" />
            </span>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state py-16">
      <span class="empty-state-icon"><Beef :size="24" /></span>
      <p class="text-base font-semibold text-slate-800">
        {{ animals.length === 0 ? "No animals yet" : "No animals match your filters" }}
      </p>
      <p class="max-w-sm text-sm text-slate-500">
        {{ animals.length === 0
          ? "Add your first animal to start tracking milk, breeding and health."
          : "Try a different search term or clear the active filters." }}
      </p>
      <div class="mt-4 flex gap-2">
        <button
          v-if="animals.length > 0"
          type="button"
          class="btn-outline"
          @click="resetFilters"
        >
          {{ t("common.cancel") }}
        </button>
        <button v-else-if="canCreate" type="button" class="btn-primary" @click="showAdd = true">
          <Plus :size="16" />
          {{ t("dashboard.add_animal") }}
        </button>
      </div>
    </div>

    <!-- Add animal -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showAdd" class="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
        <div
          class="w-full max-w-md animate-sheet-up rounded-t-3xl border border-slate-200 bg-white p-6 shadow-lift sm:animate-fade-up sm:rounded-3xl"
          role="dialog"
          aria-modal="true"
        >
          <div class="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ t("dashboard.add_animal") }}
              </h2>
              <p class="mt-1 text-sm text-slate-500">Register a new ear tag in the herd.</p>
            </div>
            <button type="button" class="icon-btn -mr-1 -mt-1" @click="showAdd = false">
              <X :size="18" />
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="handleCreate">
            <div>
              <label class="label" for="new-tag">Ear tag</label>
              <input
                id="new-tag"
                v-model="newTag"
                class="input"
                placeholder="COW-001"
                required
                autofocus
              />
            </div>

            <div>
              <label class="label" for="new-category">Category</label>
              <select id="new-category" v-model="filters.category_id" class="select">
                <option :value="undefined">Default</option>
                <option v-for="category in lookups.categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <p v-if="createError" class="text-sm text-safety-600">{{ createError }}</p>

            <div class="flex gap-2 pt-1">
              <button type="button" class="btn-outline flex-1" @click="showAdd = false">
                {{ t("common.cancel") }}
              </button>
              <button type="submit" class="btn-primary flex-1" :disabled="creating">
                {{ creating ? t("common.loading") : t("common.save") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>
