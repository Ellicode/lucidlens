<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { convertMarkdownToHtml } from '../utils'
import { EyeIcon, PencilIcon } from '@heroicons/vue/20/solid'

const model = defineModel<string>()
const editorRef = ref<HTMLTextAreaElement | null>(null)
const isEditing = ref(true)

const htmlContent = computed(() => {
  return model.value ? convertMarkdownToHtml(model.value) : '<i>** cricket noises... **</i>'
})

const toggleView = () => {
  isEditing.value = !isEditing.value
}
</script>

<template>
  <div
    class="ring-primary-500 relative mb-3 h-48 w-full rounded-lg border border-neutral-200 ring-offset-1 has-[:focus]:ring-2"
  >
    <div class="absolute top-2 right-2 z-10">
      <button
        @click="toggleView"
        class="h-10 w-10 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm hover:bg-neutral-50 active:bg-neutral-100"
      >
        <EyeIcon class="h-5 w-5 text-neutral-500" v-if="isEditing" />
        <PencilIcon class="h-5 w-5 text-neutral-500" v-else />
      </button>
    </div>
    <span class="absolute right-2 bottom-2 text-sm text-neutral-500"> Markdown is supported. </span>
    <textarea
      v-if="isEditing"
      ref="editorRef"
      type="text"
      class="h-full w-full resize-none p-3 font-serif outline-0"
      v-model="model"
    />
    <div v-else class="h-full w-full overflow-auto p-3" v-html="htmlContent"></div>
  </div>
</template>
