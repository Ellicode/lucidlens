<script setup lang="ts">
import { formatDate } from 'date-fns'
import { ref, onMounted } from 'vue'
import type { Article } from '@/types'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useRoute } from 'vue-router'
import { ExclamationTriangleIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { convertMarkdownToHtml } from '@/utils'

const article = ref<Article | null | boolean>(false)
const isLoaded = ref(false)
const route = useRoute()

onMounted(async () => {
  // Fetch article data here
  const articleQuerySnapshot = await getDoc(doc(db, 'articles', route.params.id as string))
  const data = articleQuerySnapshot.data()
  if (data) {
    // Convert Firebase Timestamp to JavaScript Date
    if (data.timestamp && data.timestamp.toDate) {
      data.timestamp = data.timestamp.toDate()
    }
    article.value = { id: articleQuerySnapshot.id, ...data } as Article
  } else {
    article.value = null
  }
})
</script>

<template>
  <div class="mx-auto p-5 py-10 xl:py-20 2xl:max-w-7xl">
    <NavigationBar />

    <template v-if="typeof article === 'object' && article !== null">
      <img
        loading="lazy"
        :src="article.image"
        alt="Article Image"
        @load="isLoaded = true"
        :class="[isLoaded ? '' : 'animate-pulse']"
        v-if="article.image"
        class="h-80 w-full shrink-0 bg-neutral-300 object-cover brightness-90"
      />
      <div v-else class="flex h-80 w-full items-center justify-center bg-neutral-200">
        <PhotoIcon class="h-16 w-16 text-neutral-800" />
      </div>
      <h1 class="my-20 mb-10 font-serif text-5xl">{{ article.title }}</h1>
      <p class="mb-6 text-xl text-neutral-500 italic">{{ article.description }}</p>
      <p class="mb-6 text-neutral-400">
        Posted by {{ article.author ?? 'Unknown' }} &bull;
        {{ formatDate(article.timestamp, 'MMMM dd, yyyy') }}
      </p>
      <div class="text-lg" v-html="convertMarkdownToHtml(article.content!)"></div>
    </template>
    <div
      v-else-if="article == null"
      class="flex h-96 w-full flex-col items-center justify-center gap-5"
    >
      <ExclamationTriangleIcon class="h-10 w-10 text-neutral-500" />
      <h1 class="font-serif text-3xl">Article not found</h1>
      <p class="text-neutral-500">The article you are looking for does not exist.</p>
      <router-link to="/" class="text-primary-500">Go back to home</router-link>
    </div>
    <div v-else class="flex h-96 w-full items-center justify-center">
      <ProgressIndicator size="lg" />
    </div>
  </div>
</template>
