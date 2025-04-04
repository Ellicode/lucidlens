<script setup lang="ts">
import { auth, db } from '@/firebase'
import type { Comment, User } from '@/types'
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { onMounted, ref, watch, h, type VNode } from 'vue'
import UserFlair from './UserFlair.vue'
import { convertMarkdownToHtml } from '@/utils'
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/16/solid'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import ProgressIndicator from './ProgressIndicator.vue'
import MarkdownEditor from './MarkdownEditor.vue'

const props = defineProps<{
  comment?: Comment
}>()
const user = ref<User | null>(null)
const htmlContent = ref<string | null>(null)
const date = ref<string | null>(null)
const deleteModal = ref(false)
const deleteButtonLoading = ref(false)
const newContent = ref<string>('')
const editButtonLoading = ref(false)
const editModal = ref(false)
const mentionVNodes = ref<Array<VNode | string>>([])

const deleteComment = async () => {
  if (!props.comment) return
  deleteButtonLoading.value = true
  await deleteDoc(
    doc(db, 'articles', props.comment.parentId as string, 'comments', props.comment.id as string),
  )
  deleteButtonLoading.value = false
}

const editComment = async () => {
  if (!props.comment) return
  editButtonLoading.value = true
  const commentRef = doc(
    db,
    'articles',
    props.comment.parentId as string,
    'comments',
    props.comment.id as string,
  )
  await setDoc(
    commentRef,
    {
      content: newContent.value,
    },
    { merge: true },
  )
  editButtonLoading.value = false
  editModal.value = false
}

async function parseMentions(content: string) {
  mentionVNodes.value = []
  const segments = content.split(/(@\S+)/g)
  for (const seg of segments) {
    if (seg.startsWith('@')) {
      const displayName = seg.substring(1)
      const q = query(collection(db, 'users'), where('displayName', '==', displayName))
      const snapshot = await getDocs(q)
      let userData = null
      snapshot.forEach((doc) => {
        userData = doc.data()
      })
      if (userData) {
        mentionVNodes.value.push(h(UserFlair, { user: userData }))
      } else {
        mentionVNodes.value.push(seg)
      }
    } else {
      mentionVNodes.value.push(seg)
    }
  }
}

watch(
  () => props.comment,
  async (newVal) => {
    if (newVal) {
      newContent.value = newVal.content
      htmlContent.value = convertMarkdownToHtml(newVal.content)
      date.value = newVal.createdAt
        ? newVal.createdAt.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null
      await parseMentions(newVal.content)
    }
  },
)

onMounted(async () => {
  newContent.value = props.comment?.content || ''
  if (props.comment?.author) {
    const userRef = doc(db, 'users', props.comment.author)
    const userData = await getDoc(userRef)
    if (userData.exists()) {
      user.value = userData.data() as User
    } else {
      user.value = {
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
  }

  htmlContent.value = convertMarkdownToHtml(props.comment?.content || '')
  date.value = props.comment?.createdAt
    ? props.comment.createdAt.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      deleteModal.value = false
      editModal.value = false
    }
  })
})
</script>

<template>
  <div
    class="flex w-full items-start gap-5 md:border-l-2 md:border-l-neutral-100 md:pl-10"
    :class="{
      'blur-md': !auth.currentUser,
    }"
  >
    <img
      :src="user?.photoURL || ''"
      :alt="user?.displayName || 'user photo'"
      class="h-12 w-12 shrink-0 rounded-full border border-neutral-200 object-cover"
    />
    <div class="flex-1">
      <div class="mb-5 flex items-center">
        <p class="text-sm text-neutral-500">
          Commented by <UserFlair v-model="user" /> on {{ date }}
        </p>
        <div class="flex-1"></div>
        <button
          v-if="props.comment?.author === auth.currentUser?.uid"
          class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-50 active:bg-neutral-100"
          @click="editModal = true"
        >
          <PencilSquareIcon class="h-4 w-4 text-neutral-500" />
        </button>
        <button
          v-if="props.comment?.author === auth.currentUser?.uid"
          class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100"
          @click="deleteModal = true"
        >
          <TrashIcon class="h-4 w-4 text-red-500" />
        </button>
      </div>
      <div v-if="mentionVNodes.length">
        <component v-for="(node, idx) in mentionVNodes" :key="idx" :is="node" />
      </div>
      <div v-else v-html="htmlContent"></div>
    </div>
  </div>
  <div
    @mousedown.self="deleteModal = false"
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
    v-if="deleteModal"
  >
    <div class="w-full max-w-2xl rounded-md bg-white p-7 shadow-lg">
      <div class="mb-5 flex items-center">
        <h3 class="font-serif text-2xl">Confirm comment deletion</h3>
        <button
          @click="deleteModal = false"
          class="ms-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <XMarkIcon class="h-6 w-6 text-neutral-900" />
        </button>
      </div>
      <p class="mb-5 text-neutral-500">
        Are you sure you want to delete this comment? This action cannot be undone.
      </p>

      <button
        @click="deleteComment()"
        :disabled="deleteButtonLoading"
        class="float-end cursor-pointer rounded-md border border-transparent bg-red-500 p-2 px-3 text-sm text-red-50 duration-100 disabled:opacity-75 disabled:grayscale-100"
      >
        <template v-if="deleteButtonLoading">
          <ProgressIndicator size="xs" class="text-white" />
        </template>
        <template v-else>Delete comment</template>
      </button>
    </div>
  </div>
  <div
    @mousedown.self="editModal = false"
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
    v-if="editModal"
  >
    <div class="w-full max-w-2xl rounded-md bg-white p-7 shadow-lg">
      <div class="mb-5 flex items-center">
        <h3 class="font-serif text-2xl">Edit comment</h3>
        <button
          @click="editModal = false"
          class="ms-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <XMarkIcon class="h-6 w-6 text-neutral-900" />
        </button>
      </div>
      <MarkdownEditor v-model="newContent" />
      <button
        @click="editComment()"
        :disabled="editButtonLoading"
        class="bg-primary-500 text-primary-50 float-end cursor-pointer rounded-md border border-transparent p-2 px-3 text-sm duration-100 disabled:opacity-75 disabled:grayscale-100"
      >
        <template v-if="editButtonLoading">
          <ProgressIndicator size="xs" class="text-white" />
        </template>
        <template v-else>Update</template>
      </button>
    </div>
  </div>
</template>
