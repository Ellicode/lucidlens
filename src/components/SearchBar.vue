<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import suggestions from '@/data/suggestions'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid'
import { ArrowUpIcon } from '@heroicons/vue/20/solid'
import { type Article, type Suggestion } from '@/types'
import ProgressIndicator from './ProgressIndicator.vue'
import {
  ExclamationTriangleIcon,
  GlobeAmericasIcon,
  PencilIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline'
// @ts-expect-error import Could not find a declaration file for module
import { SearchAgent } from '@/agents/searchAgent'
// @ts-expect-error import Could not find a declaration file for module
import { WriterAgent } from '@/agents/writerAgent'
// @ts-expect-error import Could not find a declaration file for module
import { AgentChain } from '@/agentChain'
import { ChatGroq } from '@langchain/groq'
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { convertMarkdownToHtml } from '@/utils'
import SignInModal from './SignInModal.vue'
import { createApi } from 'unsplash-js'
const unsplash = createApi({
  accessKey: '8iwxWBrhPjhDNTWsofAERHQWpCK5_0-IwWkuQJbpITQ',
  fetch: fetch,
})

const searchSuggestions = ref<Suggestion[]>([])
const showSuggestions = ref(false)
const loading = ref('idle')
const generatedArticle = ref<Article | null>(null)

const filteredSuggestions = computed(() => {
  return searchSuggestions.value.filter(
    (suggestion) =>
      suggestion.query.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      suggestion.prompt.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})
const searchQuery = ref('')
const noUserModal = ref(false)

onMounted(() => {
  searchSuggestions.value = suggestions
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      loading.value = 'idle'
    }
  })
})

const addArticle = async () => {
  if (auth.currentUser === null) {
    noUserModal.value = true
    return
  }
  const doc = await addDoc(collection(db, 'articles'), generatedArticle.value)
  generatedArticle.value!.id = doc.id
}

const askAI = async () => {
  if (auth.currentUser === null) {
    noUserModal.value = true
    return
  }
  loading.value = 'searching'
  const model = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
  })
  const agents = {
    search: await new SearchAgent(model, import.meta.env.VITE_BRAVE_API_KEY).init(),
    writer: await new WriterAgent(model).init(),
  }
  const chain = new AgentChain(agents).buildChain(() => {
    loading.value = 'composing'
  })
  try {
    const response = await chain.invoke({
      input: searchQuery.value,
      agent_scratchpad: '',
    })
    console.log(response)
    const titleMatch = response.output.match(/# (.*?)(\n|$)/)
    let title = titleMatch ? titleMatch[1] : searchQuery.value
    title = title.charAt(0).toUpperCase() + title.slice(1)

    let content = response.output
    if (titleMatch) {
      content = content.replace(titleMatch[0], '')
    }
    content = content.replace('(#title)', '')
    const image = await unsplash.search.getPhotos({
      query: title,
      orientation: 'landscape',
      perPage: 1,
    })
    generatedArticle.value = {
      author: auth.currentUser?.displayName || 'Anonymous',
      timestamp: new Date(),
      content: content,
      image: image.response ? image.response.results[0].urls.full : '',
      description: content.replace(/^# .*\n/, '').slice(0, 100),
      tags: ['ai', 'generated'],
      title: title,
    } as Article
    console.log(generatedArticle.value)

    loading.value = 'complete'
  } catch (error) {
    console.error(error)
  }

  loading.value = 'complete'
}
</script>
<template>
  <div class="mb-5">
    <div
      class="flex h-16 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50"
    >
      <MagnifyingGlassIcon class="ms-3 h-6 w-6 text-neutral-500" />

      <input
        type="text"
        v-model="searchQuery"
        class="h-full flex-1 px-3 outline-0"
        @focus="showSuggestions = true"
        @blur="showSuggestions = false"
        @keydown.enter="askAI"
        placeholder="Ask or search any topic"
      />

      <button
        @click="askAI"
        :class="
          loading !== 'idle' && loading !== 'complete'
            ? 'animate-pulse bg-neutral-400'
            : 'bg-primary-500'
        "
        :disabled="loading !== 'idle' && loading !== 'complete'"
        class="me-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white transition duration-300 not-[:disabled]:hover:scale-105 not-[:disabled]:active:scale-95"
      >
        <ArrowUpIcon v-if="loading === 'idle' || loading === 'complete'" class="h-6 w-6" />
        <ProgressIndicator size="xs" v-else class="h-6 w-6 text-white" />
      </button>
    </div>

    <div
      :class="showSuggestions ? '-translate-y-0 opacity-100' : '-translate-y-5 opacity-0'"
      class="mt-4 flex h-10 w-full gap-2 overflow-scroll transition"
    >
      <button
        v-for="suggestion in filteredSuggestions.slice(0, 5)"
        :key="suggestion.query"
        @click="((searchQuery = suggestion.prompt), (showSuggestions = false))"
        class="flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2"
      >
        <Component :class="suggestion.color" class="me-2 h-4 w-4" :is="suggestion.icon"></Component>

        <span class="flex-1 truncate text-sm font-medium">{{ suggestion.query }}</span>
      </button>
    </div>
  </div>
  <SignInModal v-model="noUserModal" />
  <div
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
    v-if="loading !== 'idle'"
  >
    <div
      class="max-h-9/10 min-h-96 w-full max-w-4xl overflow-auto rounded-md bg-white p-7 shadow-lg"
    >
      <div class="relative" v-if="loading === 'complete'">
        <template v-if="generatedArticle">
          <div
            class="mb-5 flex h-52 w-full items-center justify-center bg-neutral-200"
            v-if="!generatedArticle.image"
          >
            <PhotoIcon class="h-16 w-16 text-neutral-800" />
          </div>
          <img
            v-else
            :src="generatedArticle.image"
            alt="Placeholder image"
            class="mb-5 h-52 w-full object-cover"
          />
          <h1 class="mb-5 font-serif text-3xl">{{ generatedArticle?.title }}</h1>
          <p class="mb-5 text-neutral-500 italic">{{ generatedArticle?.description }}</p>
          <p class="mb-5">
            <a
              v-for="tag in generatedArticle?.tags"
              :key="tag"
              class="group mr-1 cursor-pointer text-sm whitespace-nowrap lowercase"
            >
              <span class="group-hover:text-blue-500 group-hover:underline">#{{ tag }}</span> &bull;
            </a>
            By <span class="font-semibold">{{ generatedArticle?.author }}</span>
          </p>
          <div v-html="convertMarkdownToHtml(generatedArticle?.content || '')"></div>
          <div class="sticky right-0 bottom-0 ms-auto flex justify-end">
            <button
              @click="addArticle"
              v-if="!generatedArticle.id"
              class="bg-primary-500 text-primary-50 hover:bg-primary-600 active:border-primary-400 flex cursor-pointer items-center justify-center rounded-md border border-transparent p-2 text-sm font-medium duration-100"
            >
              Publish article
            </button>
            <router-link
              v-if="generatedArticle && generatedArticle.id"
              :to="{ name: 'detail', params: { id: generatedArticle.id } }"
              class="bg-primary-100 text-primary-700 hover:bg-primary-200 active:border-primary-400 ms-2 flex cursor-pointer items-center justify-center rounded-md border border-transparent p-2 text-sm duration-100"
            >
              View full article
            </router-link>
          </div>
        </template>
        <div class="flex w-full flex-col items-center justify-center gap-5 py-10" v-else>
          <ExclamationTriangleIcon class="h-10 w-10 text-neutral-500" />
          <h1 class="font-serif text-3xl">Generation error</h1>
          <p class="text-neutral-500">
            It seems that the AI has ran into some issues while generating your post. Retry it?
          </p>
          <button @click="askAI" class="text-primary-500 cursor-pointer">Retry</button>
        </div>
      </div>
      <template v-else>
        <div class="h-5 w-9/10 animate-pulse bg-neutral-50"></div>
        <div class="mt-2 h-5 w-8/10 animate-pulse bg-neutral-50"></div>
        <div class="mt-2 h-5 w-7/10 animate-pulse bg-neutral-50 delay-[50ms]"></div>
        <div class="mt-2 h-5 w-5/10 animate-pulse bg-neutral-50 delay-100"></div>
        <div class="mt-2 h-5 w-6/10 animate-pulse bg-neutral-50 delay-150"></div>
        <div class="mt-2 h-5 w-4/10 animate-pulse bg-neutral-50 delay-200"></div>
        <div class="mt-2 h-5 w-9/10 animate-pulse bg-neutral-50 delay-[250ms]"></div>
        <div class="mt-2 h-5 w-8/10 animate-pulse bg-neutral-50 delay-300"></div>
        <div class="mt-2 h-5 w-7/10 animate-pulse bg-neutral-50 delay-[350ms]"></div>
        <div class="mt-2 h-5 w-5/10 animate-pulse bg-neutral-50 delay-[400ms]"></div>
        <div class="mt-2 h-5 w-6/10 animate-pulse bg-neutral-50 delay-[450ms]"></div>
      </template>
      <transition mode="out-in" name="fadeAndScale">
        <div
          v-if="loading == 'searching'"
          class="absolute inset-0 flex flex-col items-center justify-center"
        >
          <GlobeAmericasIcon class="h-16 w-16 text-neutral-800" />
          <p class="mt-5 font-serif text-xl text-neutral-800">Searching the web...</p>
        </div>
        <div
          v-else-if="loading == 'composing'"
          class="absolute inset-0 flex flex-col items-center justify-center"
        >
          <PencilIcon class="h-16 w-16 text-neutral-800" />
          <p class="mt-5 font-serif text-xl text-neutral-800">Composing article...</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fadeAndScale-enter-active,
.fadeAndScale-leave-active {
  transition: all 0.5s cubic-bezier(0.62, 0.47, 0.14, 1.23);
}
.fadeAndScale-enter-from,
.fadeAndScale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
