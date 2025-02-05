<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth, db, googleProvider } from '@/firebase'
import { ChevronRightIcon, UserIcon, UserMinusIcon } from '@heroicons/vue/20/solid'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { formatDate } from 'date-fns'
import { UserPlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { deleteDoc, doc, getDoc } from 'firebase/firestore'
import type { User } from '@/types'
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/vue/16/solid'
import SignInModal from './SignInModal.vue'
import { reauthenticateWithPopup } from 'firebase/auth'

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
const accountPage = ref<'home' | 'delete'>('home')
const deleteButtonLoading = ref(false)

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

const deleteAccount = async () => {
  deleteButtonLoading.value = true
  await reauthenticateWithPopup(auth.currentUser!, googleProvider)
  await deleteDoc(doc(db, 'users', auth.currentUser?.uid!))
  await auth.currentUser?.delete()
  auth.signOut()
  deleteButtonLoading.value = false
  showAccountModal.value = false
}
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
    <div class="max-h-9/10 w-full max-w-2xl overflow-auto rounded-md bg-white p-7 shadow-lg">
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
      <template v-else-if="accountPage == 'home'">
        <div class="mb-5 flex items-center gap-5">
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
                v-if="userData.subscription === 'free'"
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
        <button
          @click="accountPage = 'delete'"
          class="flex w-full cursor-pointer items-center gap-5 rounded-md border border-neutral-100 bg-neutral-50 p-3"
        >
          <UserMinusIcon class="h-5 w-5 text-red-600" />
          <span class="font-serif font-medium text-red-600">Delete account</span>
          <ChevronRightIcon class="ms-auto h-5 w-5 text-neutral-500" />
        </button>
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
          class="float-end cursor-pointer rounded-md border border-transparent bg-red-500 p-2 text-sm text-red-50 duration-100 hover:bg-red-600 active:border-red-400 disabled:bg-neutral-300 disabled:hover:bg-neutral-300 disabled:active:border-neutral-300"
        >
          <template v-if="deleteButtonLoading">
            <ProgressIndicator size="xs" class="text-white" />
          </template>
          <template v-else>Delete account</template>
        </button>
      </template>
    </div>
  </div>
  <SignInModal v-model="signInModal" />
  <transition mode="out-in" name="popup">
    <div
      class="fixed bottom-0 left-1/2 z-10 flex h-[450px] w-full max-w-3xl -translate-x-1/2 flex-col rounded-t-4xl border border-neutral-100 bg-white p-10 shadow-xl"
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
