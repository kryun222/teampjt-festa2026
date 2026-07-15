<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import festivalData from '@/data/서울_축제공연행사.json'
import tourSpotData from '@/data/서울_관광지.json'
import lodgingData from '@/data/서울_숙박.json'

import CalendarPanel from '@/components/CalendarPanel.vue'
import MapPanel from '@/components/MapPanel.vue'
import FestivalList from '@/components/FestivalList.vue'

// ============================================================================
// 1. App.vue에서 전달받는 이동 요청
// ============================================================================
const props = defineProps({
  navigationRequest: {
    type: Object,
    default: null,
  },
})

// ============================================================================
// 2. 지역 정보
// ============================================================================
const ALL_DISTRICTS = '서울 전체'

const SEOUL_DISTRICT_CODE_MAP = {
  110: '종로구',
  140: '중구',
  170: '용산구',
  200: '성동구',
  215: '광진구',
  230: '동대문구',
  260: '중랑구',
  290: '성북구',
  305: '강북구',
  320: '도봉구',
  350: '노원구',
  380: '은평구',
  410: '서대문구',
  440: '마포구',
  470: '양천구',
  500: '강서구',
  530: '구로구',
  545: '금천구',
  560: '영등포구',
  590: '동작구',
  620: '관악구',
  650: '서초구',
  680: '강남구',
  710: '송파구',
  740: '강동구',
}

const districtOptions = [ALL_DISTRICTS, ...Object.values(SEOUL_DISTRICT_CODE_MAP)]

function getDistrict(item) {
  return SEOUL_DISTRICT_CODE_MAP[String(item?.lDongSignguCd)] || '미등록'
}

// ============================================================================
// 3. 화면 상태
// ============================================================================
const currentMonth = ref(new Date())

const selectedDistrictName = ref(ALL_DISTRICTS)

const selectedFestivalId = ref(null)

// MapPanel의 focusDistrict(), resetMap() 호출용
const mapPanelRef = ref(null)

// 지역 KPI 클릭 시 지도 영역으로 스크롤하기 위한 DOM ref
const mapSectionRef = ref(null)

// ============================================================================
// 4. 원본 데이터
// ============================================================================
const festivals = festivalData.items || []

const tourSpots = tourSpotData.items || []

const lodgings = lodgingData.items || []

// ============================================================================
// 5. 날짜 처리
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
// 6. 현재 월의 서울 전체 축제
// ============================================================================
const monthlyFestivals = computed(() => {
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

// ============================================================================
// 7. 현재 월 + 선택 지역 기준 축제
// ============================================================================
const displayedFestivals = computed(() => {
  if (selectedDistrictName.value === ALL_DISTRICTS) {
    return monthlyFestivals.value
  }

  return monthlyFestivals.value.filter(
    (festival) => getDistrict(festival) === selectedDistrictName.value,
  )
})

// ============================================================================
// 8. 선택 지역 기준 관광지
// ============================================================================
const displayedTourSpots = computed(() => {
  if (selectedDistrictName.value === ALL_DISTRICTS) {
    return tourSpots
  }

  return tourSpots.filter((spot) => getDistrict(spot) === selectedDistrictName.value)
})

// ============================================================================
// 9. 선택 지역 기준 숙박
// ============================================================================
const displayedLodgings = computed(() => {
  if (selectedDistrictName.value === ALL_DISTRICTS) {
    return lodgings
  }

  return lodgings.filter((lodging) => getDistrict(lodging) === selectedDistrictName.value)
})

// ============================================================================
// 10. 화면 표시용 계산값
// ============================================================================
const currentMonthLabel = computed(() =>
  currentMonth.value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  }),
)

const filterSummary = computed(
  () =>
    `${currentMonthLabel.value} · ${selectedDistrictName.value} · ${displayedFestivals.value.length}개 축제`,
)

// ============================================================================
// 11. 캘린더 월 변경
// ============================================================================
function handleMonthChange(newMonth) {
  currentMonth.value = newMonth

  selectedFestivalId.value = null
}

// ============================================================================
// 12. 최상단 지역 필터 변경
// ============================================================================
async function handleDistrictChange(districtName) {
  selectedDistrictName.value = districtOptions.includes(districtName) ? districtName : ALL_DISTRICTS

  selectedFestivalId.value = null

  await nextTick()

  if (selectedDistrictName.value === ALL_DISTRICTS) {
    mapPanelRef.value?.resetMap()
  } else {
    mapPanelRef.value?.focusDistrict(selectedDistrictName.value)
  }
}

// ============================================================================
// 13. 축제 목록 이동 및 하이라이트
// ============================================================================
function handleFestivalClick(festival) {
  if (!festival?.contentid) {
    return
  }

  const contentId = String(festival.contentid)

  selectedFestivalId.value = contentId

  // 월 또는 지역 변경 후 축제 목록이 다시 렌더링될 시간을 확보합니다.
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
// 14. 지도 마커에서 축제 선택
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
// 15. 특정 축제로 이동
// ============================================================================
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

  // 특정 축제 이동 시 지역 필터 때문에 축제가 사라지지 않도록 초기화합니다.
  selectedDistrictName.value = ALL_DISTRICTS

  selectedFestivalId.value = null

  if (startDate) {
    currentMonth.value = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  }

  await nextTick()

  mapPanelRef.value?.resetMap()

  handleFestivalClick(festival)
}

// ============================================================================
// 16. 특정 지역으로 이동
// ============================================================================
async function moveToDistrict(districtName) {
  if (!districtName || !districtOptions.includes(districtName)) {
    return
  }

  selectedDistrictName.value = districtName

  selectedFestivalId.value = null

  await nextTick()

  // 데이터 분석 KPI에서 들어온 경우 지도까지 자동으로 내려갑니다.
  mapSectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

  // 탭 표시와 스크롤 이후 카카오 지도의 크기와 중심을 다시 계산합니다.
  window.setTimeout(() => {
    mapPanelRef.value?.focusDistrict(districtName)
  }, 350)
}

// ============================================================================
// 17. 특정 월로 이동
// ============================================================================
async function moveToMonth(year, month) {
  if (!year || !month) {
    return
  }

  selectedDistrictName.value = ALL_DISTRICTS

  selectedFestivalId.value = null

  currentMonth.value = new Date(year, month - 1, 1)

  await nextTick()

  mapPanelRef.value?.resetMap()
}

// ============================================================================
// 18. 현재 월 기본 상태로 이동
// ============================================================================
async function moveToCurrentMonth() {
  selectedDistrictName.value = ALL_DISTRICTS

  selectedFestivalId.value = null

  currentMonth.value = new Date()

  await nextTick()

  mapPanelRef.value?.resetMap()
}

// ============================================================================
// 19. 홈 화면 등에서 특정 축제로 이동할 때 사용하는 외부 함수
// ============================================================================
async function focusFestival(contentId) {
  await moveToFestival(contentId)
}

// ============================================================================
// 20. App.vue에서 전달된 요청 처리
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

// 동일한 KPI를 반복해서 눌러도 다시 실행되도록 requestId를 감시합니다.
watch(
  () => props.navigationRequest?.requestId,
  () => {
    handleNavigationRequest(props.navigationRequest)
  },
  {
    immediate: true,
  },
)

defineExpose({
  focusFestival,
})
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
    <!-- 최상단 지역 필터 -->
    <!-- ================================================================ -->
    <section class="filter-bar">
      <div class="filter-copy">
        <span class="filter-title"> 지역 선택 </span>

        <p class="filter-description">
          선택한 지역을 기준으로 캘린더, 지도, 축제 목록을 함께 변경합니다.
        </p>
      </div>

      <div class="filter-control">
        <label for="district-filter" class="filter-label"> 서울 지역 </label>

        <select
          id="district-filter"
          class="district-select"
          :value="selectedDistrictName"
          @change="handleDistrictChange($event.target.value)"
        >
          <option v-for="district in districtOptions" :key="district" :value="district">
            {{ district }}
          </option>
        </select>
      </div>

      <div class="filter-result">
        <span class="filter-result-label"> 현재 조건 </span>

        <strong class="filter-result-value">
          {{ filterSummary }}
        </strong>
      </div>
    </section>

    <!-- ================================================================ -->
    <!-- 캘린더 + 지도 -->
    <!-- ================================================================ -->
    <div class="grid-top">
      <CalendarPanel
        :month="currentMonth"
        :festivals="displayedFestivals"
        @month-change="handleMonthChange"
        @festival-click="handleFestivalClick"
      />

      <div ref="mapSectionRef" class="map-scroll-target">
        <MapPanel
          ref="mapPanelRef"
          :festivals="displayedFestivals"
          :tour-spots="displayedTourSpots"
          :lodgings="displayedLodgings"
          :selected-district="selectedDistrictName"
          @festival-select="handleMapFestivalSelect"
        />
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 축제 목록 -->
    <!-- ================================================================ -->
    <div class="list-bottom">
      <div class="list-heading">
        <h2 class="list-title">📋 축제 목록</h2>

        <span class="list-filter-label">
          {{ filterSummary }}
        </span>
      </div>

      <FestivalList :festivals="displayedFestivals" :selected-festival-id="selectedFestivalId" />
    </div>
  </div>
</template>

<style scoped>
.festival-dashboard {
  width: 100%;
}

/* sticky 헤더에 지도 상단이 가려지지 않도록 여백을 둡니다. */
.map-scroll-target {
  scroll-margin-top: 112px;
}

/* ==========================================================================
   상단 제목
   ========================================================================== */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
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
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.3);
}

.neon-title {
  margin: 8px 0 0;
  font-family: 'Orbitron', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  color: #f3f4f6;
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(255, 0, 127, 0.3);
}

.dashboard-meta {
  color: #d1d5db;
  text-align: right;
}

.month-label {
  display: block;
  margin-bottom: 6px;
  color: #9ca3af;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

.festival-count {
  display: block;
  margin-top: 8px;
  color: #f472b6;
  font-size: 1.3rem;
  text-shadow: 0 0 10px rgba(255, 0, 127, 0.4);
}

/* ==========================================================================
   최상단 필터
   ========================================================================== */
.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 240px) minmax(220px, auto);
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 18px 20px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(244, 114, 182, 0.35);
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.08);
}

.filter-copy {
  min-width: 0;
}

.filter-title {
  display: block;
  color: #f9a8d4;
  font-size: 0.92rem;
  font-weight: 800;
}

.filter-description {
  margin: 5px 0 0;
  color: #9ca3af;
  font-size: 0.8rem;
  line-height: 1.5;
}

.filter-control {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.filter-label {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.district-select {
  width: 100%;
  min-height: 42px;
  padding: 8px 38px 8px 12px;
  color: #f9a8d4;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  background: #111827;
  border: 1px solid rgba(244, 114, 182, 0.5);
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
}

.district-select:hover {
  background: #172033;
  border-color: #f472b6;
}

.district-select:focus {
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.18);
}

.district-select option {
  color: #f3f4f6;
  background: #111827;
}

.filter-result {
  min-width: 0;
  padding: 11px 14px;
  background: rgba(236, 72, 153, 0.07);
  border: 1px solid rgba(236, 72, 153, 0.18);
  border-radius: 11px;
}

.filter-result-label {
  display: block;
  margin-bottom: 4px;
  color: #9ca3af;
  font-size: 0.72rem;
  font-weight: 700;
}

.filter-result-value {
  display: block;
  overflow: hidden;
  color: #f3f4f6;
  font-size: 0.84rem;
  line-height: 1.5;
  text-overflow: ellipsis;
}

/* ==========================================================================
   본문
   ========================================================================== */
.grid-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.list-bottom {
  width: 100%;
}

.list-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.list-title {
  margin: 0;
  color: #f3f4f6;
  font-size: 1.6rem;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255, 0, 127, 0.2);
}

.list-filter-label {
  color: #9ca3af;
  font-size: 0.82rem;
  text-align: right;
}

/* ==========================================================================
   반응형
   ========================================================================== */
@media (max-width: 1024px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-meta {
    text-align: left;
  }

  .filter-bar {
    grid-template-columns: 1fr 220px;
  }

  .filter-result {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .dashboard-header {
    padding: 18px;
  }

  .neon-title {
    font-size: 1.7rem;
  }

  .filter-bar {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .filter-result {
    grid-column: auto;
  }

  .list-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-filter-label {
    text-align: left;
  }
}
</style>
