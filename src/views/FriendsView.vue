<script setup lang="ts">
import NavigationBar from '@/components/NavigationBar.vue'
</script>

<template>
  <div class="mx-auto p-5 py-10 xl:py-20 2xl:max-w-7xl">
    <NavigationBar />
    <div class="flex items-start">
      <div class="flex-1">
        <h1 class="font-serif text-3xl">My friends</h1>
        <p class="mt-5 text-neutral-500">Here you can see your friends and their latest posts.</p>
        <p class="mt-5 italic">Coming soon</p>
      </div>
      <div class="flex-1">
        <h1 class="font-serif text-3xl">My saved articles</h1>
        <p class="mt-5 text-neutral-500">Here you can see your saved articles.</p>
        <p class="mt-5 italic">Coming soon</p>
      </div>
    </div>
  </div>
</template>
