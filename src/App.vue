<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppSidebar from "@/components/AppSidebar.vue";
import BottomNav from "@/components/BottomNav.vue";
import SyncChip from "@/components/SyncChip.vue";
import TopBar from "@/components/TopBar.vue";

const route = useRoute();

const showShell = computed(() => route.name !== "login");
</script>

<template>
  <div class="min-h-screen bg-cream">
    <template v-if="showShell">
      <AppSidebar />

      <div class="flex min-h-screen flex-col lg:pl-[var(--sidebar-width)]">
        <TopBar />

        <main class="flex-1 pb-24 lg:pb-10">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>

      <BottomNav />
      <SyncChip />
    </template>

    <router-view v-else />
  </div>
</template>

<style scoped>
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-leave-active {
  transition: opacity 0.12s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
}
</style>
