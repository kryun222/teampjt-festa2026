<script setup>
import '@fullcalendar/common/main.css'
import '@fullcalendar/daygrid/main.css'
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

const props = defineProps({
  month: { type: Date, required: true },
  festivals: { type: Array, default: () => [] },
})
const emit = defineEmits(['month-change'])

const title = computed(() =>
  props.month.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })
)

function formatEventDate(item) {
  const raw = item.eventstart || item.createdtime || item.modifiedtime
  if (!raw || raw.length < 8) return null
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

const events = computed(() =>
  props.festivals
    .map((item) => {
      const start = formatEventDate(item)
      if (!start) return null
      return {
        id: item.contentid,
        title: item.title,
        start,
      }
    })
    .filter(Boolean)
)

function changeMonth(delta) {
  const next = new Date(props.month)
  next.setMonth(next.getMonth() + delta)
  emit('month-change', next)
}
</script>

<template>
  <div class="calendar-panel">
    <div class="calendar-header">
      <div class="calendar-title">
        <strong>{{ title }}</strong>
        <p>월별 축제 일정을 확인하세요</p>
      </div>
      <div class="calendar-actions">
        <button type="button" @click="changeMonth(-1)">이전 달</button>
        <button type="button" @click="changeMonth(1)">다음 달</button>
      </div>
    </div>

    <FullCalendar
      :plugins="[dayGridPlugin]"
      initialView="dayGridMonth"
      :events="events"
      height="auto"
      dayMaxEvents
    />
  </div>
</template>

<style scoped>
.calendar-panel {
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  min-height: 520px;
  box-shadow: 0 24px 60px rgba(34, 56, 99, 0.08);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.calendar-title strong {
  display: block;
  font-size: 1.3rem;
  margin-bottom: 6px;
}

.calendar-title p {
  margin: 0;
  color: #6b7280;
}

.calendar-actions button {
  margin-left: 10px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid #d7dce8;
  background: #f8f9ff;
  cursor: pointer;
  color: #19223b;
}
.calendar-actions button:hover {
  background: #eef2ff;
}
</style>