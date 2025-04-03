<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import ArticleCard from '../components/ArticleCard.vue'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import type { Article } from '@/types'
import NavigationBar from '@/components/NavigationBar.vue'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

const articles = ref<Article[]>([])
const getLayout = (index: number) => {
  const layoutOrder = [
    'vertical',
    'horizontal',
    'horizontal',
    'vertical',
    'vertical',
    'horizontal',
    'horizontal',
    'vertical',
  ]
  return layoutOrder[index % layoutOrder.length] as 'vertical' | 'horizontal'
}
const getClass = (index: number) => {
  const classes = [
    'col-span-1',
    'lg:col-span-2',
    'lg:col-span-2',
    'col-span-1',
    'col-span-1',
    'lg:col-span-2',
    'lg:col-span-2',
    'col-span-1',
  ]
  return classes[index % classes.length]
}

const unsubscribe = onSnapshot(collection(db, 'articles'), (snapshot) => {
  articles.value = snapshot.docs
    .map((doc) => {
      const data = doc.data()
      // Convert Firebase Timestamp to JavaScript Date
      if (data.timestamp && data.timestamp.toDate) {
        data.timestamp = data.timestamp.toDate()
      }
      return { id: doc.id, ...data } as Article
    })
    .sort((a, b) => {
      // Sort by timestamp descending (recent to oldest)
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
})
</script>

<template>
  <div class="mx-auto p-5 py-10 xl:py-20 2xl:max-w-7xl">
    <NavigationBar :showDate="true" />
    <SearchBar />
    <h3 class="mb-10 font-serif text-2xl font-bold">Top stories</h3>
    <div
      class="grid flex-1 grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3"
      v-if="articles.length"
    >
      <ArticleCard
        v-for="(article, index) in articles"
        :key="article.title"
        :article="article"
        :layout="getLayout(index)"
        :class="getClass(index)"
      />
    </div>

    <div v-else class="flex h-96 w-full items-center justify-center">
      <ProgressIndicator size="md" />
    </div>
  </div>
</template>
