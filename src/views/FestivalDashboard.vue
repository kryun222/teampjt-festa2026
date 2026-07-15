<script setup>
import { ref, computed } from 'vue'
import festivalData from '@/data/서울_축제공연행사.json'
import CalendarPanel from '@/components/CalendarPanel.vue'
import MapPanel from '@/components/MapPanel.vue'
import FestivalList from '@/components/FestivalList.vue'

const currentMonth = ref(new Date())
const selectedFestivalId = ref(null)
const festivals = festivalData.items || []

function parseFestivalMonth(item) {
  const raw = item.modifiedtime
  if (!raw || raw.length < 8) return null
  return parseInt(raw.slice(4, 6), 10)
}

// 현재 월의 축제만 필터링
const displayedFestivals = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return festivals.filter(item => {
    const date = parseFestivalMonth(item)
    return date === month + 1
  })
})

const currentMonthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })
)

function handleMonthChange(newMonth) {
  currentMonth.value = newMonth
  selectedFestivalId.value = null
}

function handleFestivalClick(festival) {
  selectedFestivalId.value = festival.contentid
  // 다음 프레임에서 스크롤되도록 설정
  setTimeout(() => {
    const element = document.querySelector(`[data-festival-id="${festival.contentid}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('highlight')
      setTimeout(() => element.classList.remove('highlight'), 2000)
    }
  }, 0)
}
</script>

<template>
  <div class="festival-dashboard">
    <div class="dashboard-header">
      <div>
        <p class="subtitle">서울 축제 캘린더</p>
        <h1 class="neon-title">축제 일정 & 지도</h1>
      </div>
      <div class="dashboard-meta">
        <span class="month-label">{{ currentMonthLabel }}</span>
        <strong class="festival-count">{{ displayedFestivals.length }}개 축제 표시</strong>
      </div>
    </div>

    <!-- 좌측 캘린더 + 우측 지도 -->
    <div class="grid-top">
      <CalendarPanel 
        :month="currentMonth"
        :festivals="displayedFestivals"
        @month-change="handleMonthChange"
        @festival-click="handleFestivalClick"
      />
      <MapPanel :festivals="displayedFestivals" />
    </div>

    <!-- 아래 축제 목록 -->
    <div class="list-bottom">
      <h2 class="list-title">📋 축제 목록</h2>
      <FestivalList 
        :festivals="displayedFestivals"
        :selected-festival-id="selectedFestivalId"
      />
    </div>
  </div>
</template>

<style scoped>
.festival-dashboard {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0b0f19 0%, #1a1f35 50%, #0b0f19 100%);
  background-attachment: fixed;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 0, 127, 0.2);
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(255, 0, 127, 0.1);
  backdrop-filter: blur(10px);
}

.subtitle {
  margin: 0;
  color: #f472b6;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: 0.85rem;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.3);
}

.neon-title {
  margin: 8px 0 0;
  font-size: 2.2rem;
  color: #f3f4f6;
  font-weight: 800;
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(255, 0, 127, 0.3);
  font-family: 'Orbitron', sans-serif;
}

.dashboard-meta {
  text-align: right;
  color: #d1d5db;
}

.month-label {
  display: block;
  font-size: 0.9rem;
  color: #9ca3af;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.festival-count {
  display: block;
  margin-top: 8px;
  font-size: 1.3rem;
  color: #f472b6;
  text-shadow: 0 0 10px rgba(255, 0, 127, 0.4);
}

.grid-top {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 32px;
}

.list-title {
  margin: 0 0 20px;
  font-size: 1.6rem;
  color: #f3f4f6;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 0, 127, 0.2);
}

@media (max-width: 1024px) {
  .grid-top {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-meta {
    text-align: left;
  }
}
</style>