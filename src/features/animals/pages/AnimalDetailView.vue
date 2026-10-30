<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAnimals } from "@/features/animals/api/animals";
import { formatAge } from "@/features/animals/age";
import { api, type LookupRow } from "@/api";
import { useAuthStore } from "@/stores/auth";
import type { Animal, AnimalImage } from "@/features/animals/types";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const { get, move, exit, timeline, lineage, update, uploadImage, setPrimaryImage, deleteImage } =
  useAnimals();

const id = computed(() => Number(route.params.id));
const animal = ref<Animal | null>(null);
const loading = ref(false);
const error = ref("");
const activeTab = ref("overview");

interface DetailTab {
  key: string;
  label: string;
  route?: string;
}

const tabs: DetailTab[] = [
  { key: "overview", label: "Overview" },
  { key: "milk", label: "Milk", route: "animals.milk" },
  { key: "breeding", label: "Breeding" },
  { key: "health", label: "Health", route: "animals.health" },
  { key: "weights", label: "Weights", route: "animals.growth" },
  { key: "lineage", label: "Lineage" },
  { key: "timeline", label: "Timeline" },
];

const breedingLinks = [
  { name: "breeding.heats", label: "Heats" },
  { name: "breeding.services", label: "Services" },
  { name: "breeding.pregnancy-checks", label: "PD Checks" },
  { name: "breeding.calvings", label: "Calvings" },
];

const showMove = ref(false);
const showExit = ref(false);
const showEdit = ref(false);
const moveLoading = ref(false);
const exitLoading = ref(false);
const editLoading = ref(false);

const lookups = ref<Record<string, LookupRow[]>>({});

const moveForm = ref({ category_id: "", pen_id: "", status_id: "", reason: "" });
const exitForm = ref({ exit_date: "", reason: "", price: "", override: false, override_reason: "" });
const editForm = ref({
  ear_tag: "",
  name: "",
  sex: "F" as "M" | "F",
  birth_date: "",
  category_id: "" as number | "",
  pen_id: "" as number | "",
  status_id: "" as number | "",
  breed_id: "" as number | "",
});
const moveError = ref("");
const exitError = ref("");
const editError = ref("");
const imageInput = ref<HTMLInputElement | null>(null);
const imageUploading = ref(false);
const imageBusyId = ref<number | null>(null);
const imageError = ref("");

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function formatDateTime(value: string | undefined | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

async function loadLookups(): Promise<void> {
  if (Object.keys(lookups.value).length > 0) return;

  try {
    const res = await api.get<{ data: Record<string, LookupRow[]> }>("/lookups/all");
    lookups.value = res.data.data;
  } catch {
    // The selects stay empty; text fields can still be edited.
  }
}

function openMove(): void {
  const a = animal.value;
  if (!a) return;

  moveForm.value = {
    category_id: a.category_id ? String(a.category_id) : "",
    pen_id: a.pen_id ? String(a.pen_id) : "",
    status_id: a.status_id ? String(a.status_id) : "",
    reason: "",
  };
  moveError.value = "";
  showMove.value = true;
  void loadLookups();
}

function openEdit(): void {
  const a = animal.value;
  if (!a) return;

  editForm.value = {
    ear_tag: a.ear_tag,
    name: a.name ?? "",
    sex: a.sex,
    birth_date: a.birth_date ? a.birth_date.slice(0, 10) : "",
    category_id: a.category_id ?? "",
    pen_id: a.pen_id ?? "",
    status_id: a.status_id ?? "",
    breed_id: a.breed_id ?? "",
  };
  editError.value = "";
  showEdit.value = true;
  void loadLookups();
}

const timelineData = ref<any[]>([]);
const lineageData = ref<any>({});

const overviewItems = computed(() => {
  const a = animal.value;
  if (!a) {
    return [];
  }

  return [
    { label: "Name", value: a.name || "—" },
    { label: "Sex", value: a.sex === "F" ? "Female" : "Male" },
    { label: "Birth date", value: formatDate(a.birth_date) },
    { label: "Breed", value: a.breed || "—" },
    { label: "Category", value: a.category || "—" },
    { label: "Pen", value: a.pen || "—" },
    { label: "Status", value: a.status || "—" },
    { label: "Reproductive status", value: a.reproductive_status || "—" },
    { label: "Parity", value: a.parity ?? "—" },
    { label: "Days in milk", value: a.days_in_milk ?? "—" },
    { label: "Withholding", value: a.in_withholding ? "Yes" : "No" },
    { label: "Last updated", value: formatDateTime(a.updated_at) },
  ];
});

const primaryImage = computed<AnimalImage | null>(() => {
  const images = animal.value?.images ?? [];
  return images.find((image) => image.is_primary) ?? images[0] ?? null;
});

const canMove = computed(() => auth.hasPermission("animals.update"));
const canEdit = computed(() => auth.hasPermission("animals.update"));
const canExit = computed(() => auth.hasPermission("animals.delete"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    animal.value = await get(id.value);
    const [tl, lg] = await Promise.all([timeline(id.value), lineage(id.value)]);
    timelineData.value = tl;
    lineageData.value = lg;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

function badgeFor(status: string | undefined) {
  const map: Record<string, string> = {
    Active: "bg-brand-50 text-brand-700 border brand-100",
    "In Heat": "bg-amber-50 text-amber-700 border amber-100",
    Pregnant: "bg-teal-50 text-teal-700 border teal-100",
    Dry: "bg-slate-50 text-slate-700 border slate-100",
    Withholding: "bg-safety-50 text-safety-700 border safety-100",
    Exited: "bg-slate-200 text-slate-500 border slate-200",
  };
  return map[status ?? ""] || "bg-slate-100 text-slate-500";
}

async function handleMove() {
  moveLoading.value = true;
  moveError.value = "";
  try {
    await move(id.value, {
      category_id: moveForm.value.category_id ? Number(moveForm.value.category_id) : undefined,
      pen_id: moveForm.value.pen_id ? Number(moveForm.value.pen_id) : undefined,
      status_id: moveForm.value.status_id ? Number(moveForm.value.status_id) : undefined,
      reason: moveForm.value.reason,
    });
    showMove.value = false;
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      moveError.value = e.response.data.error?.message ?? t("errors.validation_failed");
    } else {
      moveError.value = e.response?.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    moveLoading.value = false;
  }
}

async function handleEdit() {
  const a = animal.value;
  if (!a) return;

  editLoading.value = true;
  editError.value = "";
  try {
    const updated = await update(
      a.id,
      {
        ear_tag: editForm.value.ear_tag.trim(),
        name: editForm.value.name.trim() || null,
        sex: editForm.value.sex,
        birth_date: editForm.value.birth_date || null,
        category_id:
          editForm.value.category_id === ""
            ? a.category_id
            : Number(editForm.value.category_id),
        pen_id: editForm.value.pen_id === "" ? null : Number(editForm.value.pen_id),
        status_id: editForm.value.status_id === "" ? null : Number(editForm.value.status_id),
        breed_id: editForm.value.breed_id === "" ? null : Number(editForm.value.breed_id),
      },
      a.version,
    );
    animal.value = updated;
    showEdit.value = false;
  } catch (e: any) {
    if (e.response?.status === 409) {
      editError.value =
        e.response.data.error?.message ??
        "This record was edited elsewhere. Reload the page and try again.";
    } else if (e.response?.status === 422) {
      const fields = e.response.data.error?.fields ?? {};
      const first = Object.values(fields).flat()[0];
      editError.value =
        typeof first === "string" ? first : t("errors.validation_failed");
    } else {
      editError.value = e.response?.data?.error?.message ?? t("errors.unexpected");
    }
  } finally {
    editLoading.value = false;
  }
}

async function handleExit() {
  exitLoading.value = true;
  exitError.value = "";
  try {
    await exit(id.value, {
      exit_date: exitForm.value.exit_date,
      reason: exitForm.value.reason,
      price: exitForm.value.price ? Number(exitForm.value.price) : undefined,
      override: exitForm.value.override,
      override_reason: exitForm.value.override_reason,
    });
    showExit.value = false;
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      exitError.value = e.response.data.error?.message ?? t("errors.validation_failed");
    } else {
      exitError.value = e.response?.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    exitLoading.value = false;
  }
}

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const imageMaxBytes = 5 * 1024 * 1024;

function imageErrorMessage(e: any): string {
  const fields = e.response?.data?.error?.fields ?? {};
  const first = Object.values(fields).flat()[0];
  if (typeof first === "string") {
    return first;
  }

  return e.response?.data?.error?.message ?? t("errors.unexpected");
}

async function refreshImages(): Promise<void> {
  if (!animal.value) return;

  const res = await api.get<{ data: AnimalImage[] }>("images", {
    params: { imageable_type: "animal", imageable_id: animal.value.id },
  });
  animal.value.images = res.data.data;
}

function openImagePicker(): void {
  imageError.value = "";
  imageInput.value?.click();
}

async function handleImageSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !animal.value) return;

  if (!imageMimeTypes.includes(file.type)) {
    imageError.value = "Choose a JPEG, PNG or WebP image.";
    return;
  }

  if (file.size > imageMaxBytes) {
    imageError.value = "Images must be 5 MB or smaller.";
    return;
  }

  imageUploading.value = true;
  imageError.value = "";
  try {
    await uploadImage(animal.value.id, file);
    await refreshImages();
  } catch (e: any) {
    imageError.value = imageErrorMessage(e);
  } finally {
    imageUploading.value = false;
  }
}

async function handleSetPrimaryImage(image: AnimalImage): Promise<void> {
  if (image.is_primary) return;

  imageBusyId.value = image.id;
  imageError.value = "";
  try {
    await setPrimaryImage(image.id);
    await refreshImages();
  } catch (e: any) {
    imageError.value = imageErrorMessage(e);
  } finally {
    imageBusyId.value = null;
  }
}

async function handleRemoveImage(image: AnimalImage): Promise<void> {
  if (!window.confirm("Remove this picture?")) return;

  imageBusyId.value = image.id;
  imageError.value = "";
  try {
    await deleteImage(image.id);
    await refreshImages();
  } catch (e: any) {
    imageError.value = imageErrorMessage(e);
  } finally {
    imageBusyId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div v-if="loading" class="page p-4">
    <div class="card text-center py-12">{{ t("common.loading") }}</div>
  </div>

  <div v-else-if="error" class="page p-4">
    <div class="card text-center py-12">
      <p class="text-safety-700">{{ error }}</p>
      <button class="btn-primary mt-4" @click="load">{{ t("common.try_again") }}</button>
    </div>
  </div>

  <div v-else-if="animal" class="page p-4">
    <nav class="flex flex-wrap gap-1 mb-4 border-b border-slate-200">
      <template v-for="tab in tabs" :key="tab.key">
        <router-link
          v-if="tab.route"
          :to="{ name: tab.route, params: { id: route.params.id } }"
          class="px-4 py-2 text-sm transition-colors text-slate-500 hover:text-slate-700"
        >
          {{ tab.label }}
        </router-link>
        <button
          v-else
          :class="[
            'px-4 py-2 text-sm transition-colors',
            activeTab === tab.key
              ? 'border-b-2 border-teal-600 text-teal-600 font-medium'
              : 'text-slate-500 hover:text-slate-700',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </template>
    </nav>

    <!-- Header -->
    <div class="card mb-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 shrink-0 overflow-hidden rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
            <img
              v-if="primaryImage"
              :src="primaryImage.url"
              :alt="animal.ear_tag"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ animal.ear_tag.charAt(0) }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ animal.ear_tag }}</h1>
            <div class="flex items-center gap-2 text-sm">
              <span v-if="animal.status" :class="badgeFor(animal.status)">{{ animal.status }}</span>
              <span v-if="animal.in_withholding" class="badge badge-safety">⚠ Withholding</span>
            </div>
            <p class="text-slate-600 mt-1">
              {{ animal.breed || "Breed not set" }} ·
              {{ animal.sex === "F" ? "Female" : "Male" }} ·
              {{ formatAge(animal.birth_date) }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 md:mt-0">
          <div class="p-3 rounded-xl bg-slate-50 text-center">
            <div class="text-xs text-slate-500">Pen</div>
            <div class="font-medium">{{ animal.pen || "—" }}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 text-center">
            <div class="text-xs text-slate-500">Category</div>
            <div class="font-medium">{{ animal.category || "—" }}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 text-center">
            <div class="text-xs text-slate-500">Parity</div>
            <div class="font-medium">{{ animal.parity ?? "—" }}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 text-center">
            <div class="text-xs text-slate-500">DIM</div>
            <div class="font-medium">{{ animal.days_in_milk ?? "—" }}</div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button v-if="canEdit" class="btn-outline btn-sm" @click="openEdit">Edit</button>
        <button v-if="canMove" class="btn-outline btn-sm" @click="openMove">Move</button>
        <button v-if="canExit" class="btn-outline btn-sm" @click="showExit = true">Exit</button>
      </div>
    </div>

    <!-- Tab content -->
    <div v-if="activeTab === 'overview'" class="space-y-4">
      <div class="card">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Details</h3>
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="item in overviewItems" :key="item.label" class="rounded-xl bg-slate-50 p-3">
            <dt class="text-xs text-slate-500">{{ item.label }}</dt>
            <dd class="mt-0.5 text-sm font-medium text-slate-800">{{ item.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div v-else-if="activeTab === 'breeding'" class="card">
      <h3 class="text-sm font-semibold text-slate-700 mb-1 border-b border-slate-100 pb-2">Breeding</h3>
      <p class="mt-3 text-sm text-slate-600">Breeding records for {{ animal.ear_tag }}.</p>
      <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <router-link
          v-for="link in breedingLinks"
          :key="link.name"
          :to="{ name: link.name, query: { animal_id: id } }"
          class="btn-outline btn-sm text-center"
        >
          {{ link.label }}
        </router-link>
      </div>
    </div>

    <div v-else-if="activeTab === 'timeline'" class="space-y-2">
      <h3 class="text-sm font-semibold text-slate-700">Timeline</h3>
      <div v-if="timelineData.length === 0" class="card text-sm text-slate-500 py-4">
        No events recorded yet.
      </div>
      <div v-else class="card divide-y divide-slate-100">
        <div v-for="e in timelineData" :key="e.date" class="p-3 flex gap-3">
          <span class="w-6 text-xs text-slate-400">{{ e.date }}</span>
          <span class="text-sm">{{ e.description }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'lineage'" class="space-y-4">      <h3 class="text-sm font-semibold text-slate-700">Lineage</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card">
          <p class="text-xs text-slate-500">Dam</p>
          <p class="font-medium">{{ lineageData.dam?.ear_tag || "—" }}</p>
        </div>
        <div class="card">
          <p class="text-xs text-slate-500">Sire</p>
          <p class="font-medium">{{ lineageData.sire?.ear_tag || "—" }}</p>
        </div>
        <div class="card">
          <p class="text-xs text-slate-500">Offspring</p>
          <p class="font-medium">{{ (lineageData.offspring ?? []).length }}</p>
        </div>
      </div>
    </div>

    <!-- Edit dialog -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div class="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <h3 class="text-lg font-bold mb-4">Edit animal</h3>
        <p v-if="editError" class="mb-3 p-2 rounded bg-safety-50 text-safety-600 text-xs">{{ editError }}</p>
        <form @submit.prevent="handleEdit" class="space-y-3">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="label">Ear tag</label>
              <input v-model="editForm.ear_tag" class="input" required />
            </div>
            <div>
              <label class="label">Name</label>
              <input v-model="editForm.name" class="input" placeholder="Optional" />
            </div>
            <div>
              <label class="label">Sex</label>
              <select v-model="editForm.sex" class="select">
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
            <div>
              <label class="label">Birth date</label>
              <input v-model="editForm.birth_date" type="date" class="input" />
            </div>
            <div v-if="animal?.sex === 'F'">
              <label class="label">Days in milk</label>
              <input :value="animal?.days_in_milk ?? '—'" class="input" disabled />
            </div>
            <div>
              <label class="label">Breed</label>
              <select v-model="editForm.breed_id" class="select">
                <option value="">None</option>
                <option v-for="row in lookups.breeds" :key="row.id" :value="row.id">
                  {{ row.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Category</label>
              <select v-model="editForm.category_id" class="select" required>
                <option v-for="row in lookups.categories" :key="row.id" :value="row.id">
                  {{ row.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Pen</label>
              <select v-model="editForm.pen_id" class="select">
                <option value="">None</option>
                <option v-for="row in lookups.pens" :key="row.id" :value="row.id">
                  {{ row.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Status</label>
              <select v-model="editForm.status_id" class="select">
                <option value="">None</option>
                <option v-for="row in lookups.animal_statuses" :key="row.id" :value="row.id">
                  {{ row.name }}
                </option>
              </select>
            </div>
          </div>
          <p class="text-xs text-slate-500">
            Parity, days in milk, reproductive status and withholding are calculated from
            calvings, breeding and health records.
          </p>

          <div class="border-t border-slate-100 pt-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="label mb-0">Pictures</p>
                <p class="text-xs text-slate-500">JPEG, PNG or WebP · up to 5 MB</p>
              </div>
              <button
                type="button"
                class="btn-outline btn-sm"
                :disabled="imageUploading"
                @click="openImagePicker"
              >
                {{ imageUploading ? "Uploading…" : "Attach picture" }}
              </button>
            </div>
            <input
              ref="imageInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleImageSelected"
            />
            <p v-if="imageError" class="mt-2 p-2 rounded bg-safety-50 text-safety-600 text-xs">
              {{ imageError }}
            </p>
            <p v-if="!(animal?.images ?? []).length" class="mt-2 text-xs text-slate-500">
              No pictures attached yet.
            </p>
            <div v-else class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div
                v-for="image in animal?.images ?? []"
                :key="image.id"
                class="overflow-hidden rounded-xl border border-slate-200"
              >
                <div class="relative">
                  <img
                    :src="image.url"
                    :alt="image.original_name ?? animal?.ear_tag"
                    class="h-24 w-full object-cover"
                  />
                  <span
                    v-if="image.is_primary"
                    class="absolute left-1 top-1 rounded bg-teal-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  >
                    Primary
                  </span>
                </div>
                <div class="flex gap-1 p-1">
                  <button
                    type="button"
                    class="btn-ghost btn-sm flex-1"
                    :disabled="image.is_primary || imageBusyId === image.id"
                    @click="handleSetPrimaryImage(image)"
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    class="btn-ghost btn-sm flex-1 text-safety-600"
                    :disabled="imageBusyId === image.id"
                    @click="handleRemoveImage(image)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn-outline" @click="showEdit = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="editLoading">
              {{ editLoading ? "…" : "Save" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Move dialog -->
    <div v-if="showMove" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div class="card w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">Move animal</h3>
        <p v-if="moveError" class="mb-3 p-2 rounded bg-safety-50 text-safety-600 text-xs">{{ moveError }}</p>
        <form @submit.prevent="handleMove" class="space-y-3">
          <div>
            <label class="label">Category</label>
            <select v-model="moveForm.category_id" class="select">
              <option value="">No change</option>
              <option v-for="row in lookups.categories" :key="row.id" :value="String(row.id)">
                {{ row.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">Pen</label>
            <select v-model="moveForm.pen_id" class="select">
              <option value="">No change</option>
              <option v-for="row in lookups.pens" :key="row.id" :value="String(row.id)">
                {{ row.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">Status</label>
            <select v-model="moveForm.status_id" class="select">
              <option value="">No change</option>
              <option v-for="row in lookups.animal_statuses" :key="row.id" :value="String(row.id)">
                {{ row.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">Reason</label>
            <input v-model="moveForm.reason" class="input" required />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn-outline" @click="showMove = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="moveLoading">{{ moveLoading ? "…" : "Move" }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Exit dialog -->
    <div v-if="showExit" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div class="card w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">Exit animal</h3>
        <p v-if="animal.in_withholding" class="mb-3 p-2 rounded bg-safety-50 text-safety-700 text-xs border border-safety-200">
          ⚠ This animal is in withholding. Exit requires an override reason.
        </p>
        <p v-if="exitError" class="mb-3 p-2 rounded bg-safety-50 text-safety-600 text-xs">{{ exitError }}</p>
        <form @submit.prevent="handleExit" class="space-y-3">
          <div>
            <label class="label">Exit date</label>
            <input v-model="exitForm.exit_date" type="date" class="input" required />
          </div>
          <div>
            <label class="label">Reason</label>
            <input v-model="exitForm.reason" class="input" required />
          </div>
          <div>
            <label class="label">Price</label>
            <input v-model="exitForm.price" type="number" class="input" placeholder="0.00" />
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="exitForm.override" class="rounded" />
            <label class="text-sm text-slate-600">Override withholding block (Owner/Manager only)</label>
          </div>
          <div v-if="exitForm.override">
            <label class="label">Override reason</label>
            <input v-model="exitForm.override_reason" class="input" />
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" class="btn-outline" @click="showExit = false">Cancel</button>
            <button type="submit" class="btn-danger" :disabled="exitLoading">{{ exitLoading ? "…" : "Exit animal" }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
