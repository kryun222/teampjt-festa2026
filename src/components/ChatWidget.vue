<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat'

const chat = useChatStore()
const inputText = ref('')
const messageListRef = ref(null)

async function handleSend() {
  const text = inputText.value
  if (!text.trim() || chat.loading) return
  inputText.value = ''
  await chat.sendMessage(text)
}

function handleKeydown(e) {
  // Enter = 전송, Shift+Enter = 줄바꿈
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 메시지 추가되거나 로딩 상태 바뀌면 자동으로 맨 아래로 스크롤
watch(
  () => [chat.messages.length, chat.loading],
  async () => {
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  },
)
</script>

<template>
  <div class="chat-widget">
    <!-- 플로팅 버튼 (동전 크기) -->
    <button
      type="button"
      class="chat-fab"
      :class="{ active: chat.isOpen }"
      :aria-label="chat.isOpen ? '챗봇 닫기' : '챗봇 열기'"
      @click="chat.toggle()"
    >
      {{ chat.isOpen ? '×' : '💬' }}
    </button>

    <!-- 채팅 패널 -->
    <div v-if="chat.isOpen" class="chat-panel">
      <div class="chat-header">
        <span class="chat-title">
          <span class="chat-dot"></span>
          서울축제 챗봇
        </span>
        <button type="button" class="chat-close" aria-label="닫기" @click="chat.toggle()">×</button>
      </div>

      <div ref="messageListRef" class="chat-messages">
        <p v-if="chat.messages.length === 0" class="chat-empty">
          궁금한 축제나 장소를 물어보세요!
        </p>

        <div
          v-for="(msg, idx) in chat.messages"
          :key="idx"
          class="chat-row"
          :class="msg.role"
        >
          <div class="chat-bubble">{{ msg.content }}</div>
        </div>

        <div v-if="chat.loading" class="chat-row assistant">
          <div class="chat-bubble chat-typing">
            <span></span><span></span><span></span>
          </div>
        </div>

        <p v-if="chat.error" class="chat-error">{{ chat.error }}</p>
      </div>

      <div class="chat-input-row">
        <textarea
          v-model="inputText"
          rows="1"
          placeholder="메시지를 입력하세요..."
          class="chat-input"
          @keydown="handleKeydown"
        ></textarea>
        <button
          type="button"
          class="chat-send"
          :disabled="chat.loading || !inputText.trim()"
          @click="handleSend"
        >
          전송
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
}

.chat-fab {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  color: #fff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.chat-fab:hover {
  transform: scale(1.08);
}

.chat-fab.active {
  background: #374151;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
}

.chat-panel {
  position: absolute;
  right: 0;
  bottom: 64px;
  width: 330px;
  height: 450px;
  background: #0f1420;
  border: 1px solid rgba(255, 0, 127, 0.4);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(255, 0, 127, 0.15), rgba(123, 44, 191, 0.15));
  border-bottom: 1px solid rgba(255, 0, 127, 0.2);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #f472b6;
  font-size: 0.92rem;
}

.chat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.chat-close {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.chat-close:hover {
  color: #fff;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-empty {
  color: #6b7280;
  font-size: 0.85rem;
  text-align: center;
  margin: 24px 0 0;
}

.chat-row {
  display: flex;
}

.chat-row.user {
  justify-content: flex-end;
}

.chat-row.assistant {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-row.user .chat-bubble {
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.chat-row.assistant .chat-bubble {
  background: #1f2937;
  color: #e5e7eb;
  border-bottom-left-radius: 2px;
}

.chat-typing {
  display: flex;
  gap: 4px;
  padding: 12px;
}

.chat-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: chatBlink 1.2s infinite ease-in-out;
}

.chat-typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.chat-typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chatBlink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.chat-error {
  color: #f87171;
  font-size: 0.78rem;
  text-align: center;
  margin: 4px 0 0;
}

.chat-input-row {
  display: flex;
  gap: 6px;
  padding: 10px;
  border-top: 1px solid rgba(255, 0, 127, 0.2);
}

.chat-input {
  flex: 1;
  min-width: 0;
  resize: none;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 10px;
  color: #f3f4f6;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  max-height: 80px;
}

.chat-input:focus {
  border-color: #ff007f;
}

.chat-send {
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.chat-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .chat-panel {
    width: calc(100vw - 48px);
  }
}
</style>