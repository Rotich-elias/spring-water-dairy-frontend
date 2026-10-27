<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth";
import { type User } from "@/api";
import { useUsers } from "@/features/admin/composables/useUsers";

const { t } = useI18n();
const auth = useAuthStore();
const { list, create, destroy } = useUsers();

const users = ref<User[]>([]);
const loading = ref(false);
const error = ref("");
const showForm = ref(false);
const saving = ref(false);

const form = ref({
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  role: "Milker",
});
const formErrors = ref<Record<string, string[]>>({});

const roles = ["Owner", "Manager", "Milker", "AI Tech", "Vet", "Viewer"];

const canManage = computed(() => auth.hasPermission("users.create"));

onMounted(load);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await list();
  } catch (e: any) {
    error.value = t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function openCreate() {
  form.value = { name: "", email: "", phone: "", password: "", password_confirmation: "", role: "Milker" };
  formErrors.value = {};
  showForm.value = true;
}

async function save() {
  saving.value = true;
  formErrors.value = {};
  try {
    await create(form.value);
    showForm.value = false;
    await load();
  } catch (e: any) {
    if (e.response?.status === 422) {
      formErrors.value = e.response.data.error?.fields ?? {};
    } else {
      error.value = e.response?.data.error?.message ?? t("errors.unexpected");
    }
  } finally {
    saving.value = false;
  }
}

async function remove(id: number, name: string) {
  if (!window.confirm(`${t("common.delete")} ${name}?`)) return;
  try {
    await destroy(id);
    await load();
  } catch {
    error.value = t("errors.unexpected");
  }
}
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="section-title">{{ t("nav.admin") }}</h1>
      <button v-if="canManage" class="btn-primary" @click="openCreate">
        + {{ t("common.save") }}
      </button>
    </div>

    <p v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </p>

    <div class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
              {{ t("common.name") }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
              {{ t("auth.email_or_phone") }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Permissions</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 text-sm text-slate-900">{{ u.name }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">{{ u.email }}<br /><span class="text-xs text-slate-400">{{ u.phone }}</span></td>
            <td class="px-4 py-3 text-sm font-medium text-slate-700">{{ u.role }}</td>
            <td class="px-4 py-3 text-xs text-slate-500">
              <span class="badge badge-brand" v-for="p in u.permissions" :key="p">{{ p }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="btn-outline btn-sm"
                @click="remove(u.id, u.name)"
                :disabled="u.id === auth.user?.id"
              >
                {{ t("common.delete") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="mt-6 card">
      <h2 class="text-lg font-bold mb-4">{{ t("common.save") }} {{ t("nav.admin") }}</h2>
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">{{ t("common.name") }}</label>
          <input v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label">{{ t("auth.email_or_phone") }}</label>
          <input v-model="form.email" type="email" class="input" required />
        </div>
        <div>
          <label class="label">Phone</label>
          <input v-model="form.phone" class="input" />
        </div>
        <div>
          <label class="label">{{ t("auth.password") }}</label>
          <input
            v-model="form.password"
            type="password"
            class="input"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <div>
          <label class="label">{{ t("auth.confirm_password") }}</label>
          <input
            v-model="form.password_confirmation"
            type="password"
            class="input"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <div>
          <label class="label">Role</label>
          <select v-model="form.role" class="input">
            <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div v-for="(msgs, field) in formErrors" :key="field" class="p-2 rounded bg-safety-50 text-safety-600 text-xs border border-safety-100">
          <strong>{{ field }}:</strong> {{ msgs.join(" ") }}
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn-outline" @click="showForm = false">
            {{ t("common.cancel") }}
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? t("common.loading") : t("common.save") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply rounded-2xl border border-slate-200 bg-white p-6 shadow-xl;
}
</style>
