<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import festivalData from '@/data/서울_축제공연행사.json'
import tourSpotData from '@/data/서울_관광지.json'
import lodgingData from '@/data/서울_숙박.json'

import CalendarPanel from '@/components/CalendarPanel.vue'
import MapPanel from '@/components/MapPanel.vue'
import FestivalList from '@/components/FestivalList.vue'

// ============================================================================
// 1. App.vue에서 전달받는 캘린더 이동 요청
// ============================================================================
const props = defineProps({
  navigationRequest: {
    type: Object,
    default: null,
  },
})

// ============================================================================
// 2. 화면 상태
// ============================================================================
const currentMonth = ref(new Date())

const selectedFestivalId = ref(null)

// MapPanel 컴포넌트의 focusDistrict(), resetMap() 호출용
const mapPanelRef = ref(null)

// 지도 영역 자동 스크롤용
const mapSectionRef = ref(null)

// ============================================================================
// 3. 원본 데이터
// ============================================================================
const festivals = festivalData.items || []
const tourSpots = tourSpotData.items || []
const lodgings = lodgingData.items || []

// ============================================================================
// 4. 날짜 처리
// ============================================================================
function parseYmd(value) {
  if (!value || value.length < 8) {
    return null
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1
  const day = Number(value.slice(6, 8))

  const date = new Date(year, month, day)

  return Number.isNaN(date.getTime()) ? null : date
}

function getFestivalRange(festival) {
  const startDate = parseYmd(festival.eventstartdate)

  const endDate = parseYmd(festival.eventenddate) || startDate

  return {
    startDate,
    endDate,
  }
}

// ============================================================================
// 5. 현재 선택 월에 표시할 축제
// ============================================================================
const displayedFestivals = computed(() => {
  const year = currentMonth.value.getFullYear()

  const month = currentMonth.value.getMonth()

  const monthStart = new Date(year, month, 1)

  const monthEnd = new Date(year, month + 1, 0)

  return festivals.filter((festival) => {
    const { startDate, endDate } = getFestivalRange(festival)

    if (!startDate) {
      return false
    }

    return startDate <= monthEnd && endDate >= monthStart
  })
})

const currentMonthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  }),
)

// ============================================================================
// 6. 캘린더에서 월 변경
// ============================================================================
function handleMonthChange(newMonth) {
  currentMonth.value = newMonth
  selectedFestivalId.value = null
}

// ============================================================================
// 7. 축제 목록 이동 및 하이라이트
// ============================================================================
function handleFestivalClick(festival) {
  if (!festival?.contentid) {
    return
  }

  const contentId = String(festival.contentid)

  selectedFestivalId.value = contentId

  /*
   * 월이 변경되면 FestivalList가 다시 렌더링되어야 하므로
   * DOM 업데이트 이후 해당 축제 카드로 이동합니다.
   */
  window.setTimeout(() => {
    const element = document.querySelector(`[data-festival-id="${contentId}"]`)

    if (!element) {
      return
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    element.classList.add('highlight')

    window.setTimeout(() => {
      element.classList.remove('highlight')
    }, 2000)
  }, 100)
}

// ============================================================================
// 8. 지도 마커에서 축제 선택
// ============================================================================
function handleMapFestivalSelect(contentId) {
  const festival = displayedFestivals.value.find(
    (item) => String(item.contentid) === String(contentId),
  )

  if (!festival) {
    return
  }

  handleFestivalClick(festival)
}

// ============================================================================
// 9. KPI 요청별 이동 처리
// ============================================================================

/**
 * 다가오는 축제 KPI
 *
 * 축제 개최 월로 이동한 뒤
 * 해당 축제 목록 카드까지 스크롤하고 하이라이트합니다.
 */
async function moveToFestival(contentId) {
  if (!contentId) {
    return
  }

  const festival = festivals.find((item) => String(item.contentid) === String(contentId))

  if (!festival) {
    console.warn('이동할 축제를 찾을 수 없습니다.', contentId)

    return
  }

  const startDate = parseYmd(festival.eventstartdate)

  if (startDate) {
    currentMonth.value = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  }

  await nextTick()

  handleFestivalClick(festival)
}

/**
 * 가장 볼거리 많은 구 KPI
 *
 * 지도 영역까지 자동 스크롤한 뒤
 * 지도 중심을 선택한 구로 이동합니다.
 */
async function moveToDistrict(districtName) {
  if (!districtName) {
    return
  }

  selectedFestivalId.value = null

  await nextTick()

  /*
   * sticky 헤더에 지도가 가려지지 않도록
   * 지도 wrapper에 scroll-margin-top을 적용했습니다.
   */
  mapSectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

  /*
   * 탭이 표시되고 스크롤이 시작된 다음
   * 카카오 지도 크기와 중심을 다시 계산합니다.
   */
  window.setTimeout(() => {
    mapPanelRef.value?.focusDistrict(districtName)
  }, 350)
}

/**
 * 가장 활발한 축제월 KPI
 *
 * 해당 연도와 월로 캘린더를 이동합니다.
 * 캘린더, 축제 목록, 축제 지도 마커가 함께 변경됩니다.
 */
async function moveToMonth(year, month) {
  if (!year || !month) {
    return
  }

  selectedFestivalId.value = null

  currentMonth.value = new Date(year, month - 1, 1)

  await nextTick()

  mapPanelRef.value?.resetMap()
}

/**
 * 지금 진행 중인 축제 KPI
 *
 * 현재 월과 서울 전체 지도 위치로 초기화합니다.
 */
async function moveToCurrentMonth() {
  selectedFestivalId.value = null
  currentMonth.value = new Date()

  await nextTick()

  mapPanelRef.value?.resetMap()
}

// ============================================================================
// 10. App.vue에서 전달된 요청 분기
// ============================================================================
async function handleNavigationRequest(request) {
  if (!request?.type) {
    return
  }

  switch (request.type) {
    case 'festival':
      await moveToFestival(request.contentId)
      break

    case 'district':
      await moveToDistrict(request.districtName)
      break

    case 'month':
      await moveToMonth(request.year, request.month)
      break

    case 'current':
      await moveToCurrentMonth()
      break

    default:
      console.warn('지원하지 않는 캘린더 이동 요청입니다.', request)
  }
}

/*
 * requestId를 감시하는 이유:
 * 같은 KPI를 연속으로 다시 눌러도 요청을 다시 실행하기 위함입니다.
 */
watch(
  () => props.navigationRequest?.requestId,
  () => {
    handleNavigationRequest(props.navigationRequest)
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="festival-dashboard">
    <!-- ================================================================ -->
    <!-- 상단 제목 -->
    <!-- ================================================================ -->
    <div class="dashboard-header">
      <div>
        <p class="subtitle">서울 축제 캘린더</p>

        <h1 class="neon-title">축제 일정 & 지도</h1>
      </div>

      <div class="dashboard-meta">
        <span class="month-label">
          {{ currentMonthLabel }}
        </span>

        <strong class="festival-count"> {{ displayedFestivals.length }}개 축제 표시 </strong>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 캘린더 + 지도 -->
    <!-- ================================================================ -->
    <div class="grid-top">
      <!-- 캘린더 -->
      <CalendarPanel
        :month="currentMonth"
        :festivals="displayedFestivals"
        @month-change="handleMonthChange"
        @festival-click="handleFestivalClick"
      />

      <!-- 지도 자동 스크롤 대상 -->
      <div ref="mapSectionRef" class="map-scroll-target">
        <MapPanel
          ref="mapPanelRef"
          :festivals="displayedFestivals"
          :tour-spots="tourSpots"
          :lodgings="lodgings"
          @festival-select="handleMapFestivalSelect"
        />
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 축제 목록 -->
    <!-- ================================================================ -->
    <div class="list-bottom">
      <h2 class="list-title">📋 축제 목록</h2>

      <FestivalList :festivals="displayedFestivals" :selected-festival-id="selectedFestivalId" />
    </div>
  </div>
</template>

<style scoped>
.festival-dashboard {
  width: 100%;
}

/*
 * 종로구 등 지역 KPI 클릭 시 sticky 헤더에
 * 지도 상단이 가려지지 않도록 스크롤 여백을 둡니다.
 */
.map-scroll-target {
  scroll-margin-top: 112px;
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
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.list-bottom {
  width: 100%;
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
