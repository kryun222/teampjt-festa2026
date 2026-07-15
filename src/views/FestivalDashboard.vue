<script setup>
import { ref, computed } from 'vue'
import festivalData from '@/data/서울_축제공연행사.json'
import tourSpotData from '@/data/서울_관광지.json'
import lodgingData from '@/data/서울_숙박.json'
import CalendarPanel from '@/components/CalendarPanel.vue'
import MapPanel from '@/components/MapPanel.vue'
import FestivalList from '@/components/FestivalList.vue'

const currentMonth = ref(new Date())
const selectedFestivalId = ref(null)
const festivals = festivalData.items || []
const tourSpots = tourSpotData.items || []
const lodgings = lodgingData.items || []

// YYYYMMDD 문자열 -> Date (유효하지 않으면 null)
function parseYmd(str) {
  if (!str || str.length < 8) return null
  const year = parseInt(str.slice(0, 4), 10)
  const month = parseInt(str.slice(4, 6), 10) - 1
  const day = parseInt(str.slice(6, 8), 10)
  const date = new Date(year, month, day)
  return isNaN(date.getTime()) ? null : date
}

// 축제의 시작일/종료일 (종료일 없으면 시작일과 동일한 하루짜리로 취급)
function getFestivalRange(item) {
  const start = parseYmd(item.eventstartdate)
  const end = parseYmd(item.eventenddate) || start
  return { start, end }
}

// 현재 월과 축제 기간이 겹치는 축제만 필터링
const displayedFestivals = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  return festivals.filter(item => {
    const { start, end } = getFestivalRange(item)
    if (!start) return false
    return start <= monthEnd && end >= monthStart
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

// 지도 마커 정보창의 행사명 클릭 -> 하단 목록으로 스크롤
function handleMapFestivalSelect(contentId) {
  const festival = displayedFestivals.value.find(item => item.contentid === contentId)
  if (festival) handleFestivalClick(festival)
}
</script>

<template>
  <div class="festival-dashboard">
    <!-- 좌측 캘린더 + 우측 지도 -->
    <div class="grid-top">
      <CalendarPanel 
        :month="currentMonth"
        :festivals="displayedFestivals"
        @month-change="handleMonthChange"
        @festival-click="handleFestivalClick"
      />
      <MapPanel :festivals="displayedFestivals" :tour-spots="tourSpots" :lodgings="lodgings" @festival-select="handleMapFestivalSelect" />
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
  /* 탭 안에 끼워지는 컴포넌트라, 페이지 전체를 덮는 배경/높이는 부모(App.vue)가 담당 */
}

.grid-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-meta {
    text-align: left;
  }
}
</style>