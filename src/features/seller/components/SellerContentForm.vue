<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { CheckCircle2, Loader2, Save } from "lucide-vue-next";
import { useSellerStore } from "@/stores/seller";
import RowEditor from "./RowEditor.vue";

const { t } = useI18n();
const seller = useSellerStore();

const texts = reactive<Record<string, string>>({
  hero_title: "",
  hero_subtitle: "",
  final_title: "",
  final_subtitle: "",
});

const features = ref<Record<string, unknown>[]>([]);
const steps = ref<Record<string, unknown>[]>([]);
const faqs = ref<Record<string, unknown>[]>([]);
const trust = ref<Record<string, unknown>[]>([]);
const saving = ref(false);
const saved = ref(false);

const textFields = [
  { key: "hero_title", labelKey: "seller.content.hero_title", wide: true },
  { key: "hero_subtitle", labelKey: "seller.content.hero_subtitle", wide: true },
  { key: "final_title", labelKey: "seller.content.final_title", wide: true },
  { key: "final_subtitle", labelKey: "seller.content.final_subtitle", wide: true },
];

const tileFields = [
  { key: "title", labelKey: "seller.content.row_title" },
  { key: "body", labelKey: "seller.content.row_body", type: "textarea" as const },
  { key: "icon", labelKey: "seller.content.row_icon" },
];
const faqFields = [
  { key: "question", labelKey: "seller.content.row_question" },
  { key: "answer", labelKey: "seller.content.row_answer", type: "textarea" as const },
];
const trustFields = [
  { key: "label", labelKey: "seller.content.row_label" },
  { key: "icon", labelKey: "seller.content.row_icon" },
];

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function rowsFrom(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) =>
    typeof item === "string" ? { title: item } : { ...((item ?? {}) as Record<string, unknown>) },
  );
}

onMounted(async () => {
  await seller.loadSite();
  const source = seller.site as Record<string, unknown>;
  for (const field of textFields) texts[field.key] = textOf(source[field.key]);
  features.value = rowsFrom(source.feature_items);
  steps.value = rowsFrom(source.step_items);
  faqs.value = rowsFrom(source.faq_items);
  trust.value = rowsFrom(source.trust_items);
});

function cleanRows(rows: Record<string, unknown>[], required: string): Record<string, unknown>[] {
  return rows
    .map((row) => {
      const next: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "string" && !value.trim()) continue;
        next[key] = typeof value === "string" ? value.trim() : value;
      }
      return next;
    })
    .filter((row) => textOf(row[required]).trim().length > 0);
}

async function save(): Promise<void> {
  saving.value = true;
  saved.value = false;
  const ok = await seller.saveSite({
    ...texts,
    feature_items: cleanRows(features.value, "title"),
    step_items: cleanRows(steps.value, "title"),
    faq_items: cleanRows(faqs.value, "question"),
    trust_items: cleanRows(trust.value, "label"),
  });
  saving.value = false;
  saved.value = ok;
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="save">
    <div class="card">
      <h2 class="section-title">{{ t("seller.content.title") }}</h2>
      <p class="mb-6 text-sm text-slate-500">{{ t("seller.content.subtitle") }}</p>

      <div v-if="seller.error" class="alert-error" role="alert">{{ seller.error }}</div>
      <div v-if="saved" class="alert-success" role="status">
        <CheckCircle2 :size="16" class="mt-0.5 shrink-0" />
        <span>{{ t("seller.content.saved") }}</span>
      </div>

      <h3 class="mb-4 text-sm font-semibold text-slate-900">{{ t("seller.content.hero_section") }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="field in textFields" :key="field.key" :class="field.wide ? 'sm:col-span-2' : ''">
          <label class="label" :for="`content-${field.key}`">{{ t(field.labelKey) }}</label>
          <input
            :id="`content-${field.key}`"
            v-model="texts[field.key]"
            class="input"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ t("seller.content.features") }}</h3>
      <RowEditor
        v-model="features"
        :fields="tileFields"
        :add-label-key="'seller.content.add_row'"
        :remove-label-key="'seller.content.remove_row'"
        :empty-key="'seller.content.empty'"
      />
    </div>

    <div class="card">
      <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ t("seller.content.steps") }}</h3>
      <RowEditor
        v-model="steps"
        :fields="tileFields"
        :add-label-key="'seller.content.add_row'"
        :remove-label-key="'seller.content.remove_row'"
        :empty-key="'seller.content.empty'"
      />
    </div>

    <div class="card">
      <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ t("seller.content.faqs") }}</h3>
      <RowEditor
        v-model="faqs"
        :fields="faqFields"
        :add-label-key="'seller.content.add_row'"
        :remove-label-key="'seller.content.remove_row'"
        :empty-key="'seller.content.empty'"
      />
    </div>

    <div class="card">
      <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ t("seller.content.trust") }}</h3>
      <RowEditor
        v-model="trust"
        :fields="trustFields"
        :add-label-key="'seller.content.add_row'"
        :remove-label-key="'seller.content.remove_row'"
        :empty-key="'seller.content.empty'"
      />
    </div>

    <div class="flex justify-end">
      <button type="submit" class="btn-primary" :disabled="saving">
        <Loader2 v-if="saving" :size="16" class="animate-spin" />
        <Save v-else :size="16" />
        {{ t("seller.content.save") }}
      </button>
    </div>
  </form>
</template>
