<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from 'date-fns'
import type { Article } from '@/types'
import { PhotoIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  article: Article
  layout: 'horizontal' | 'vertical'
}>()

const isLoaded = ref(false)
</script>
<template>
  <router-link
    :to="{ name: 'detail', params: { id: props.article.id } }"
    class="flex overflow-hidden border border-neutral-100"
    :class="props.layout === 'horizontal' ? 'flex-row' : 'flex-col'"
  >
    <img
      loading="lazy"
      :src="props.article.image"
      alt="Article Image"
      @load="isLoaded = true"
      :class="[
        props.layout === 'horizontal' ? 'h-64 w-1/3 md:h-full md:w-3/8' : 'h-48 w-full',
        isLoaded ? '' : 'animate-pulse',
      ]"
      v-if="props.article.image"
      class="shrink-0 bg-neutral-300 object-cover brightness-90"
    />
    <div
      v-else
      :class="[props.layout === 'horizontal' ? 'h-64 w-1/3 md:h-full md:w-3/8' : 'h-48 w-full']"
      class="flex shrink-0 items-center justify-center bg-neutral-200"
    >
      <PhotoIcon class="h-16 w-16 text-neutral-800" />
    </div>
    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="mb-3 flex items-center" v-if="props.article.headline">
        <span
          :class="{ 'text-red-500': props.article.headline == 'breaking' }"
          class="text-xs uppercase"
        >
          {{ props.article.headline }}
        </span>
        <div
          :class="props.article.headline == 'breaking' ? 'from-red-300' : 'from-neutral-200'"
          class="ms-3 h-px w-full bg-gradient-to-r"
        ></div>
      </div>

      <h3 class="mb-3 w-full font-serif text-2xl break-words">
        {{ props.article.title }}
      </h3>

      <p class="break-words text-neutral-500">
        {{
          props.layout === 'horizontal'
            ? props.article.description
            : props.article.description.slice(0, 80) + '...'
        }}
      </p>
      <div class="mt-auto flex pt-5">
        <a
          v-for="tag in props.article.tags"
          :key="tag"
          class="group mr-1 cursor-pointer text-sm whitespace-nowrap lowercase"
        >
          <span class="group-hover:text-blue-500 group-hover:underline">#{{ tag }}</span> &bull;
        </a>
        <span class="truncate text-sm text-neutral-500">{{
          formatDate(props.article.timestamp, 'MMMM dd, yyyy')
        }}</span>
      </div>
    </div>
  </router-link>
</template>
