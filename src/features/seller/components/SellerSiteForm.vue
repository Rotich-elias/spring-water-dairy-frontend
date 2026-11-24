<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { CheckCircle2, Loader2, Save } from "lucide-vue-next";
import { useSellerStore } from "@/stores/seller";

const { t } = useI18n();
const seller = useSellerStore();

interface TextField {
  key: string;
  labelKey: string;
  type?: "text" | "email" | "url" | "textarea";
  wide?: boolean;
}

const businessFields: TextField[] = [
  { key: "business_name", labelKey: "seller.site.business_name" },
  { key: "business_email", labelKey: "seller.site.business_email", type: "email" },
  { key: "business_phone", labelKey: "seller.site.business_phone" },
  { key: "business_address", labelKey: "seller.site.business_address", type: "textarea", wide: true },
  { key: "business_logo_path", labelKey: "seller.site.business_logo_path", wide: true },
];

const brandFields: TextField[] = [
  { key: "platform_name", labelKey: "seller.site.platform_name" },
  { key: "parent_company", labelKey: "seller.site.parent_company" },
  { key: "parent_company_short", labelKey: "seller.site.parent_company_short" },
  { key: "parent_company_url", labelKey: "seller.site.parent_company_url", type: "url" },
  { key: "powered_by_label", labelKey: "seller.site.powered_by_label", wide: true },
];

const form = reactive<Record<string, string>>({});
const saving = ref(false);
const saved = ref(false);

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

onMounted(async () => {
  await seller.loadSite();
  const source = seller.site as Record<string, unknown>;
  for (const field of [...businessFields, ...brandFields]) {
    form[field.key] = textOf(source[field.key]);
  }
});

async function save(): Promise<void> {
  saving.value = true;
  saved.value = false;
  const ok = await seller.saveSite({ ...form });
  saving.value = false;
  saved.value = ok;
}
</script>

<template>
  <form class="card" @submit.prevent="save">
    <h2 class="section-title">{{ t("seller.site.title") }}</h2>
    <p class="mb-6 text-sm text-slate-500">{{ t("seller.site.subtitle") }}</p>

    <div v-if="seller.error" class="alert-error" role="alert">{{ seller.error }}</div>
    <div v-if="saved" class="alert-success" role="status">
      <CheckCircle2 :size="16" class="mt-0.5 shrink-0" />
      <span>{{ t("seller.site.saved") }}</span>
    </div>

    <fieldset class="space-y-5">
      <legend class="mb-4 text-sm font-semibold text-slate-900">
        {{ t("seller.site.business_section") }}
      </legend>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="field in businessFields" :key="field.key" :class="field.wide ? 'sm:col-span-2' : ''">
          <label class="label" :for="`site-${field.key}`">{{ t(field.labelKey) }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            :id="`site-${field.key}`"
            v-model="form[field.key]"
            class="input min-h-[90px] resize-y"
            rows="3"
          ></textarea>
          <input
            v-else
            :id="`site-${field.key}`"
            v-model="form[field.key]"
            :type="field.type ?? 'text'"
            class="input"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="mt-8 space-y-5 border-t border-slate-100 pt-6">
      <legend class="mb-4 text-sm font-semibold text-slate-900">
        {{ t("seller.site.brand_section") }}
      </legend>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="field in brandFields" :key="field.key" :class="field.wide ? 'sm:col-span-2' : ''">
          <label class="label" :for="`site-${field.key}`">{{ t(field.labelKey) }}</label>
          <input
            :id="`site-${field.key}`"
            v-model="form[field.key]"
            :type="field.type ?? 'text'"
            class="input"
          />
        </div>
      </div>
    </fieldset>

    <div class="mt-7 flex justify-end">
      <button type="submit" class="btn-primary" :disabled="saving">
        <Loader2 v-if="saving" :size="16" class="animate-spin" />
        <Save v-else :size="16" />
        {{ t("seller.site.save") }}
      </button>
    </div>
  </form>
</template>
