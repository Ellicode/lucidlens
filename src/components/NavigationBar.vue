<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth, db } from '@/firebase'
import { UserIcon } from '@heroicons/vue/20/solid'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { formatDate } from 'date-fns'
import { UserPlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { doc, getDoc } from 'firebase/firestore'
import type { User } from '@/types'
import { SparklesIcon } from '@heroicons/vue/16/solid'
import SignInModal from './SignInModal.vue'

const showAccountModal = ref<boolean>(false)
const isLoggedIn = ref<boolean | null>(null)
const userData = ref<User | null>(null)

const props = withDefaults(
  defineProps<{
    showDate?: boolean
  }>(),
  {
    showDate: false,
  },
)

const currentDate = ref('')
const signInModal = ref(false)
const showbottomPopup = ref<boolean | null>(null)

onMounted(() => {
  currentDate.value = formatDate(new Date(), 'MMMM dd, yyyy')
  auth.onAuthStateChanged(async (user) => {
    isLoggedIn.value = !!user
    showbottomPopup.value = !isLoggedIn.value
    console.log(user)
    if (!!user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      userData.value = userDoc.data() as User
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      showAccountModal.value = false
    }
  })
})
</script>

<template>
  <header class="mb-10 flex items-start pb-5">
    <div>
      <router-link :to="{ name: 'home' }" class="font-serif text-4xl font-bold"
        >LucidLens</router-link
      >
      <h2 class="text-xl font-medium text-neutral-500" v-if="props.showDate">
        {{ currentDate }}
      </h2>
    </div>
    <div class="ms-auto flex items-center gap-5" v-if="isLoggedIn">
      <button
        @click="showAccountModal = !showAccountModal"
        class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
      >
        <UserIcon class="h-6 w-6 text-neutral-900" />
      </button>

      <button
        class="bg-primary-100 text-primary-700 hover:bg-primary-200 active:border-primary-400 ms-auto flex cursor-pointer items-center rounded-md border border-transparent p-2 text-sm duration-100"
        @click="auth.signOut()"
      >
        Sign Out
      </button>
    </div>
    <ProgressIndicator class="ms-auto" v-else-if="isLoggedIn === null" size="md" />
    <template v-else>
      <button
        class="bg-primary-500 text-primary-100 hover:bg-primary-600 active:border-primary-400 ms-auto flex cursor-pointer items-center rounded-md border border-transparent p-2 text-sm duration-100"
        @click="signInModal = true"
      >
        Sign In
      </button>
    </template>
  </header>

  <div
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
    v-if="showAccountModal"
  >
    <div class="w-full max-w-2xl rounded-md bg-white p-7 shadow-lg">
      <div class="mb-5 flex items-center">
        <h3 class="font-serif text-2xl">Account</h3>
        <button
          @click="showAccountModal = false"
          class="ms-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <XMarkIcon class="h-6 w-6 text-neutral-900" />
        </button>
      </div>

      <div v-if="!userData" class="flex h-80 items-center justify-center">
        <ProgressIndicator size="md" />
      </div>
      <template v-else>
        <div class="flex items-center gap-5">
          <img
            v-if="userData.photoURL"
            :src="userData.photoURL"
            :alt="userData.photoURL"
            class="h-16 w-16 rounded-full object-cover"
          />
          <div class="h-16 w-16 rounded-full bg-neutral-200 object-cover" v-else>
            <UserIcon class="h-10 w-10 text-neutral-500" />
          </div>
          <div class="flex-1">
            <h4 class="font-serif">
              <span>{{ userData.displayName ?? 'Unknown' }}</span>
              <button
                class="float-end flex cursor-pointer items-center gap-3 text-purple-400 hover:text-purple-500 hover:underline"
              >
                <SparklesIcon class="inline-block h-4 w-4" />
                Upgrade to pro plan
              </button>
            </h4>
            <p class="text-neutral-500">{{ userData.email }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
  <SignInModal v-model="signInModal" />
  <transition mode="out-in" name="popup">
    <div
      class="fixed bottom-0 left-1/2 flex h-[450px] w-full max-w-3xl -translate-x-1/2 flex-col rounded-t-4xl border border-neutral-100 p-10 shadow-xl"
      v-if="showbottomPopup == true"
    >
      <UserPlusIcon class="mx-auto h-10 w-10 text-neutral-400" />
      <h1 class="mt-5 mb-10 text-center font-serif text-2xl">
        Create, Share, Save articles and more with a free account
      </h1>
      <p class="text-center text-neutral-500">
        Sign in to LucidLens to create articles with AI, save your favorite articles, and more. If
        you don't have an account, you can create one for free.
      </p>

      <button
        @click="signInModal = true"
        class="bg-primary-500 text-primary-100 hover:bg-primary-600 active:border-primary-400 mt-auto block w-full cursor-pointer rounded-full border border-transparent p-2 text-lg duration-100"
      >
        Sign In
      </button>
      <button
        @click="showbottomPopup = false"
        class="text-primary-500 hover:text-primary-600 mt-5 block w-full cursor-pointer rounded-full border border-transparent text-lg duration-100"
      >
        I want to browse anonymously
      </button>
    </div>
  </transition>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: all 0.5s ease-in-out;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(50%);
}
</style>
