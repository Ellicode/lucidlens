<script setup lang="ts">
import { reauthenticateWithPopup, updateProfile } from 'firebase/auth'
import { auth, db, googleProvider } from '@/firebase'
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserMinusIcon,
  WalletIcon,
} from '@heroicons/vue/20/solid'
import { onMounted, ref } from 'vue'
import type { User } from '@/types'
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { UserIcon } from '@heroicons/vue/24/solid'
import { CheckIcon, SparklesIcon } from '@heroicons/vue/16/solid'
import ProModalView from './ProModalView.vue'

const accountPage = ref<'home' | 'delete' | 'pro' | 'subscription' | 'reading'>('home')
const deleteButtonLoading = ref(false)
const userData = ref<User | null>(null)
const model = defineModel()

const displayName = ref('')
const biography = ref('')
const interests = ref<string[]>([])
const fontSize = ref(1.2)
const font = ref<'sans-serif' | 'serif' | 'dyslexic'>('sans-serif')

const saved = ref(false)
const saving = ref(false)

const user = auth.currentUser
const unsubscribe = onSnapshot(doc(db, 'users', user?.uid!), (doc) => {
  userData.value = doc.data() as User
  userData.value.id = doc.id
  if (userData.value) {
    displayName.value = userData.value.displayName ?? ''
    biography.value = userData.value.biography ?? ''
    fontSize.value = userData.value.fontSize ?? 1.2
    font.value = userData.value.font ?? 'sans-serif'
    interests.value = userData.value.interests ?? ''
  }
})

const deleteAccount = async () => {
  deleteButtonLoading.value = true
  await reauthenticateWithPopup(auth.currentUser!, googleProvider)
  await deleteDoc(doc(db, 'users', auth.currentUser?.uid!))
  await auth.currentUser?.delete()
  auth.signOut()
  deleteButtonLoading.value = false
  model.value = false
}

const saveChanges = async () => {
  saving.value = true
  if (userData.value) {
    await setDoc(
      doc(db, 'users', userData.value.id),
      {
        displayName: displayName.value,
        biography: biography.value,
        interests: interests.value,
        fontSize: fontSize.value,
        font: font.value,
      },
      { merge: true },
    )
    await updateProfile(auth.currentUser!, {
      displayName: displayName.value,
      photoURL: userData.value.photoURL,
    })
    saving.value = false
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 2000)
  }
}

const interestsList = [
  'Technology',
  'Health',
  'Lifestyle',
  'Travel',
  'Food',
  'Fashion',
  'Sports',
  'Finance',
  'Education',
  'Entertainment',
  'Business',
  'Science',
  'Art',
  'Music',
  'Photography',
  'Gaming',
  'Politics',
  'History',
  'Nature',
]
</script>

<template>
  <div class="max-h-9/10 w-full max-w-2xl overflow-auto rounded-md bg-white p-7 shadow-lg">
    <div class="mb-5 flex items-center">
      <h3 class="font-serif text-2xl">Account</h3>
      <button
        @click="model = false"
        class="ms-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
      >
        <XMarkIcon class="h-6 w-6 text-neutral-900" />
      </button>
    </div>

    <div v-if="!userData" class="flex h-80 items-center justify-center">
      <ProgressIndicator size="md" />
    </div>
    <template v-else-if="accountPage == 'home'">
      <div class="mb-5 flex items-center gap-5">
        <img
          :src="userData.photoURL"
          :alt="userData.displayName"
          v-if="userData.photoURL"
          class="h-16 w-16 rounded-full border border-gray-200 object-cover"
        />
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 object-cover"
          v-else
        >
          <UserIcon class="h-10 w-10 text-neutral-500" />
        </div>
        <div class="flex-1">
          <h4 class="font-serif">
            <span>{{ userData.displayName ?? 'Unknown' }}</span>
            <button
              v-if="userData.subscription === 'free'"
              @click="accountPage = 'pro'"
              class="float-end flex cursor-pointer items-center gap-3 text-purple-400 hover:text-purple-500 hover:underline"
            >
              <SparklesIcon class="inline-block h-4 w-4" />
              Upgrade to pro plan
            </button>
          </h4>
          <p class="text-neutral-500">{{ userData.email }}</p>
        </div>
      </div>
      <h4 class="mt-5 font-serif text-lg">Account settings</h4>
      <p class="mb-7 text-neutral-500">Manage your account settings, subscription, and more.</p>
      <form @submit.prevent="saveChanges">
        <div>
          <h4 class="mb-2 text-sm text-neutral-500">Display name</h4>
          <input
            type="text"
            v-model="displayName"
            class="ring-primary-500 mb-3 w-full rounded-lg border border-neutral-200 p-3 font-serif ring-offset-1 outline-0 focus:ring-2"
          />
        </div>
        <div>
          <h4 class="mb-2 text-sm text-neutral-500">Biography</h4>
          <textarea
            type="text"
            v-model="biography"
            class="ring-primary-500 mb-3 h-30 w-full resize-none rounded-lg border border-neutral-200 p-3 font-serif ring-offset-1 outline-0 focus:ring-2"
          />
        </div>
        <div class="flex justify-end">
          <button
            :disabled="saving"
            type="submit"
            class="bg-primary-500 mb-5 flex w-13 cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm text-white disabled:opacity-75 disabled:grayscale-100"
          >
            <CheckIcon v-if="saved" class="my-0.5 h-4 w-4" />
            <ProgressIndicator v-else-if="saving" size="xs" class="my-0.5 text-white" />
            <span v-else>Save</span>
          </button>
        </div>
      </form>

      <div
        class="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-50"
      >
        <button
          @click="accountPage = 'delete'"
          class="flex w-full cursor-pointer items-center gap-5 p-3"
        >
          <UserMinusIcon class="h-5 w-5 text-red-600" />
          <span class="font-serif font-medium text-red-600">Delete account</span>
          <ChevronRightIcon class="ms-auto h-5 w-5 text-neutral-500" />
        </button>
        <button
          @click="accountPage = 'subscription'"
          class="flex w-full cursor-pointer items-center gap-5 p-3"
        >
          <WalletIcon class="h-5 w-5 text-neutral-700" />
          <span class="font-serif font-medium text-neutral-700">Manage subscription</span>
          <span class="ms-auto text-sm text-neutral-500 capitalize">
            {{ userData.subscription }}
          </span>
          <ChevronRightIcon class="h-5 w-5 text-neutral-500" />
        </button>
        <button
          @click="accountPage = 'reading'"
          class="flex w-full cursor-pointer items-center gap-5 p-3"
        >
          <BookOpenIcon class="h-5 w-5 text-neutral-700" />
          <span class="font-serif font-medium text-neutral-700">Reading preferences</span>
          <ChevronRightIcon class="ms-auto h-5 w-5 text-neutral-500" />
        </button>
      </div>
    </template>
    <template v-else-if="accountPage == 'delete'">
      <button
        @click="accountPage = 'home'"
        class="group hover:text-primary-500 mb-5 flex cursor-pointer items-center gap-3 transition duration-100"
      >
        <ArrowLeftIcon
          class="group-hover:text-primary-200 h-5 w-5 text-neutral-300 transition duration-100"
        />
        <span class="font-serif text-lg">Back</span>
      </button>
      <p class="mb-7 text-neutral-500">
        Are you sure you want to delete your account? This action cannot be undone.
      </p>
      <button
        @click="deleteAccount()"
        :disabled="deleteButtonLoading"
        class="float-end cursor-pointer rounded-md border border-transparent bg-red-500 p-2 px-3 text-sm text-red-50 duration-100 disabled:opacity-75 disabled:grayscale-100"
      >
        <template v-if="deleteButtonLoading">
          <ProgressIndicator size="xs" class="text-white" />
        </template>
        <template v-else>Delete account</template>
      </button>
    </template>
    <template v-else-if="accountPage == 'pro'">
      <button
        @click="accountPage = 'home'"
        class="group hover:text-primary-500 mb-5 flex cursor-pointer items-center gap-3 transition duration-100"
      >
        <ArrowLeftIcon
          class="group-hover:text-primary-200 h-5 w-5 text-neutral-300 transition duration-100"
        />
        <span class="font-serif text-lg">Back</span>
      </button>
      <ProModalView />
    </template>
    <template v-else-if="accountPage == 'reading'">
      <button
        @click="accountPage = 'home'"
        class="group hover:text-primary-500 mb-5 flex cursor-pointer items-center gap-3 transition duration-100"
      >
        <ArrowLeftIcon
          class="group-hover:text-primary-200 h-5 w-5 text-neutral-300 transition duration-100"
        />
        <span class="font-serif text-lg">Back</span>
      </button>
      <div class="mb-5">
        <h4 class="mb-2 text-sm text-neutral-500">Font size (rem)</h4>
        <input
          id="default-range"
          type="range"
          v-model="fontSize"
          min="0.5"
          max="3"
          step="0.1"
          @input="saveChanges"
          class="accent-primary-500 h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div class="mt-3 flex items-center justify-between">
          <span class="text-sm text-neutral-400">0.5</span>
          <span class="text-sm text-neutral-400">1.0</span>
          <span class="text-sm text-neutral-400">1.5</span>
          <span class="text-sm text-neutral-400">2.0</span>
          <span class="text-sm text-neutral-400">2.5</span>
          <span class="text-sm text-neutral-400">3.0</span>
        </div>
      </div>
      <div class="mb-5">
        <h4 class="mb-2 text-sm text-neutral-500">Font</h4>
        <div
          class="ring-primary-500 mb-3 flex w-full items-center rounded-lg border border-neutral-200 font-serif ring-offset-1 outline-0 has-[:focus]:ring-2"
        >
          <select class="flex-1 appearance-none p-3 outline-0" @change="saveChanges" v-model="font">
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="dyslexic">Dyslexic friendly</option>
          </select>
          <ChevronDownIcon class="me-2 h-5 w-5 shrink-0 text-neutral-500" />
        </div>
      </div>
      <h4 class="my-2 text-sm text-neutral-500">Example</h4>
      <p
        :style="{
          fontSize: fontSize + 'rem',
          lineHeight: fontSize * 1.7 + 'rem',
        }"
        :class="{
          'font-serif': font === 'serif',
          'font-sans': font === 'sans-serif',
          'font-dyslexic': font === 'dyslexic',
        }"
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </template>
    <template v-else-if="accountPage == 'subscription'">
      <button
        @click="accountPage = 'home'"
        class="group hover:text-primary-500 mb-5 flex cursor-pointer items-center gap-3 transition duration-100"
      >
        <ArrowLeftIcon
          class="group-hover:text-primary-200 h-5 w-5 text-neutral-300 transition duration-100"
        />
        <span class="font-serif text-lg">Back</span>
      </button>
      <div
        class="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-100"
      >
        <button class="flex w-full items-center gap-5 p-3">
          <span class="font-serif font-medium text-neutral-700">Current plan</span>
          <span class="ms-auto text-sm text-neutral-500 capitalize">
            {{ userData.subscription }}
          </span>
        </button>
      </div>
      <div
        class="mt-5 flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-100"
      >
        <button
          :disabled="userData.subscription == 'free'"
          class="group flex w-full cursor-pointer items-center gap-5 p-3 disabled:cursor-not-allowed"
        >
          <span class="font-serif font-medium text-red-600 group-disabled:text-neutral-400"
            >Cancel subscription</span
          >
          <ChevronRightIcon
            class="ms-auto h-5 w-5 text-neutral-500 group-disabled:text-neutral-400"
          />
        </button>
      </div>
    </template>
  </div>
</template>
