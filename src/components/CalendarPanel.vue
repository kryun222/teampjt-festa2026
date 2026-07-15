<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  month: { type: Date, required: true },
  festivals: { type: Array, default: () => [] },
})

const emit = defineEmits(['month-change', 'festival-click'])

// YYYYMMDD 문자열 -> Date (유효하지 않으면 null)
function parseYmd(dateStr) {
  if (!dateStr || dateStr.length < 8) return null
  const date = new Date(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(4, 6), 10) - 1,
    parseInt(dateStr.slice(6, 8), 10),
  )
  return isNaN(date.getTime()) ? null : date
}

function formatDateKey(date) {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 달력 42칸 (6주 x 7일) 생성
const calendarDays = computed(() => {
  const year = props.month.getFullYear()
  const month = props.month.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i)
    days.push({
      date: prevDate.getDate(),
      isCurrentMonth: false,
      fullDate: prevDate,
      dateKey: formatDateKey(prevDate),
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: date,
      dateKey: formatDateKey(date),
    })
  }

  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(year, month + 1, i)
    days.push({
      date: i,
      isCurrentMonth: false,
      fullDate: nextDate,
      dateKey: formatDateKey(nextDate),
    })
  }

  return days
})

// 날짜별로 "시작하는 축제"와 "끝나는 축제"만 매칭 (기간 전체를 채우지 않음)
const festivalsByDate = computed(() => {
  const map = {}

  function addEntry(key, festival, type) {
    if (!key) return
    if (!map[key]) map[key] = []
    map[key].push({ festival, type })
  }

  props.festivals.forEach((festival) => {
    const start = parseYmd(festival.eventstartdate)
    const end = parseYmd(festival.eventenddate) || start
    if (!start) return

    const startKey = formatDateKey(start)
    const endKey = formatDateKey(end)

    if (startKey === endKey) {
      // 하루짜리 행사
      addEntry(startKey, festival, 'single')
    } else {
      addEntry(startKey, festival, 'start')
      addEntry(endKey, festival, 'end')
    }
  })

  return map
})

function prevMonth() {
  const prev = new Date(props.month)
  prev.setMonth(prev.getMonth() - 1)
  emit('month-change', prev)
}

function nextMonth() {
  const next = new Date(props.month)
  next.setMonth(next.getMonth() + 1)
  emit('month-change', next)
}

function onFestivalClick(festival) {
  emit('festival-click', festival)
}

// ============================================================================
// 모바일에는 hover가 없어서, 날짜를 탭하면 그날의 전체 일정을 팝오버로 보여줍니다.
// ============================================================================
const calendarPanelRef = ref(null)

const activeDayKey = ref(null)

function toggleDayPopover(day) {
  if (!day.dateKey || !festivalsByDate.value[day.dateKey]?.length) {
    activeDayKey.value = null
    return
  }

  activeDayKey.value = activeDayKey.value === day.dateKey ? null : day.dateKey
}

function selectPopoverFestival(festival) {
  activeDayKey.value = null
  onFestivalClick(festival)
}

function closeDayPopover() {
  activeDayKey.value = null
}

function handleOutsideClick(event) {
  if (calendarPanelRef.value && !calendarPanelRef.value.contains(event.target)) {
    closeDayPopover()
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

const monthYear = computed(() =>
  props.month.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  }),
)

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

// 배지 앞에 붙는 표시: 시작일 ▶ / 종료일 ■ / 하루짜리는 표시 없음
const typeIcon = { start: '▶', end: '■', single: '' }
</script>

<template>
  <div class="calendar-panel" ref="calendarPanelRef">
    <div class="calendar-header">
      <div>
        <h3 class="neon-text">{{ monthYear }}</h3>
        <p>월별 축제 일정을 확인하세요 (▶ 시작일 · ■ 종료일 · 날짜를 탭하면 전체 일정이 보여요)</p>
      </div>
      <div class="calendar-actions">
        <button @click="prevMonth" class="neon-btn">◀ 이전</button>
        <button @click="nextMonth" class="neon-btn">다음 ▶</button>
      </div>
    </div>

    <!-- 요일 헤더 -->
    <div class="weekdays">
      <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
    </div>

    <!-- 달력 그리드 -->
    <div class="calendar-grid">
      <div
        v-for="(day, idx) in calendarDays"
        :key="idx"
        class="calendar-day"
        :class="{
          inactive: !day.isCurrentMonth,
          'has-festival': day.dateKey && festivalsByDate[day.dateKey]?.length > 0,
          'is-active': day.dateKey && activeDayKey === day.dateKey,
        }"
        @click.stop="toggleDayPopover(day)"
      >
        <div class="day-number">{{ day.date }}</div>
        <div class="day-festivals">
          <div
            v-for="(entry, i) in day.dateKey
              ? (festivalsByDate[day.dateKey] || []).slice(0, 2)
              : []"
            :key="entry.festival.contentid || i"
            class="festival-badge"
            :class="`badge-${entry.type}`"
            :title="entry.festival.title"
            @click.stop="onFestivalClick(entry.festival)"
          >
            <span v-if="typeIcon[entry.type]" class="badge-icon">{{ typeIcon[entry.type] }}</span>
            {{ entry.festival.title.slice(0, 9) }}
          </div>
          <div
            v-if="day.dateKey && (festivalsByDate[day.dateKey] || []).length > 2"
            class="festival-more"
          >
            +{{ (festivalsByDate[day.dateKey] || []).length - 2 }}
          </div>
        </div>

        <!-- 탭하면 뜨는 전체 일정 팝오버 (모바일에서 텍스트가 안 보일 때 대체 수단) -->
        <div v-if="day.dateKey && activeDayKey === day.dateKey" class="day-popover" @click.stop>
          <div class="day-popover-header">
            <span>{{ day.fullDate.getMonth() + 1 }}월 {{ day.date }}일</span>
            <button
              type="button"
              class="day-popover-close"
              aria-label="닫기"
              @click="closeDayPopover"
            >
              ×
            </button>
          </div>

          <button
            v-for="(entry, i) in festivalsByDate[day.dateKey] || []"
            :key="entry.festival.contentid || i"
            type="button"
            class="day-popover-item"
            :class="`badge-${entry.type}`"
            @click="selectPopoverFestival(entry.festival)"
          >
            <span v-if="typeIcon[entry.type]" class="badge-icon">{{ typeIcon[entry.type] }}</span>
            {{ entry.festival.title }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-panel {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 0, 127, 0.3);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.1);
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.calendar-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 0, 127, 0.2);
}

.calendar-header h3 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #f3f4f6;
  font-weight: 700;
}

.neon-text {
  font-family: 'Orbitron', sans-serif;
  text-shadow:
    0 0 10px #ff007f,
    0 0 20px #ff007f;
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.calendar-header p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.calendar-actions {
  display: flex;
  gap: 8px;
}

.neon-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 0, 127, 0.5);
  background: linear-gradient(45deg, rgba(255, 0, 127, 0.1), rgba(123, 44, 191, 0.1));
  cursor: pointer;
  color: #f472b6;
  font-weight: 600;
  transition: all 0.3s ease;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.5);
}

.neon-btn:hover {
  background: linear-gradient(45deg, rgba(255, 0, 127, 0.2), rgba(123, 44, 191, 0.2));
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.6);
  border-color: #ff007f;
  transform: scale(1.05);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.weekday {
  text-align: center;
  font-weight: 700;
  color: #f472b6;
  padding: 10px;
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(255, 0, 127, 0.3);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  min-width: 0;
  position: relative;
  border: 1px solid rgba(255, 0, 127, 0.2);
  border-radius: 10px;
  padding: 8px;
  background: rgba(20, 30, 50, 0.6);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.calendar-day:hover {
  background: rgba(20, 30, 50, 0.9);
  border-color: #ff007f;
  box-shadow: 0 0 15px rgba(255, 0, 127, 0.4);
}

.calendar-day.has-festival {
  border-color: rgba(255, 0, 127, 0.6);
  background: rgba(255, 0, 127, 0.05);
}

.calendar-day.is-active {
  overflow: visible;
  z-index: 20;
  border-color: #ff007f;
  box-shadow: 0 0 15px rgba(255, 0, 127, 0.4);
}

.day-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  min-width: 160px;
  max-width: 240px;
  max-height: 220px;
  overflow-y: auto;
  padding: 10px;
  background: #10192e;
  border: 1px solid rgba(255, 0, 127, 0.5);
  border-radius: 12px;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.6),
    0 0 15px rgba(255, 0, 127, 0.3);
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: default;
  white-space: normal;
}

.day-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 0, 127, 0.2);
  color: #f472b6;
  font-size: 0.8rem;
  font-weight: 700;
}

.day-popover-close {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.day-popover-close:hover {
  color: #fff;
}

.day-popover-item {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-left: 3px solid #ff007f;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(255, 0, 127, 0.25), rgba(123, 44, 191, 0.25));
  color: #f472b6;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.day-popover-item.badge-start {
  border-left-color: #34d399;
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(123, 44, 191, 0.25));
  color: #6ee7b7;
}

.day-popover-item.badge-end {
  border-left-color: #f87171;
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.25), rgba(123, 44, 191, 0.25));
  color: #fca5a5;
}

.day-popover-item:hover {
  background: linear-gradient(135deg, rgba(255, 0, 127, 0.8), rgba(123, 44, 191, 0.8));
  color: #fff;
}

/* 맨 왼쪽/오른쪽 열은 팝오버가 화면 밖으로 잘리지 않도록 정렬을 바꿉니다 */
.calendar-day:nth-child(7n + 1) .day-popover {
  left: 0;
  transform: none;
}

.calendar-day:nth-child(7n) .day-popover {
  left: auto;
  right: 0;
  transform: none;
}

.calendar-day.inactive {
  background: rgba(50, 50, 70, 0.3);
  color: #6b7280;
  cursor: default;
  border-color: rgba(100, 100, 120, 0.2);
}

.calendar-day.inactive:hover {
  background: rgba(50, 50, 70, 0.3);
  border-color: rgba(100, 100, 120, 0.2);
  box-shadow: none;
}

.day-number {
  font-weight: 700;
  font-size: 0.9rem;
  color: #f3f4f6;
  margin-bottom: 6px;
}

.calendar-day.inactive .day-number {
  color: #6b7280;
}

.day-festivals {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.festival-badge {
  background: linear-gradient(135deg, rgba(255, 0, 127, 0.3), rgba(123, 44, 191, 0.3));
  color: #f472b6;
  padding: 4px 6px;
  border-radius: 4px;
  border-left: 3px solid #ff007f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 700;
  line-height: 1.3;
}

/* 시작일 배지: 초록 계열로 구분 */
.festival-badge.badge-start {
  border-left-color: #34d399;
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(123, 44, 191, 0.25));
  color: #6ee7b7;
}

/* 종료일 배지: 붉은 계열로 구분 */
.festival-badge.badge-end {
  border-left-color: #f87171;
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.25), rgba(123, 44, 191, 0.25));
  color: #fca5a5;
}

.badge-icon {
  margin-right: 2px;
}

.festival-badge:hover {
  background: linear-gradient(135deg, rgba(255, 0, 127, 0.8), rgba(123, 44, 191, 0.8));
  border-left-color: #7b2cbf;
  box-shadow: 0 0 8px rgba(255, 0, 127, 0.6);
  transform: scale(1.05);
  color: #fff;
}

.festival-more {
  color: #9ca3af;
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
  padding: 2px 0;
}

.day-festivals::-webkit-scrollbar {
  width: 3px;
}

.day-festivals::-webkit-scrollbar-track {
  background: transparent;
}

.day-festivals::-webkit-scrollbar-thumb {
  background: rgba(255, 0, 127, 0.4);
  border-radius: 1px;
}

.day-festivals::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 0, 127, 0.7);
}

@media (max-width: 640px) {
  .calendar-panel {
    padding: 14px;
  }

  .calendar-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .calendar-header h3 {
    font-size: 1.15rem;
  }

  .calendar-header p {
    font-size: 0.78rem;
  }

  .calendar-actions {
    width: 100%;
  }

  .neon-btn {
    flex: 1;
    padding: 8px 10px;
    font-size: 0.85rem;
  }

  .weekdays,
  .calendar-grid {
    gap: 4px;
  }

  .weekday {
    padding: 6px 2px;
    font-size: 0.72rem;
  }

  .calendar-day {
    padding: 4px;
    border-radius: 8px;
  }

  .day-number {
    font-size: 0.72rem;
    margin-bottom: 3px;
  }

  .day-festivals {
    font-size: 0.65rem;
    gap: 2px;
  }

  .festival-badge {
    padding: 2px 3px;
    border-left-width: 2px;
    font-weight: 600;
  }

  .festival-more {
    font-size: 0.6rem;
  }
}
</style>
