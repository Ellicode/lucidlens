<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import suggestions from '@/data/suggestions'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid'
import { ArrowUpIcon } from '@heroicons/vue/20/solid'
import { type Article, type Suggestion } from '@/types'
import ProgressIndicator from './ProgressIndicator.vue'
import {
  ExclamationTriangleIcon,
  FaceFrownIcon,
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
import { GlobeAltIcon } from '@heroicons/vue/16/solid'
const unsplash = createApi({
  accessKey: '8iwxWBrhPjhDNTWsofAERHQWpCK5_0-IwWkuQJbpITQ',
  fetch: fetch,
})

const searchSuggestions = ref<Suggestion[]>([])
const showSuggestions = ref(false)
const loading = ref('idle')
const generatedArticle = ref<Article | null | 'no-data'>(null)
const showPlaceholder = ref(true)
const placeholders = [
  'What is the meaning of life?',
  'How to learn Vue.js?',
  'Best practices for web development',
  'How to cook pasta?',
  'What is the future of AI?',
  'How to stay healthy?',
  'Tips for effective communication',
  'How to manage time effectively?',
  'What are the benefits of meditation?',
  'How to improve productivity?',
  'What is the best way to learn a new language?',
]
const currentPlaceholder = ref('')
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
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    // Check if the click is outside the search bar container
    if (searchBar_container.value && !searchBar_container.value.contains(target)) {
      showPlaceholder.value = true
    }
  })
  currentPlaceholder.value = placeholders[Math.floor(Math.random() * placeholders.length)]
  setInterval(() => {
    if (searchQuery.value === '') {
      currentPlaceholder.value = placeholders[Math.floor(Math.random() * placeholders.length)]
    }
  }, 5000)
})

const addArticle = async () => {
  if (generatedArticle.value === null || generatedArticle.value === 'no-data') return
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

    if (response.output === '(#no-data)') {
      generatedArticle.value = 'no-data'
      loading.value = 'complete'
      return
    }
    const titleMatch = response.output.match(/# (.*?)(\n|$)/)
    let title = titleMatch ? titleMatch[1] : searchQuery.value
    title = title.charAt(0).toUpperCase() + title.slice(1)

    let content = response.output
    if (titleMatch) {
      content = content.replace(titleMatch[0], '')
    }
    content = content.replace('(#title)', '')

    // Extract description from blockquote format
    const descriptionMatch = content.match(/>>>\s*(.*?)(\n|$)/)
    const description = descriptionMatch ? descriptionMatch[1] : content.slice(0, 100)

    // Remove description blockquote from content if found
    if (descriptionMatch) {
      content = content.replace(descriptionMatch[0], '')
    }

    // Extract sources from the content
    const sourcesRegex = /- \[(.*?)\]\((https?:\/\/[^\s)]+)\)/g
    let sourceMatch
    const sources = []
    while ((sourceMatch = sourcesRegex.exec(content)) !== null) {
      sources.push({
        title: sourceMatch[1],
        url: sourceMatch[2],
      })
    }

    // Remove sources section from the content
    content = content.replace(/## Sources\s*[\s\S]*$/, '').trim()
    // Also remove any other format of source lists
    content = content.replace(/- \[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '').trim()

    const image = await unsplash.search.getPhotos({
      query: title,
      orientation: 'landscape',
      perPage: 1,
    })
    generatedArticle.value = {
      author: auth.currentUser.uid,
      timestamp: new Date(),
      content: content,
      image: image.response ? image.response.results[0].urls.full : '',
      description: description,
      title: title,
      sources: sources,
    } as Article
    console.log(generatedArticle.value)

    loading.value = 'complete'
  } catch (error) {
    console.error(error)
  }

  loading.value = 'complete'
}

const searchBar_container = ref<HTMLElement | null>(null)
const searchBar = ref<HTMLElement | null>(null)

const placeholderOnClick = async () => {
  showPlaceholder.value = false
  await nextTick()
  searchBar.value?.focus()
}
</script>
<template>
  <div class="mb-5">
    <div
      class="flex h-16 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50"
    >
      <MagnifyingGlassIcon class="ms-3 h-6 w-6 text-neutral-500" />

      <div
        v-if="showPlaceholder && searchQuery === ''"
        @click="placeholderOnClick"
        ref="searchBar_container"
        class="flex-1 px-3"
      >
        <transition mode="out-in" name="placeholder">
          <!-- To add a nice effect, breaks the transition. -->
          <!-- animate-gradient bg-gradient-to-r from-neutral-400 via-neutral-600 to-neutral-400 bg-clip-text text-transparent -->
          <span :key="currentPlaceholder" class="pe-2 font-serif text-lg text-neutral-500 italic">
            {{ currentPlaceholder }}
          </span>
        </transition>
      </div>
      <input
        v-else
        type="text"
        v-model="searchQuery"
        ref="searchBar"
        class="h-full flex-1 px-3 outline-0"
        @focus="showSuggestions = true"
        @blur="((showSuggestions = false), (showPlaceholder = true))"
        @keydown.enter="askAI"
      />
      <button
        @click="askAI"
        :class="
          loading !== 'idle' && loading !== 'complete'
            ? 'animate-pulse bg-neutral-400'
            : 'bg-primary-500'
        "
        :disabled="loading !== 'idle' && loading !== 'complete'"
        class="me-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded text-white transition duration-300 not-[:disabled]:hover:scale-105 not-[:disabled]:active:scale-95"
      >
        <ArrowUpIcon v-if="loading === 'idle' || loading === 'complete'" class="h-6 w-6" />
        <ProgressIndicator size="xs" v-else class="h-6 w-6 text-white" />
      </button>
    </div>

    <div
      :class="showSuggestions ? '-translate-y-0 opacity-100' : '-translate-y-5 opacity-0'"
      class="hide-scrollbar mt-4 flex h-8 w-full gap-2 overflow-scroll transition"
    >
      <button
        v-for="suggestion in filteredSuggestions.slice(0, 5)"
        :key="suggestion.query"
        @click="((searchQuery = suggestion.prompt), (showSuggestions = false))"
        class="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-3"
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
        <div
          class="flex w-full flex-col items-center justify-center gap-5 py-10"
          v-if="generatedArticle == 'no-data'"
        >
          <FaceFrownIcon class="h-10 w-10 text-neutral-500" />
          <h1 class="font-serif text-3xl">Can't generate your article</h1>
          <p class="text-neutral-500">
            LucidAI couldn't find valuable information on the web about your query. Please try again
            with a different query.
          </p>
          <button @click="loading = 'idle'" class="text-primary-500 cursor-pointer">Back</button>
        </div>
        <div
          class="flex w-full flex-col items-center justify-center gap-5 py-10"
          v-else-if="generatedArticle == null"
        >
          <ExclamationTriangleIcon class="h-10 w-10 text-neutral-500" />
          <h1 class="font-serif text-3xl">Generation error</h1>
          <p class="text-neutral-500">
            It seems that LucidAI has ran into some issues while generating your post. Retry it?
          </p>
          <button @click="askAI" class="text-primary-500 cursor-pointer">Retry</button>
        </div>
        <template v-else>
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
            By <span class="font-semibold">{{ generatedArticle?.author }}</span>
          </p>
          <div v-html="convertMarkdownToHtml(generatedArticle?.content || '')"></div>
          <div class="mt-5 flex w-full flex-col items-center justify-center gap-5">
            <h2 class="font-serif text-lg">* * *</h2>
            <ul class="w-full gap-2 space-y-2 space-x-2">
              <span
                v-for="source in generatedArticle?.sources"
                :key="source.url"
                class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2"
              >
                <GlobeAltIcon class="h-4 w-4 text-neutral-500" />
                <a :href="source.url" target="_blank" class="text-sm font-medium text-neutral-800">
                  {{ source.title }}
                </a>
              </span>
            </ul>
          </div>
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

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.placeholder-enter-active,
.placeholder-leave-active {
  transition: all 0.2s;
  display: inline-block;
}

.placeholder-enter-from {
  transform: translateY(100%);
}
.placeholder-enter-from,
.placeholder-leave-to {
  opacity: 0;
}
.placeholder-enter-to,
.placeholder-leave-from {
  transform: translateY(0);
}

.placeholder-leave-to {
  transform: translateY(-100%);
}

.animate-gradient {
  background-size: 200% auto;
  animation: gradient 3s linear infinite;
}

@keyframes gradient {
  0% {
    background-position: 200% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
