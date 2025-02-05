<script setup lang="ts">
const props = defineProps<{
  size: 'xs' | 'sm' | 'md' | 'lg'
}>()

const sizeMap = {
  xs: '16px',
  sm: '24px',
  md: '36px',
  lg: '48px',
}
</script>

<template>
  <div :class="`loader loader-${props.size} animate-spin`"></div>
</template>

<style scoped>
.loader {
  border: 2px solid currentColor;
  border-left-color: transparent;
  border-radius: 50%;
}

.loader-xs {
  width: 16px;
  height: 16px;
}

.loader-sm {
  width: 24px;
  height: 24px;
}

.loader-md {
  width: 36px;
  height: 36px;
}

.loader-lg {
  width: 48px;
  height: 48px;
}
</style>
