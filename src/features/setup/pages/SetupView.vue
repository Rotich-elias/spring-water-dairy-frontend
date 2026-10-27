<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { api } from "@/api";

const { t } = useI18n();
const router = useRouter();

const steps = [
  "farm_profile",
  "units_timezone",
  "pens_breeds",
  "review",
];
const step = ref(0);
const status = ref<{ completed: boolean; steps: Array<{ name: string; done: boolean }> } | null>(null);

const farmName = ref("");
const timezone = ref("Africa/Nairobi");
const currency = ref("KES");
const units = ref("metric");
const pens = ref<string[]>(["Parlour A", "Parlour B", "Maternity", "Calf Nursery"]);
const breeds = ref<string[]>(["Friesian / Holstein", "Jersey"]);
const errors = ref<Record<string, string[]>>({});
const saving = ref(false);
const message = ref("");

async function loadStatus() {
  const [statusRes, settingsRes, pensRes, breedsRes] = await Promise.all([
    api.get<{ data: any }>("/setup/status"),
    api.get<{ data: Record<string, any> }>("/settings"),
    api.get<{ data: Array<{ name: string }> }>("/lookups/pens", {
      params: { include_inactive: true },
    }),
    api.get<{ data: Array<{ name: string }> }>("/lookups/breeds", {
      params: { include_inactive: true },
    }),
  ]);

  status.value = statusRes.data.data;

  const settings = settingsRes.data.data ?? {};
  if (settings.farm_name) farmName.value = String(settings.farm_name);
  if (settings.timezone) timezone.value = String(settings.timezone);
  if (settings.currency) currency.value = String(settings.currency);
  if (settings.units) units.value = String(settings.units);

  const penNames = (pensRes.data.data ?? []).map((p) => p.name).filter(Boolean);
  if (penNames.length > 0) pens.value = penNames;

  const breedNames = (breedsRes.data.data ?? []).map((b) => b.name).filter(Boolean);
  if (breedNames.length > 0) breeds.value = breedNames;
}

function currentStepName(): string {
  return steps[step.value]!;
}

function isLast(): boolean {
  return step.value === steps.length - 1;
}

function next() {
  if (step.value < steps.length - 1) step.value++;
}

function back() {
  if (step.value > 0) step.value--;
}

function cleaned(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

async function complete() {
  saving.value = true;
  errors.value = {};
  message.value = "";
  try {
    await api.post("/setup/complete", {
      farm_name: farmName.value.trim(),
      timezone: timezone.value,
      currency: currency.value,
      units: units.value,
      pens: cleaned(pens.value),
      breeds: cleaned(breeds.value),
    });

    message.value = t("setup.completed");
    await router.push({ name: "home" });
  } catch (e: any) {
    if (e.response?.status === 422) {
      errors.value = e.response.data.error?.fields ?? {};
      message.value = t("errors.validation_failed");
    } else {
      message.value = e.response?.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    saving.value = false;
  }
}

onMounted(loadStatus);

const stepLabel = computed(() => (isLast() ? t("setup.finish") : t("common.next")));
</script>

<template>
  <div class="page p-4 max-w-md mx-auto">
    <div class="card">
      <div class="mb-6">
        <h1 class="text-xl font-bold text-slate-900">{{ t("app.name") }}</h1>
        <p class="text-sm text-slate-500">{{ t("app.tagline") }}</p>
      </div>

      <div class="flex items-center mb-4">
        <div
          v-for="(s, i) in steps"
          :key="s"
          class="flex-1 flex items-center justify-center relative"
        >
          <div
            class="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold z-10"
            :class="{
              'bg-teal-600 border-teal-600 text-white': i <= step,
              'border-slate-300 text-slate-400 bg-white': i > step,
            }"
          >
            {{ i + 1 }}
          </div>
          <div v-if="i < steps.length - 1" class="flex-1 h-[1px] bg-slate-300 mx-2" />
        </div>
      </div>

      <!-- Step 1: Farm profile -->
      <div v-if="currentStepName() === 'farm_profile'" class="space-y-4">
        <div>
          <label class="label">{{ t("setup.farm_name") }}</label>
          <input v-model="farmName" class="input" placeholder="Spring Water Dairy" required />
        </div>
      </div>

      <!-- Step 2: Units/timezone -->
      <div v-if="currentStepName() === 'units_timezone'" class="space-y-4">
        <div>
          <label class="label">{{ t("setup.timezone") }}</label>
          <select v-model="timezone" class="input">
            <option value="Africa/Nairobi">Africa / Nairobi</option>
            <option value="Africa/Lagos">Africa / Lagos</option>
            <option value="Africa/Johannesburg">Africa / Johannesburg</option>
          </select>
        </div>
        <div>
          <label class="label">{{ t("setup.currency") }}</label>
          <select v-model="currency" class="input">
            <option value="KES">KES (Kenyan Shilling)</option>
            <option value="UGX">UGX (Ugandan Shilling)</option>
            <option value="TZS">TZS (Tanzanian Shilling)</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label class="label">{{ t("setup.units") }}</label>
          <select v-model="units" class="input">
            <option value="metric">Metric (litres, kg)</option>
          </select>
        </div>
      </div>

      <!-- Step 3: Pens / breeds -->
      <div v-if="currentStepName() === 'pens_breeds'" class="space-y-4">
        <div>
          <label class="label">{{ t("setup.pens") }}</label>
          <div class="space-y-2">
            <div v-for="(p, i) in pens" :key="i" class="flex gap-2">
              <input v-model="pens[i]" class="input flex-1" placeholder="Pen name" />
              <button type="button" class="btn-danger btn-sm" @click="pens.splice(i, 1)" :disabled="pens.length === 1">
                ×
              </button>
            </div>
            <button type="button" class="btn-outline btn-sm text-left w-full" @click="pens.push('')">
              + {{ t("setup.add_pen") }}
            </button>
          </div>
        </div>
        <div>
          <label class="label">{{ t("setup.breeds") }}</label>
          <div class="space-y-2">
            <div v-for="(b, i) in breeds" :key="i" class="flex gap-2">
              <input v-model="breeds[i]" class="input flex-1" placeholder="Breed name" />
              <button type="button" class="btn-danger btn-sm" @click="breeds.splice(i, 1)" :disabled="breeds.length === 1">
                ×
              </button>
            </div>
            <button type="button" class="btn-outline btn-sm text-left w-full" @click="breeds.push('')">
              + {{ t("setup.add_breed") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: Review -->
      <div v-if="currentStepName() === 'review'" class="space-y-3">
        <div>
          <label class="label">{{ t("setup.farm_name") }}</label>
          <p class="text-slate-600">{{ farmName }}</p>
        </div>
        <div>
          <label class="label">{{ t("setup.timezone") }}</label>
          <p class="text-slate-600">{{ timezone }}</p>
        </div>
        <div>
          <label class="label">{{ t("setup.currency") }}</label>
          <p class="text-slate-600">{{ currency }}</p>
        </div>
        <div>
          <label class="label">{{ t("setup.pens") }}</label>
          <p class="text-slate-600">{{ pens.join(", ") }}</p>
        </div>
        <div>
          <label class="label">{{ t("setup.breeds") }}</label>
          <p class="text-slate-600">{{ breeds.join(", ") }}</p>
        </div>
      </div>

      <p v-if="message" class="mt-3 p-3 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-sm">
        {{ message }}
      </p>

      <p v-if="Object.keys(errors).length" class="mt-3 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
        {{ t("errors.validation_failed") }}
        <ul class="mt-1 text-xs list-disc list-inside text-safety-600">
          <li v-for="(msgs, field) in errors" :key="field">
            <strong>{{ field }}:</strong> {{ msgs.join(" ") }}
          </li>
        </ul>
      </p>

      <div class="mt-6 flex justify-between">
        <button v-if="step > 0" class="btn-outline" @click="back">{{ t("common.back") }}</button>
        <button
          v-else
          class="btn-outline hidden"
        ></button>
        <button
          :disabled="saving"
          class="btn-primary"
          @click="isLast() ? complete() : next()"
        >
          {{ saving ? t("common.loading") : stepLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-6 shadow-xl;
}
</style>
