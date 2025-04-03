<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import { useOnline } from '@vueuse/core'
import { ExclamationTriangleIcon } from '@heroicons/vue/20/solid'

const online = useOnline()
const route = useRoute()
</script>

<template>
  <div
    class="flex w-full items-center justify-center gap-3 bg-red-500 font-serif text-white transition-all"
    :class="{
      'h-10': !online,
      'h-0': online,
    }"
  >
    <ExclamationTriangleIcon class="h-5 w-5" />
    <span> You are offline. Some features may not work as expected. </span>
  </div>
  <RouterView v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </RouterView>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
