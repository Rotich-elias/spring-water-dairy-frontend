<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useBreeding, type Heat, type Service, type PregnancyCheck, type Calving } from "@/features/breeding/api/breeding";
import BreedingNav from "@/features/breeding/BreedingNav.vue";

const { t } = useI18n();
const { listHeats, listServices, listPregnancyChecks, listCalvings } = useBreeding();

const heats = ref<Heat[]>([]);
const services = ref<Service[]>([]);
const pregnancyChecks = ref<PregnancyCheck[]>([]);
const calvings = ref<Calving[]>([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [h, s, p, c] = await Promise.all([
      listHeats({ per_page: 10 }),
      listServices({ per_page: 10 }),
      listPregnancyChecks({ per_page: 10 }),
      listCalvings({ per_page: 10 }),
    ]);
    heats.value = h;
    services.value = s;
    pregnancyChecks.value = p;
    calvings.value = c;
  } catch (e: any) {
    error.value = e.response?.data.error?.message ?? t("errors.unexpected");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="page p-4">
    <BreedingNav />

    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-slate-900">Breeding</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-safety-50 border border-safety-200 text-safety-700 text-sm">
      {{ error }}
    </div>

    <div v-if="loading" class="card text-center py-12">{{ t("common.loading") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Heats -->
      <router-link :to="{ name: 'breeding.heats' }" class="card card-hover block">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-700">Heats</h3>
        </div>
        <div class="text-2xl font-bold text-teal-600">{{ heats.length }}</div>
        <div class="mt-3 space-y-2">
          <div v-for="h in heats" :key="h.id" class="text-sm flex justify-between">
            <span class="text-slate-600">{{ h.animal_ear_tag }}</span>
            <span class="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
              {{ h.heat_date }}
            </span>
          </div>
          <div v-if="heats.length === 0" class="text-xs text-slate-400 italic mt-2">
            No heats recorded
          </div>
        </div>
      </router-link>

      <!-- Services -->
      <router-link :to="{ name: 'breeding.services' }" class="card card-hover block">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-700">Services</h3>
        </div>
        <div class="text-2xl font-bold text-blue-600">{{ services.length }}</div>
        <div class="mt-3 space-y-2">
          <div v-for="s in services" :key="s.id" class="text-sm flex justify-between">
            <span class="text-slate-600">{{ s.animal_ear_tag }}</span>
            <span class="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              {{ s.service_date }}
            </span>
          </div>
          <div v-if="services.length === 0" class="text-xs text-slate-400 italic mt-2">
            No services recorded
          </div>
        </div>
      </router-link>

      <!-- Pregnancy Checks -->
      <router-link :to="{ name: 'breeding.pregnancy-checks' }" class="card card-hover block">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-700">PD Checks</h3>
        </div>
        <div class="text-2xl font-bold text-purple-600">{{ pregnancyChecks.length }}</div>
        <div class="mt-3 space-y-2">
          <div v-for="p in pregnancyChecks" :key="p.id" class="text-sm flex justify-between">
            <span class="text-slate-600">{{ p.animal_ear_tag }}</span>
            <span class="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
              {{ p.result }}
            </span>
          </div>
          <div v-if="pregnancyChecks.length === 0" class="text-xs text-slate-400 italic mt-2">
            No PD checks recorded
          </div>
        </div>
      </router-link>

      <!-- Calvings -->
      <router-link :to="{ name: 'breeding.calvings' }" class="card card-hover block">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-700">Calvings</h3>
        </div>
        <div class="text-2xl font-bold text-amber-600">{{ calvings.length }}</div>
        <div class="mt-3 space-y-2">
          <div v-for="c in calvings" :key="c.id" class="text-sm flex justify-between">
            <span class="text-slate-600">{{ c.dam_ear_tag }}</span>
            <span class="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
              {{ c.calving_date }}
            </span>
          </div>
          <div v-if="calvings.length === 0" class="text-xs text-slate-400 italic mt-2">
            No calvings recorded
          </div>
        </div>
      </router-link>
    </div>

    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card col-span-1 md:col-span-2">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Quick Actions
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <router-link :to="{ name: 'breeding.heats', query: { new: '1' } }" class="btn-outline btn-sm text-left">
            Record Heat
          </router-link>
          <router-link :to="{ name: 'breeding.services', query: { new: '1' } }" class="btn-outline btn-sm text-left">
            Record Service
          </router-link>
          <router-link :to="{ name: 'breeding.pregnancy-checks', query: { new: '1' } }" class="btn-outline btn-sm text-left">
            Record PD Check
          </router-link>
          <router-link :to="{ name: 'breeding.calvings', query: { new: '1' } }" class="btn-outline btn-sm text-left">
            Record Calving
          </router-link>
        </div>
      </div>
      <div class="card col-span-1 md:col-span-2">
        <h3 class="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Calendar & KPIs
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <router-link :to="{ name: 'breeding.calendar' }" class="btn-outline btn-sm text-left">
            Breeding Calendar
          </router-link>
          <router-link :to="{ name: 'breeding.kpis' }" class="btn-outline btn-sm text-left">
            Breeding KPIs
          </router-link>
          <router-link :to="{ name: 'breeding.semen-straws' }" class="btn-outline btn-sm col-span-2 text-left">
            Semen Straws
          </router-link>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.card {
  @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm;
}
</style>
