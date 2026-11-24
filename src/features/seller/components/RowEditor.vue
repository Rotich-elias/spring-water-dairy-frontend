<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Plus, Trash2 } from "lucide-vue-next";

interface Field {
  key: string;
  labelKey: string;
  type?: "text" | "textarea";
  placeholderKey?: string;
}

const props = defineProps<{
  modelValue: Record<string, unknown>[];
  fields: Field[];
  addLabelKey: string;
  removeLabelKey: string;
  emptyKey: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: Record<string, unknown>[]] }>();
const { t } = useI18n();

function update(index: number, key: string, value: string): void {
  emit(
    "update:modelValue",
    props.modelValue.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
  );
}

function add(): void {
  const row: Record<string, unknown> = {};
  for (const field of props.fields) row[field.key] = "";
  emit("update:modelValue", [...props.modelValue, row]);
}

function remove(index: number): void {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, i) => i !== index),
  );
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="modelValue.length === 0" class="text-sm text-slate-500">{{ t(emptyKey) }}</p>

    <div
      v-for="(row, index) in modelValue"
      :key="index"
      class="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          #{{ index + 1 }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-safety-600 transition hover:bg-safety-50"
          :aria-label="t(removeLabelKey)"
          @click="remove(index)"
        >
          <Trash2 :size="14" />
          {{ t(removeLabelKey) }}
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div v-for="field in fields" :key="field.key" :class="field.type === 'textarea' ? 'sm:col-span-2' : ''">
          <label class="label">{{ t(field.labelKey) }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            :value="String(row[field.key] ?? '')"
            class="input min-h-[80px] resize-y"
            rows="3"
            @input="update(index, field.key, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
          <input
            v-else
            :value="String(row[field.key] ?? '')"
            class="input"
            :placeholder="field.placeholderKey ? t(field.placeholderKey) : undefined"
            @input="update(index, field.key, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <button type="button" class="btn-outline btn-sm" @click="add">
      <Plus :size="14" />
      {{ t(addLabelKey) }}
    </button>
  </div>
</template>
