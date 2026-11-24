<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth";
import { useTenantStore } from "@/stores/tenant";

const { t } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();

const canCreate = computed(() => auth.hasPermission("tenants.create"));
const message = ref("");

const form = ref({
  name: "",
  slug: "",
  plan_code: "",
});

onMounted(() => {
  void tenantStore.load();
});

async function submit(): Promise<void> {
  message.value = "";
  const created = await tenantStore.create({
    name: form.value.name.trim(),
    ...(form.value.slug.trim() ? { slug: form.value.slug.trim() } : {}),
    ...(form.value.plan_code ? { plan_code: form.value.plan_code } : {}),
  });

  if (created) {
    message.value = t("tenants.created");
    form.value = { name: "", slug: "", plan_code: "" };
  }
}
</script>

<template>
  <div class="page p-4 max-w-5xl">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t("tenants.title") }}</h1>
        <p class="page-subtitle">{{ t("tenants.subtitle") }}</p>
      </div>
    </div>

    <p
      v-if="tenantStore.error"
      class="mb-4 rounded-lg border border-safety-200 bg-safety-50 p-3 text-sm text-safety-700"
    >
      {{ tenantStore.error }}
    </p>

    <p
      v-if="message"
      class="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700"
    >
      {{ message }}
    </p>

    <p v-if="tenantStore.loading && !tenantStore.tenants.length" class="card text-slate-500">
      {{ t("common.loading") }}
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="tenant in tenantStore.tenants"
        :key="tenant.id"
        class="card card-hover flex flex-col gap-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-semibold text-slate-900">
              {{ tenant.name }}
            </h2>
            <p class="truncate text-xs text-slate-500">/{{ tenant.slug }}</p>
          </div>
          <div class="flex flex-wrap justify-end gap-1">
            <span v-if="tenant.current" class="badge badge-brand">
              {{ t("tenants.current") }}
            </span>
            <span v-if="tenant.is_owner" class="badge border border-slate-200 bg-slate-100 text-slate-700">
              {{ t("tenants.owner") }}
            </span>
          </div>
        </div>

        <dl class="space-y-1 text-sm text-slate-600">
          <div class="flex justify-between gap-3">
            <dt class="text-slate-500">{{ t("tenants.role", "Role") }}</dt>
            <dd class="font-medium text-slate-800">
              {{ tenant.role ?? t("tenants.no_role", "No role") }}
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-slate-500">{{ t("common.status") }}</dt>
            <dd class="font-medium capitalize text-slate-800">{{ tenant.status }}</dd>
          </div>
        </dl>

        <button
          type="button"
          class="btn-primary mt-auto w-full"
          :disabled="tenant.current || tenantStore.saving"
          @click="tenantStore.switchTo(tenant.id)"
        >
          {{
            tenant.current
              ? t("tenants.current")
              : t("tenants.switch")
          }}
        </button>
      </div>
    </div>

    <p
      v-if="!tenantStore.loading && !tenantStore.tenants.length"
      class="card text-slate-500"
    >
      {{ t("tenants.no_farms") }}
    </p>

    <section v-if="canCreate" class="card mt-6">
      <h2 class="section-title">{{ t("tenants.create") }}</h2>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="label" for="tenant-name">
            {{ t("tenants.name") }}
          </label>
          <input
            id="tenant-name"
            v-model="form.name"
            class="input"
            required
            autocomplete="off"
          />
        </div>

        <div>
          <label class="label" for="tenant-slug">
            {{ t("tenants.slug") }}
          </label>
          <input
            id="tenant-slug"
            v-model="form.slug"
            class="input"
            autocomplete="off"
          />
        </div>

        <div v-if="tenantStore.plans.length">
          <label class="label" for="tenant-plan">
            {{ t("tenants.plan") }}
          </label>
          <select id="tenant-plan" v-model="form.plan_code" class="select">
            <option value="">{{ t("tenants.default_plan", "Default plan") }}</option>
            <option v-for="plan in tenantStore.plans" :key="plan.id" :value="plan.code">
              {{ plan.name }}
            </option>
          </select>
        </div>

        <button type="submit" class="btn-primary" :disabled="tenantStore.saving || !form.name.trim()">
          {{ tenantStore.saving ? t("common.loading") : t("common.save") }}
        </button>
      </form>
    </section>
  </div>
</template>
