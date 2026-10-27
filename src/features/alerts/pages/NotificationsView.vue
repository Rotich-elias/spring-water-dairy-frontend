<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useNotifications, type Notification } from "@/features/alerts/api/notifications";

const { t } = useI18n();
const { listNotifications, markRead, readAll: readAllApi } = useNotifications();

const notifications = ref<Notification[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await listNotifications({ unread_only: false });
    notifications.value = res;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function markAsRead(id: number) {
  try {
    await markRead(id);
    await load();
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  }
}

async function readAll() {
  try {
    await readAllApi();
    await load();
    error.value = t("notifications.marked_all_read");
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-900">{{ t("notifications.title") }}</h1>
      <button
        @click="readAll"
        class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
      >
        {{ t("notifications.mark_all_read") }}
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else-if="notifications.length > 0" class="space-y-2">
      <template v-for="n in notifications" :key="n.id">
        <div
          :class="[
            'p-4 rounded-lg border',
            n.read ? 'bg-slate-50 border-slate-100' : 'bg-white border-blue-100 shadow-sm',
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium"
                  :class="[
                    n.type === 'breeding' ? 'bg-blue-50 text-blue-600' :
                    n.type === 'health' ? 'bg-amber-50 text-amber-600' :
                    n.type === 'milk' ? 'bg-teal-50 text-teal-600' :
                    'bg-slate-50 text-slate-500',
                  ]"
                >
                  {{ n.type }}
                </span>
                <span v-if="!n.read" class="ml-2 w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <h3 class="text-sm font-semibold text-slate-900">{{ n.title }}</h3>
              <p class="text-sm text-slate-600">{{ n.message }}</p>
              <div class="mt-2 text-xs text-slate-400">
                {{ n.created_at }}
                <span v-if="n.user_name"> • {{ n.user_name }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="!n.read"
                @click="() => markAsRead(n.id)"
                class="text-xs text-blue-600 hover:underline"
              >
                {{ t("notifications.mark_read") }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="card text-center py-12">{{ t("notifications.no_notifications") }}</div>

  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
