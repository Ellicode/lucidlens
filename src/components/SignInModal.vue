<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/20/solid'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { onMounted, ref } from 'vue'
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, db, googleProvider } from '@/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const model = defineModel()
const error = ref<string | boolean>(false)
const mode = ref<'signIn' | 'signUp'>('signIn')
const email = ref('')
const password = ref('')

const signUpWithGoogle = () => {
  // Sign in with Firebase
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile')
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email')
  signInWithPopup(auth, googleProvider)
    .then(async (result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential ? credential.accessToken : null
      // The signed-in user info.
      const user = result.user
      await setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        subscription: 'free',
      })
      model.value = false
    })
    .catch((err) => {
      error.value = err.message
    })
}

const signInWithGoogle = () => {
  // Sign in with Firebase
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile')
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email')
  signInWithPopup(auth, googleProvider)
    .then(async (result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential ? credential.accessToken : null
      // The signed-in user info.
      const user = result.user
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          subscription: 'free',
        })
      }

      console.log(user)
      model.value = false
    })
    .catch((err) => {
      error.value = err.message
    })
}

const signInWithEmail = (email: string, password: string) => {
  signInWithEmailAndPassword(auth, email, password)
    .catch((err) => {
      error.value = err.message
    })
    .then(async () => {
      // The signed-in user info.
      const user = auth.currentUser
      if (!user) return
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          subscription: 'free',
        })
      }
      model.value = false
    })
}

const signUpWithEmail = (email: string, password: string) => {
  signInWithEmailAndPassword(auth, email, password)
    .then(async (result) => {
      const user = result.user
      await setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        subscription: 'free',
      })
      model.value = false
    })
    .catch((err) => {
      error.value = err.message
    })
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      model.value = false
    }
  })
})
</script>

<template>
  <div
    @mousedown.self="model = false"
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
    v-if="model"
  >
    <div class="w-full max-w-2xl rounded-md bg-white p-7 shadow-lg">
      <div class="mb-5 flex items-center">
        <h3 class="font-serif text-2xl">Sign in to enjoy the full potential of LucidLens.</h3>
        <button
          @click="model = false"
          class="ms-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <XMarkIcon class="h-6 w-6 text-neutral-900" />
        </button>
      </div>
      <p class="mb-5 text-neutral-500">
        Sign in to LucidLens to create articles with AI, save your favorite articles, and more. If
        you don't have an account, you can create one for free.
      </p>
      <div class="mb-10 flex justify-center rounded-xl bg-neutral-200 p-2">
        <button
          @click="mode = 'signIn'"
          :class="{
            'border-neutral-300 bg-white shadow': mode === 'signIn',
            'border-transparent bg-transparent text-neutral-600': mode !== 'signIn',
          }"
          class="flex-1 cursor-pointer rounded-md border px-4 py-1 font-medium transition duration-100"
        >
          Sign In
        </button>
        <button
          @click="mode = 'signUp'"
          :class="{
            'border-neutral-300 bg-white shadow': mode === 'signUp',
            'border-transparent bg-transparent text-neutral-600': mode !== 'signUp',
          }"
          class="flex-1 cursor-pointer rounded-md border px-4 py-1 font-medium transition duration-100"
        >
          Sign Up
        </button>
      </div>
      <div
        v-if="error"
        class="mb-10 flex items-center gap-3 rounded-lg border border-red-200 bg-red-100 p-3"
      >
        <ExclamationCircleIcon class="h-6 w-6 text-red-700" />
        <p class="font-serif text-lg text-red-700">{{ error }}</p>
      </div>
      <input
        type="email"
        v-model="email"
        class="ring-primary-500 mb-3 w-full rounded-lg border border-neutral-200 p-3 font-serif ring-offset-1 outline-0 focus:ring-2"
        placeholder="Email address"
      />
      <input
        type="password"
        v-model="password"
        class="ring-primary-500 mb-3 w-full rounded-lg border border-neutral-200 p-3 font-serif ring-offset-1 outline-0 focus:ring-2"
        placeholder="Password (min. 8 characters)"
        minlength="8"
      />
      <button
        @click="
          mode === 'signIn' ? signInWithEmail(email, password) : signUpWithEmail(email, password)
        "
        class="bg-primary-500 hover:bg-primary-600 text-primary-50 flex w-full cursor-pointer items-center justify-center rounded-lg p-3 font-medium transition duration-100"
      >
        {{ mode === 'signIn' ? 'Sign in' : 'Sign up' }} with E-Mail
      </button>
      <p class="my-5 text-center font-serif text-xl">* * *</p>
      <button
        @click="mode === 'signIn' ? signInWithGoogle() : signUpWithGoogle()"
        class="flex w-full cursor-pointer items-center justify-center rounded-lg border border-neutral-100 bg-white p-3 font-medium text-neutral-900 shadow-md transition duration-100 hover:border-neutral-200 hover:bg-neutral-100"
      >
        <img class="me-5 h-6 w-6" src="../assets/icons8-google.svg" alt="" />
        {{ mode === 'signIn' ? 'Sign in' : 'Sign up' }} with Google
      </button>
    </div>
  </div>
</template>
