import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const messages = ref([]) // { role: 'user' | 'assistant', content: string }
  const loading = ref(false)
  const error = ref(null)

  function toggle() {
    isOpen.value = !isOpen.value
  }

  async function sendMessage(text) {
    const trimmed = (text || '').trim()
    if (!trimmed || loading.value) return

    error.value = null

    // 지금 보낼 메시지는 message로 따로 넘기므로, history는 그 이전까지만
    const history = messages.value.map(({ role, content }) => ({ role, content }))

    messages.value.push({ role: 'user', content: trimmed })
    loading.value = true

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      messages.value.push({ role: 'assistant', content: data.reply })
    } catch (err) {
      console.error(err)
      error.value = '메시지 전송에 실패했어요. 잠시 후 다시 시도해주세요.'
    } finally {
      loading.value = false
    }
  }

  return { isOpen, messages, loading, error, toggle, sendMessage }
})