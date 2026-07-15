<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  actionLabel: {
    type: String,
    default: '자세히 보기 →',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['activate'])

function handleActivate() {
  if (props.disabled) return

  emit('activate')
}
</script>

<template>
  <button
    type="button"
    class="group w-full rounded-2xl border border-gray-800 bg-gray-950/80 p-5 text-left shadow-lg transition duration-200 hover:-translate-y-1 hover:border-pink-500/60 hover:bg-pink-500/5 hover:shadow-[0_0_24px_rgba(236,72,153,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/70 disabled:translate-y-0 disabled:border-gray-800 disabled:bg-gray-950/80 disabled:opacity-60 disabled:shadow-lg"
    :disabled="props.disabled"
    :aria-label="`${props.title}: ${props.value}. ${props.actionLabel}`"
    @click="handleActivate"
  >
    <p class="text-sm text-gray-400 transition group-hover:text-gray-300">
      {{ props.title }}
    </p>

    <p
      class="mt-2 truncate text-2xl font-bold text-white transition group-hover:text-pink-100"
      :title="String(props.value)"
    >
      {{ props.value }}
    </p>

    <div class="mt-2 flex min-h-5 items-center justify-between gap-3">
      <p v-if="props.subtitle" class="min-w-0 truncate text-xs text-pink-400">
        {{ props.subtitle }}
      </p>

      <span
        class="ml-auto flex-shrink-0 text-xs font-semibold text-gray-500 transition group-hover:translate-x-0.5 group-hover:text-pink-300"
      >
        {{ props.actionLabel }}
      </span>
    </div>
  </button>
</template>
