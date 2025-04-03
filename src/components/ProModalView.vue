<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid'
import { SparklesIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <SparklesIcon class="text-primary-500 mx-auto mb-5 h-10 w-10" />
  <h1 class="text-center font-serif text-2xl">LucidLens pro</h1>
  <p class="mb-5 text-center text-neutral-500">
    Upgrade to pro plan to unlock all features and support us.
  </p>
  <ul class="mx-auto mb-10 w-2/3 space-y-3">
    <li>
      <CheckIcon class="text-primary-500 inline-block h-5 w-5" />
      <span class="ml-2 text-neutral-500"
        >Unlimited access to advanced AI models<sup class="text-[10px]">1</sup></span
      >
    </li>
    <li>
      <CheckIcon class="text-primary-500 inline-block h-5 w-5" />
      <span class="ml-2 text-neutral-500">Early access to new features</span>
    </li>
    <li>
      <CheckIcon class="text-primary-500 inline-block h-5 w-5" />
      <span class="ml-2 text-neutral-500">PRO badge on your profile</span>
    </li>
    <li>
      <CheckIcon class="inline-block h-5 w-5 text-neutral-400" />
      <span class="ml-2 text-neutral-400">Image generation for article thumbnails</span>
      <span class="ml-2 text-xs text-neutral-300">COMING SOON</span>
    </li>
  </ul>
  <div class="mx-auto mb-10 w-2/3">
    <h4 class="mb-2 text-sm text-neutral-500">Choose your pricing ($/month)</h4>
    <input
      id="default-range"
      type="range"
      min="5"
      max="25"
      step="5"
      class="accent-primary-500 h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
    />
    <div class="mt-3 flex items-center justify-between">
      <span class="text-sm text-neutral-400">5$</span>
      <span class="text-sm text-neutral-400">10$</span>
      <span class="text-sm text-neutral-400">15$</span>
      <span class="text-sm text-neutral-400">20$</span>
      <span class="text-sm text-neutral-400">25$</span>
    </div>
  </div>
  <button
    class="bg-primary-500 mx-auto mb-5 flex w-2/3 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-white"
  >
    Upgrade to pro
  </button>
</template>
