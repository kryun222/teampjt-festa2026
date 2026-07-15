<script setup>
const props = defineProps({
  title: String,
  value: [String, Number],
  subtitle: String,
})
</script>

<template>
  <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-5 shadow-lg">
    <p class="text-sm text-gray-400">{{ props.title }}</p>
    <p class="mt-2 truncate text-2xl font-bold text-white" :title="props.value">
      {{ props.value }}
    </p>
    <p v-if="props.subtitle" class="mt-2 text-xs text-pink-400">{{ props.subtitle }}</p>
  </article>
</template>
