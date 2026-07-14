<script setup>
import { ref, computed } from 'vue'
import festivalData from '@/data/서울_축제공연행사.json'
import CalendarPanel from '@/components/CalendarPanel.vue'
import MapPanel from '@/components/MapPanel.vue'
import FestivalList from '@/components/FestivalList.vue'

const currentMonth = ref(new Date())
const festivals = festivalData.items || []

function parseFestivalDate(item) {
  const raw = item.eventstart || item.createdtime || item.modifiedtime
  if (!raw || raw.length < 8) return null
  const year = raw.slice(0, 4)
  const month = raw.slice(4, 6)
  const day = raw.slice(6, 8)
  return new Date(`${year}-${month}-${day}`)
}

const monthFiltered = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return festivals.filter((item) => {
    const date = parseFestivalDate(item)
    return date && date.getFullYear() === year && date.getMonth() === month
  })
})

const displayedFestivals = computed(() => {
  return monthFiltered.value.length ? monthFiltered.value : festivals
})

const currentMonthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })
)

function setMonth(date) {
  currentMonth.value = date
}
</script>

<template>
  <div class="festival-dashboard">
    <div class="dashboard-header">
      <div>
        <p class="subtitle">서울 축제 캘린더</p>
        <h1>축제 일정 & 지도</h1>
      </div>
      <div class="dashboard-meta">
        <span>{{ currentMonthLabel }}</span>
        <strong>{{ displayedFestivals.length }}개 축제 표시</strong>
      </div>
    </div>

    <div class="grid-top">
      <CalendarPanel
        :month="currentMonth.value"
        :festivals="displayedFestivals"
        @month-change="setMonth"
      />
      <MapPanel :festivals="displayedFestivals" />
      <FestivalList :festivals="displayedFestivals" />
    </div>

    <div class="list-bottom">
      <FestivalList :festivals="displayedFestivals" />
    </div>
  </div>
</template>

<style scoped>
.festival-dashboard {
  padding: 24px;
  min-height: 100vh;
  background: #eef2ff;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-header .subtitle {
  margin: 0;
  color: #5b6b9e;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.dashboard-header h1 {
  margin: 6px 0 0;
  font-size: 2rem;
}

.dashboard-meta {
  text-align: right;
  color: #2f3e72;
}

.dashboard-meta strong {
  display: block;
  margin-top: 6px;
  font-size: 1.1rem;
}

.grid-top {
  display: grid;
  gap: 20px;
  grid-template-columns: 1.2fr 0.8fr;
  margin-bottom: 28px;
}

.list-bottom {
  display: block;
}
</style>

const displayedFestivals = computed(() => {
  const monthData = monthFiltered.value
  return monthData.length ? monthData : festivals
})