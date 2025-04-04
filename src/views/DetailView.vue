<script setup lang="ts">
import { formatDate } from 'date-fns'
import { ref, onMounted, onUnmounted } from 'vue'
import type { Article, Comment, User } from '@/types'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useRoute } from 'vue-router'
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline'
import { convertMarkdownToHtml } from '@/utils'
import UserFlair from '@/components/UserFlair.vue'
import { InformationCircleIcon } from '@heroicons/vue/16/solid'
import { XMarkIcon } from '@heroicons/vue/24/solid'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import CommentCard from '@/components/CommentCard.vue'

const article = ref<Article | null | boolean>(false)
const isLoaded = ref(false)
const comments = ref<Comment[]>([])
const route = useRoute()
const author = ref<User | null>(null)
const reportModal = ref(false)
const reportDetails = ref('')
const reportReason = ref<'inappropriate' | 'misinformation' | 'sensitive' | 'spam' | 'other'>(
  'inappropriate',
)

const sendReport = () => {}

const opinions = ref<{
  left: number
  neutral: number
  right: number
  gaugeVal: number
  total: number
}>({
  left: 0,
  neutral: 0,
  right: 0,
  gaugeVal: -1,
  total: 0,
})

const unsubscribe = onSnapshot(
  collection(db, 'articles', route.params.id as string, 'opinions'),
  (snapshot) => {
    opinions.value.left = 0
    opinions.value.neutral = 0
    opinions.value.right = 0
    opinions.value.gaugeVal = -1
    opinions.value.total = snapshot.size

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.value === 'left') {
        opinions.value.left++
      } else if (data.value === 'neutral') {
        opinions.value.neutral++
      } else if (data.value === 'right') {
        opinions.value.right++
      }
    })

    // Calculate gauge value between -1 (fully left) and 1 (fully right)
    if (opinions.value.total > 0) {
      // Weight: left = -1, neutral = 0, right = 1
      const weightedSum =
        -1 * opinions.value.left + 0 * opinions.value.neutral + 1 * opinions.value.right
      opinions.value.gaugeVal = weightedSum / opinions.value.total
    } else {
      opinions.value.gaugeVal = 0 // Default to neutral when no opinions
    }
  },
)

const unsubscribeComments = onSnapshot(
  collection(db, 'articles', route.params.id as string, 'comments'),
  (snapshot) => {
    comments.value = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      comments.value.push({
        id: doc.id,
        createdAt: data.timestamp.toDate(),
        parentId: route.params.id as string,
        ...data,
      } as Comment)
    })
  },
)

const userOpinion = ref<'left' | 'neutral' | 'right' | null>(null)

const sendOpinion = async (value: 'left' | 'neutral' | 'right' | null) => {
  const user = auth.currentUser
  if (user) {
    const opinionRef = doc(db, 'articles', route.params.id as string, 'opinions', user.uid)
    if (value) {
      await setDoc(opinionRef, { value })
    } else {
      await deleteDoc(opinionRef)
    }
  }
}

const fontSize = ref(1.2)
const font = ref('')
const comment = ref<string>()
const commentBtnLoading = ref(false)
const sendComment = async () => {
  if (!comment.value) return
  commentBtnLoading.value = true
  await addDoc(collection(db, 'articles', route.params.id as string, 'comments'), {
    author: auth.currentUser?.uid,
    content: comment.value,
    timestamp: new Date(),
  })
  comment.value = ''
  commentBtnLoading.value = false
}

onUnmounted(() => {
  unsubscribe()
})

onMounted(async () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      reportModal.value = false
    }
  })

  // Fetch article data here
  const articleQuerySnapshot = await getDoc(doc(db, 'articles', route.params.id as string))
  const data = articleQuerySnapshot.data()
  if (data) {
    // Convert Firebase Timestamp to JavaScript Date
    if (data.timestamp && data.timestamp.toDate) {
      data.timestamp = data.timestamp.toDate()
    }
    article.value = { id: articleQuerySnapshot.id, ...data } as Article
    // Fetch author data
    const authorQuerySnapshot = await getDoc(doc(db, 'users', article.value.author!))
    if (authorQuerySnapshot.exists()) {
      author.value = authorQuerySnapshot.data() as User
    } else {
      author.value = {
        id: 'XXXX',
        displayName: 'Deleted user',
        email: '',
        photoURL: '',
        subscription: 'free',
        biography: '',
        fontSize: 1.2,
        font: 'sans-serif',
        interests: [],
      }
    }
  } else {
    article.value = null
  }

  const unsubscribeUserOpinion = onSnapshot(
    doc(db, 'articles', route.params.id as string, 'opinions', auth.currentUser?.uid!),
    (doc) => {
      if (doc.exists()) {
        userOpinion.value = doc.data().value
      } else {
        userOpinion.value = null
      }
    },
  )

  const unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser?.uid!), (doc) => {
    if (doc.exists()) {
      const data = doc.data() as User
      fontSize.value = data.fontSize
      font.value = data.font
    } else {
      author.value = null
    }
  })
})
</script>

<template>
  <div class="mx-auto p-5 py-10 xl:py-20 2xl:max-w-7xl">
    <NavigationBar />

    <template v-if="typeof article === 'object' && article !== null">
      <div
        v-if="article.image"
        class="relative h-80 w-full bg-neutral-300"
        :class="[isLoaded ? '' : 'animate-pulse']"
      >
        <img
          decoding="async"
          :src="article.image"
          alt="Article Image"
          @load="isLoaded = true"
          class="h-full w-full shrink-0 object-cover brightness-90"
        />
        <span class="text-shadow absolute right-3 bottom-3 text-xs text-white">
          Images from Unsplash
        </span>
      </div>
      <div v-else class="flex h-80 w-full items-center justify-center bg-neutral-200">
        <PhotoIcon class="h-16 w-16 text-neutral-800" />
      </div>
      <div class="mb-6 flex max-md:flex-col md:items-start">
        <div class="flex-1">
          <h1 class="my-20 mb-10 font-serif text-5xl">{{ article.title }}</h1>
          <p class="mb-6 text-xl text-neutral-500 italic">{{ article.description }}</p>
          <p class="text-neutral-400">
            Posted by
            <UserFlair v-model="author" />
            &bull;
            {{ formatDate(article.timestamp, 'MMMM dd, yyyy') }}
            &bull;
            <button
              @click="reportModal = true"
              class="hover:text-primary-500 inline-flex cursor-pointer items-center gap-1 text-neutral-500"
            >
              Report
            </button>
          </p>
        </div>
        <div class="flex h-96 flex-col justify-center md:ms-20 md:w-75">
          <div
            class="relative h-5 w-full rounded-full bg-gradient-to-r from-blue-500 via-white to-red-500"
          >
            <div
              class="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-6 border-white shadow outline outline-gray-100 transition-all duration-500"
              :style="{
                left: `${Math.max(3, Math.min(97, (opinions.gaugeVal + 1) * 50))}%`,
              }"
            ></div>
          </div>
          <div class="mt-2 mb-5 flex items-center justify-between text-sm text-neutral-400">
            <span>Left</span>
            <span>Neutral</span>
            <span>Right</span>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3">
            <div
              class="h-3 min-w-3 rounded-full bg-blue-500"
              :style="{
                width: `${(opinions.total > 0 ? opinions.left / opinions.total : 0) * 100}%`,
              }"
            ></div>
            <div class="text-xs text-neutral-500">L</div>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3">
            <div
              class="h-3 min-w-3 rounded-full bg-neutral-200"
              :style="{
                width: `${(opinions.total > 0 ? opinions.neutral / opinions.total : 0) * 100}%`,
              }"
            ></div>
            <div class="text-xs text-neutral-500">N</div>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3">
            <div
              class="h-3 min-w-3 rounded-full bg-red-500"
              :style="{
                width: `${(opinions.total > 0 ? opinions.right / opinions.total : 0) * 100}%`,
              }"
            ></div>
            <div class="text-xs text-neutral-500">R</div>
          </div>

          <div class="mt-5 flex items-center gap-2">
            <button
              @click="sendOpinion('left')"
              class="flex-1 cursor-pointer rounded-md py-1.5 font-serif"
              :class="{
                'bg-blue-500 text-white': userOpinion === 'left',
                'bg-blue-100 text-blue-500': userOpinion !== 'left',
              }"
            >
              Left
            </button>
            <button
              @click="sendOpinion('neutral')"
              class="flex-1 cursor-pointer rounded-md py-1.5 font-serif"
              :class="{
                'bg-neutral-900 text-white': userOpinion === 'neutral',
                'bg-neutral-100 text-neutral-500': userOpinion !== 'neutral',
              }"
            >
              Neutral
            </button>
            <button
              @click="sendOpinion('right')"
              class="flex-1 cursor-pointer rounded-md py-1.5 font-serif"
              :class="{
                'bg-red-500 text-white': userOpinion === 'right',
                'bg-red-100 text-red-500': userOpinion !== 'right',
              }"
            >
              Right
            </button>
            <button
              v-if="userOpinion"
              @click="sendOpinion(null)"
              class="cursor-pointer rounded-md bg-neutral-500 px-2 py-2 font-serif"
            >
              <XMarkIcon class="h-5 w-5 text-white" />
            </button>
          </div>
          <div class="mt-5 text-neutral-500">
            <span class="font-medium text-black"> {{ opinions.total }} </span> opinions
          </div>
          <div class="mt-1 text-neutral-500">
            <span class="font-medium text-black"> {{ comments.length }} </span> comments
          </div>
        </div>
      </div>
      <div
        :style="{
          fontSize: fontSize + 'rem',
          lineHeight: fontSize * 1.7 + 'rem',
        }"
        :class="{
          'font-serif': font === 'serif',
          'font-sans': font === 'sans-serif',
          'font-dyslexic': font === 'dyslexic',
        }"
        v-html="convertMarkdownToHtml(article.content!)"
      ></div>
      <p class="mt-10 flex items-center gap-2 text-sm text-neutral-500">
        <InformationCircleIcon class="h-4 w-4 text-neutral-500" />
        Article generated by AI. Results may vary. Please verify the information before sharing.
      </p>
      <h2 class="my-10 font-serif text-3xl">Comments</h2>
      <div class="flex h-60 flex-col items-center justify-center gap-3" v-if="comments.length == 0">
        <ChatBubbleLeftRightIcon class="text-primary-500 h-10 w-10" />
        <h1 class="font-serif text-3xl">No comments</h1>
        <p class="text-neutral-500">
          Be the first to comment on this article. Share your thoughts and opinions!
        </p>
      </div>
      <div class="mb-10 flex flex-col gap-5" v-else>
        <CommentCard v-for="comment in comments" :key="comment.id" :comment="comment" />
      </div>
      <MarkdownEditor v-model="comment" />
      <div class="clear-both">
        <button
          @click="sendComment"
          :disabled="commentBtnLoading"
          class="bg-primary-500 float-end mb-10 flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-white disabled:opacity-75 disabled:grayscale-100"
        >
          <ProgressIndicator
            v-if="commentBtnLoading"
            size="xs"
            class="absolute h-5 w-5 animate-spin text-white"
          />
          <span v-else>Send Comment</span>
        </button>
      </div>
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

    <div
      class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
      @mousedown.self="reportModal = false"
      v-if="reportModal"
    >
      <div class="max-h-9/10 w-full max-w-2xl overflow-auto rounded-md bg-white p-7 shadow-lg">
        <div class="mb-5 flex items-center">
          <h3 class="font-serif text-2xl">Report article</h3>
          <button
            @click="reportModal = false"
            class="ms-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
          >
            <XMarkIcon class="h-6 w-6 text-neutral-900" />
          </button>
        </div>
        <p class="mb-5 text-neutral-500">
          Please provide a reason for reporting this article. Your feedback is important to us.
        </p>
        <form @submit.prevent="sendReport">
          <label class="mb-2 flex items-center gap-3">
            <input
              class="accent-primary-500 h-5 w-5"
              v-model="reportReason"
              type="radio"
              value="inappropriate"
            />
            <span class="ms-2 text-neutral-500">Inappropriate content</span>
          </label>
          <label class="mb-2 flex items-center gap-3">
            <input
              class="accent-primary-500 h-5 w-5"
              v-model="reportReason"
              type="radio"
              value="misinformation"
            />
            <span class="ms-2 text-neutral-500"> Misinformation or false claims </span>
          </label>
          <label class="mb-2 flex items-center gap-3">
            <input
              class="accent-primary-500 h-5 w-5"
              v-model="reportReason"
              type="radio"
              value="spam"
            />
            <span class="ms-2 text-neutral-500">Spam or irrelevant content</span>
          </label>
          <label class="mb-2 flex items-center gap-3">
            <input
              class="accent-primary-500 h-5 w-5"
              v-model="reportReason"
              type="radio"
              value="sensitive"
            />
            <span class="ms-2 text-neutral-500">Sensitive thumbnail</span>
          </label>
          <label class="mb-2 flex items-center gap-3">
            <input
              class="accent-primary-500 h-5 w-5"
              v-model="reportReason"
              type="radio"
              value="other"
            />
            <span class="ms-2 text-neutral-500">Other</span>
          </label>
          <p class="mt-5 mb-2 text-sm text-neutral-500">
            Please provide additional details (optional):
          </p>
          <textarea
            v-model="reportDetails"
            class="ring-primary-500 mb-3 h-32 w-full rounded-lg border border-neutral-200 p-3 font-serif ring-offset-1 outline-0 focus:ring-2"
            placeholder="Enter additional details here..."
          ></textarea>
          <button
            type="submit"
            class="bg-primary-500 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-white"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.text-shadow {
  text-shadow: #000 0px 2px 4px;
}
</style>
