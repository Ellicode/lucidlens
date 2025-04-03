<script setup lang="ts">
import type { User } from '@/types'
import { UserIcon } from '@heroicons/vue/24/solid'
import { ref, watch } from 'vue'

const model = defineModel<User | null>()
const bio = ref<string | null>('')
const showFlair = ref(false)
const typingInterval = ref<number | null>(null)

watch(showFlair, (newVal) => {
  if (newVal) {
    const bioRef = model.value?.biography || ''
    let index = 0

    // Clear any existing interval
    if (typingInterval.value) {
      clearInterval(typingInterval.value)
      index = 0
      bio.value = ''
    }

    // Start typewriter effect
    typingInterval.value = setInterval(() => {
      if (index < bioRef.length) {
        bio.value += bioRef.charAt(index)
        index++
      } else {
        if (typingInterval.value) {
          clearInterval(typingInterval.value)
          typingInterval.value = null
        }
      }
    }, 5)
  } else {
    bio.value = ''
    if (typingInterval.value) {
      clearInterval(typingInterval.value)
      typingInterval.value = null
    }
  }
})
</script>

<template>
  <div @mouseenter="showFlair = true" @mouseleave="showFlair = false" class="relative inline">
    <button class="cursor-pointer hover:text-blue-500 hover:underline">
      {{ model?.displayName }}
    </button>
    <transition name="fade">
      <div
        v-if="showFlair"
        class="absolute top-full left-0 min-h-48 w-96 rounded-lg border border-gray-200 bg-white p-5 text-black shadow"
      >
        <div class="flex items-center">
          <img
            v-if="model?.photoURL"
            :src="model.photoURL"
            alt="User Photo"
            class="h-12 w-12 rounded-full border border-gray-200 object-cover"
          />
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 object-cover"
            v-else
          >
            <UserIcon class="h-8 w-8 text-neutral-500" />
          </div>
          <div class="ml-4">
            <h3 class="font-serif text-lg">{{ model?.displayName }}</h3>
            <p class="text-sm text-gray-500">{{ model?.email }}</p>
          </div>
        </div>
        <p class="mt-4 text-sm text-gray-600">
          {{ bio || 'No biography available.' }}
        </p>
      </div>
    </transition>
  </div>
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
