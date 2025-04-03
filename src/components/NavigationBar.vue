<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserIcon } from '@heroicons/vue/20/solid'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { formatDate } from 'date-fns'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import SignInModal from './SignInModal.vue'
import AccountModalView from './AccountModalView.vue'
import { auth } from '@/firebase'

const showAccountModal = ref<boolean>(false)
const isLoggedIn = ref<boolean | null>(null)

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
    @mousedown.self="showAccountModal = false"
    v-if="showAccountModal"
  >
    <AccountModalView v-model="showAccountModal" />
  </div>
  <SignInModal v-model="signInModal" />
  <transition mode="out-in" name="popup">
    <div
      class="fixed right-5 bottom-5 z-10 flex h-[200px] w-full max-w-3xl flex-col rounded-xl border border-neutral-100 bg-white p-5 shadow-xl"
      v-if="showbottomPopup == true"
    >
      <div class="mb-5 flex items-center justify-between">
        <h1 class="font-serif text-2xl">
          Create, Share, Save articles and more with a free account
        </h1>
        <button
          @click="showbottomPopup = false"
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <XMarkIcon class="h-6 w-6 text-neutral-900" />
        </button>
      </div>

      <p class="text-neutral-500">
        Sign in to LucidLens to create articles with AI, save your favorite articles, and more. If
        you don't have an account, you can create one for free.
      </p>

      <div class="gap5 mt-auto flex items-center justify-end gap-10">
        <button
          @click="showbottomPopup = false"
          class="text-primary-500 hover:text-primary-600 block cursor-pointer rounded-full border border-transparent duration-100"
        >
          Continue as a guest
        </button>
        <button
          @click="signInModal = true"
          class="bg-primary-500 text-primary-100 hover:bg-primary-600 active:border-primary-400 mt-auto block cursor-pointer rounded-full border border-transparent p-2 px-4 duration-100"
        >
          Sign In
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(50%);
}
</style>
