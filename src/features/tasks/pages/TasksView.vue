<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTasks, type Task } from "@/features/tasks/api/tasks";
import { useAuthStore } from "@/stores/auth";
import { CheckCircle, Plus } from "lucide-vue-next";

const { t } = useI18n();
const auth = useAuthStore();
const { listTasks, createTask, toggleTask, deleteTask } = useTasks();

const tasks = ref<Task[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const newTitle = ref("");
const newType = ref("general");
const completingId = ref<number | null>(null);
const completionNote = ref("");

const canCreate = computed(() => auth.hasPermission("tasks.create"));
const canDelete = computed(() => auth.hasPermission("tasks.delete"));
const canUpdate = computed(() => auth.hasPermission("tasks.update"));
const canComplete = computed(() => auth.hasPermission("tasks.complete"));

function canToggle(task: Task): boolean {
  if (canUpdate.value) {
    return true;
  }

  return canComplete.value && task.user_id === auth.user?.id;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await listTasks();
    tasks.value = res;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

async function addTask() {
  const title = newTitle.value.trim();
  if (!title) return;
  try {
    await createTask({ title, type: newType.value });
    newTitle.value = "";
    newType.value = "general";
    await load();
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  }
}

function onToggle(task: Task) {
  if (!canToggle(task)) return;

  if (task.is_completed) {
    void setCompletion(task, false, null);
    return;
  }

  completingId.value = task.id;
  completionNote.value = "";
}

function cancelCompletion() {
  completingId.value = null;
  completionNote.value = "";
}

async function setCompletion(
  task: Task,
  isCompleted: boolean,
  completionNote?: string | null,
) {
  saving.value = true;
  error.value = "";
  try {
    await toggleTask(task.id, isCompleted, completionNote);
    cancelCompletion();
    await load();
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    saving.value = false;
  }
}

async function submitCompletion(task: Task) {
  const note = completionNote.value.trim();
  await setCompletion(task, true, note || null);
}

async function removeTask(id: number) {
  if (!window.confirm(t("common.delete_confirm"))) return;
  try {
    await deleteTask(id);
    await load();
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-900">{{ t("tasks.title") }}</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- Add task form (tasks.create only) -->
    <div v-if="canCreate" class="card mb-6">
      <div class="flex gap-2">
        <input
          v-model="newTitle"
          @keyup.enter="addTask"
          type="text"
          :placeholder="t('tasks.new_task_placeholder')"
          class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          v-model="newType"
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="general">{{ t("tasks.type_general") }}</option>
          <option value="breeding">{{ t("tasks.type_breeding") }}</option>
          <option value="health">{{ t("tasks.type_health") }}</option>
          <option value="milk">{{ t("tasks.type_milk") }}</option>
        </select>
        <button
          @click="addTask"
          :disabled="!newTitle.trim()"
          class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          <Plus :size="16" />
          <span class="ml-2">{{ t("common.add") }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else-if="tasks.length > 0" class="space-y-2">
      <div
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'rounded-lg border',
          task.is_completed
            ? 'bg-slate-50 border-slate-100'
            : 'bg-white border-slate-200 shadow-sm',
        ]"
      >
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              @click="onToggle(task)"
              :disabled="!canToggle(task)"
              :title="canToggle(task) ? undefined : t('tasks.not_assigned')"
              class="flex w-5 h-5 shrink-0 items-center justify-center rounded-full border-2"
              :class="[
                task.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-300',
                canToggle(task) ? 'hover:border-green-500' : 'opacity-40 cursor-not-allowed',
              ]"
            >
              <CheckCircle v-if="task.is_completed" :size="14" class="text-white" />
            </button>
            <div class="min-w-0">
              <div
                class="text-sm font-medium"
                :class="[
                  task.is_completed ? 'text-slate-400 line-through' : 'text-slate-900',
                ]"
              >
                {{ task.title }}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">
                {{ task.type }}
                <span v-if="task.due_date"> • {{ task.due_date }}</span>
                <span v-if="task.user_name"> • {{ task.user_name }}</span>
              </div>
              <p v-if="task.completion_note" class="mt-1 text-xs italic text-slate-500">
                “{{ task.completion_note }}”
              </p>
            </div>
          </div>
          <button
            v-if="canDelete"
            @click="() => removeTask(task.id)"
            class="ml-3 text-xs text-red-600 hover:underline"
          >
            {{ t("common.delete") }}
          </button>
        </div>

        <!-- Optional completion comment -->
        <div
          v-if="completingId === task.id"
          class="border-t border-slate-100 bg-slate-50/60 px-4 py-3"
        >
          <label class="mb-1 block text-xs font-medium text-slate-600" :for="`completion-note-${task.id}`">
            {{ t("tasks.completion_note") }}
          </label>
          <textarea
            :id="`completion-note-${task.id}`"
            v-model="completionNote"
            rows="2"
            maxlength="1000"
            :placeholder="t('tasks.completion_note_placeholder')"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <div class="mt-2 flex justify-end gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
              :disabled="saving"
              @click="cancelCompletion"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              :disabled="saving"
              @click="submitCompletion(task)"
            >
              {{ t("tasks.mark_complete") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card text-center py-12">{{ t("tasks.no_tasks") }}</div>

  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
