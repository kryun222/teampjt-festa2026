<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  festivals: {
    type: Array,
    default: () => [],
  },

  tourSpots: {
    type: Array,
    default: () => [],
  },

  lodgings: {
    type: Array,
    default: () => [],
  },

  selectedDistrict: {
    type: String,
    default: '서울 전체',
  },
})

const emit = defineEmits(['festival-select'])

const FESTIVAL_COLOR = '#ff007f'

const TOUR_COLOR = '#22d3ee'

const LODGING_COLOR = '#facc15'

const ALL_DISTRICTS = '서울 전체'

const SEOUL_DEFAULT_VIEW = {
  latitude: 37.5665,
  longitude: 126.978,
  level: 9,
}

const SEOUL_DISTRICT_CENTER_MAP = {
  종로구: {
    latitude: 37.5735,
    longitude: 126.979,
    level: 6,
  },

  중구: {
    latitude: 37.5641,
    longitude: 126.9979,
    level: 6,
  },

  용산구: {
    latitude: 37.5326,
    longitude: 126.9905,
    level: 6,
  },

  성동구: {
    latitude: 37.5633,
    longitude: 127.0371,
    level: 6,
  },

  광진구: {
    latitude: 37.5384,
    longitude: 127.0822,
    level: 6,
  },

  동대문구: {
    latitude: 37.5744,
    longitude: 127.0396,
    level: 6,
  },

  중랑구: {
    latitude: 37.6063,
    longitude: 127.0927,
    level: 6,
  },

  성북구: {
    latitude: 37.5894,
    longitude: 127.0167,
    level: 6,
  },

  강북구: {
    latitude: 37.6396,
    longitude: 127.0257,
    level: 6,
  },

  도봉구: {
    latitude: 37.6688,
    longitude: 127.0471,
    level: 6,
  },

  노원구: {
    latitude: 37.6542,
    longitude: 127.0568,
    level: 6,
  },

  은평구: {
    latitude: 37.6027,
    longitude: 126.9291,
    level: 6,
  },

  서대문구: {
    latitude: 37.5791,
    longitude: 126.9368,
    level: 6,
  },

  마포구: {
    latitude: 37.5663,
    longitude: 126.9016,
    level: 6,
  },

  양천구: {
    latitude: 37.5169,
    longitude: 126.8664,
    level: 6,
  },

  강서구: {
    latitude: 37.5509,
    longitude: 126.8495,
    level: 6,
  },

  구로구: {
    latitude: 37.4954,
    longitude: 126.8874,
    level: 6,
  },

  금천구: {
    latitude: 37.4569,
    longitude: 126.8955,
    level: 6,
  },

  영등포구: {
    latitude: 37.5264,
    longitude: 126.8963,
    level: 6,
  },

  동작구: {
    latitude: 37.5124,
    longitude: 126.9393,
    level: 6,
  },

  관악구: {
    latitude: 37.4784,
    longitude: 126.9516,
    level: 6,
  },

  서초구: {
    latitude: 37.4837,
    longitude: 127.0324,
    level: 6,
  },

  강남구: {
    latitude: 37.5172,
    longitude: 127.0473,
    level: 6,
  },

  송파구: {
    latitude: 37.5145,
    longitude: 127.1059,
    level: 6,
  },

  강동구: {
    latitude: 37.5301,
    longitude: 127.1238,
    level: 6,
  },
}

const mapContainer = ref(null)

const map = ref(null)

const festivalMarkers = ref([])

const tourMarkers = ref([])

const lodgingMarkers = ref([])

const showTourSpots = ref(false)

const showLodgings = ref(false)

let pendingMapAction = null

let activeOverlay = null

// ============================================================================
// 1. 오버레이 및 마커 정리
// ============================================================================
function closeActiveOverlay() {
  if (!activeOverlay) {
    return
  }

  activeOverlay.setMap(null)

  activeOverlay = null
}

function clearMarkers(markers) {
  markers.forEach((marker) => {
    marker.setMap(null)
  })
}

// ============================================================================
// 2. 마커 이미지 생성
// ============================================================================
function createMarkerImage(color = FESTIVAL_COLOR) {
  const encodedColor = encodeURIComponent(color)

  const imageSrc =
    `data:image/svg+xml;utf8,` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40">` +
    `<path d="M16 0C7.2 0 0 7.2 0 16c0 10 16 24 16 24s16-14 16-24c0-8.8-7.2-16-16-16z" fill="${encodedColor}"/>` +
    `<circle cx="16" cy="16" r="5" fill="white"/>` +
    `</svg>`

  const imageSize = new kakao.maps.Size(32, 40)

  const imageOption = {
    offset: new kakao.maps.Point(16, 40),
  }

  return new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)
}

// ============================================================================
// 3. 축제 마커
// ============================================================================
function createFestivalMarkers() {
  clearMarkers(festivalMarkers.value)

  festivalMarkers.value = []

  if (!map.value) {
    return
  }

  props.festivals.forEach((festival) => {
    if (!festival.mapx || !festival.mapy) {
      return
    }

    const latitude = Number(festival.mapy)

    const longitude = Number(festival.mapx)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return
    }

    const markerPosition = new kakao.maps.LatLng(latitude, longitude)

    const marker = new kakao.maps.Marker({
      position: markerPosition,
      title: festival.title,
      image: createMarkerImage(FESTIVAL_COLOR),
    })

    marker.setMap(map.value)

    kakao.maps.event.addListener(marker, 'click', () => {
      showFestivalInfo(festival, marker)
    })

    festivalMarkers.value.push(marker)
  })
}

function showFestivalInfo(festival, marker) {
  const content = `
    <div class="marker-info">
      <strong
        class="info-title"
        data-contentid="${festival.contentid}"
      >
        ${festival.title}
      </strong>

      <p>
        ${festival.addr1 || ''}
        ${festival.addr2 || ''}
      </p>

      ${festival.tel ? `<p>☎ ${festival.tel}</p>` : ''}
    </div>
  `

  const infoWindow = new kakao.maps.InfoWindow({
    content,
    removable: true,
  })

  infoWindow.open(map.value, marker)
}

// ============================================================================
// 4. 관광지·숙박 오버레이
// ============================================================================
function buildPoiCardElement(item, accentColor, typeLabel) {
  const wrapper = document.createElement('div')

  wrapper.className = 'poi-card'

  wrapper.style.setProperty('--poi-accent', accentColor)

  wrapper.innerHTML = `
    <div class="poi-card-top">
      <span class="poi-card-badge">
        ${typeLabel}
      </span>

      <button
        type="button"
        class="poi-card-close"
        aria-label="닫기"
      >
        ×
      </button>
    </div>

    ${
      item.firstimage
        ? `<img
            class="poi-card-img"
            src="${item.firstimage}"
            alt=""
          />`
        : ''
    }

    <div class="poi-card-body">
      <h4 class="poi-card-title">
        ${item.title}
      </h4>

      <p class="poi-card-addr">
        📍 ${item.addr1 || ''}
        ${item.addr2 || ''}
      </p>

      <p class="poi-card-tel${item.tel ? '' : ' muted'}">
        ☎ ${item.tel || '전화번호 정보 없음'}
      </p>
    </div>
  `

  wrapper.querySelector('.poi-card-close')?.addEventListener('click', closeActiveOverlay)

  return wrapper
}

function showPoiOverlay(item, position, accentColor, typeLabel) {
  closeActiveOverlay()

  const content = buildPoiCardElement(item, accentColor, typeLabel)

  activeOverlay = new kakao.maps.CustomOverlay({
    position,
    content,
    yAnchor: 1.3,
    zIndex: 20,
  })

  activeOverlay.setMap(map.value)
}

// ============================================================================
// 5. 관광지 마커
// ============================================================================
function createTourMarkers() {
  clearMarkers(tourMarkers.value)

  tourMarkers.value = []

  if (!map.value || !showTourSpots.value) {
    return
  }

  props.tourSpots.forEach((spot) => {
    if (!spot.mapx || !spot.mapy) {
      return
    }

    const latitude = Number(spot.mapy)

    const longitude = Number(spot.mapx)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return
    }

    const position = new kakao.maps.LatLng(latitude, longitude)

    const marker = new kakao.maps.Marker({
      position,
      title: spot.title,
      image: createMarkerImage(TOUR_COLOR),
    })

    marker.setMap(map.value)

    kakao.maps.event.addListener(marker, 'click', () => {
      showPoiOverlay(spot, position, TOUR_COLOR, '관광지')
    })

    tourMarkers.value.push(marker)
  })
}

// ============================================================================
// 6. 숙박 마커
// ============================================================================
function createLodgingMarkers() {
  clearMarkers(lodgingMarkers.value)

  lodgingMarkers.value = []

  if (!map.value || !showLodgings.value) {
    return
  }

  props.lodgings.forEach((lodging) => {
    if (!lodging.mapx || !lodging.mapy) {
      return
    }

    const latitude = Number(lodging.mapy)

    const longitude = Number(lodging.mapx)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return
    }

    const position = new kakao.maps.LatLng(latitude, longitude)

    const marker = new kakao.maps.Marker({
      position,
      title: lodging.title,
      image: createMarkerImage(LODGING_COLOR),
    })

    marker.setMap(map.value)

    kakao.maps.event.addListener(marker, 'click', () => {
      showPoiOverlay(lodging, position, LODGING_COLOR, '숙박')
    })

    lodgingMarkers.value.push(marker)
  })
}

// ============================================================================
// 7. 관광지·숙박 표시 토글
// ============================================================================
function toggleTourSpots() {
  showTourSpots.value = !showTourSpots.value
}

function toggleLodgings() {
  showLodgings.value = !showLodgings.value
}

// ============================================================================
// 8. 지도 이동
// ============================================================================
function executeMapAction(action) {
  if (!map.value) {
    pendingMapAction = action

    return
  }

  window.requestAnimationFrame(() => {
    map.value.relayout()

    if (action.type === 'district') {
      const target = SEOUL_DISTRICT_CENTER_MAP[action.districtName]

      if (!target) {
        return
      }

      map.value.setLevel(target.level)

      map.value.setCenter(new kakao.maps.LatLng(target.latitude, target.longitude))

      return
    }

    map.value.setLevel(SEOUL_DEFAULT_VIEW.level)

    map.value.setCenter(
      new kakao.maps.LatLng(SEOUL_DEFAULT_VIEW.latitude, SEOUL_DEFAULT_VIEW.longitude),
    )
  })
}

function focusDistrict(districtName) {
  if (!districtName || districtName === ALL_DISTRICTS) {
    resetMap()

    return
  }

  closeActiveOverlay()

  executeMapAction({
    type: 'district',
    districtName,
  })
}

function resetMap() {
  closeActiveOverlay()

  executeMapAction({
    type: 'default',
  })
}

// ============================================================================
// 9. 지도 초기화
// ============================================================================
function initMap() {
  if (!mapContainer.value) {
    return
  }

  const options = {
    center: new kakao.maps.LatLng(SEOUL_DEFAULT_VIEW.latitude, SEOUL_DEFAULT_VIEW.longitude),

    level: SEOUL_DEFAULT_VIEW.level,
  }

  map.value = new kakao.maps.Map(mapContainer.value, options)

  createFestivalMarkers()

  createTourMarkers()

  createLodgingMarkers()

  if (pendingMapAction) {
    const action = pendingMapAction

    pendingMapAction = null

    executeMapAction(action)

    return
  }

  if (props.selectedDistrict !== ALL_DISTRICTS) {
    focusDistrict(props.selectedDistrict)
  }
}

// ============================================================================
// 10. 지도 축제 정보창 제목 클릭
// ============================================================================
function handleInfoTitleClick(event) {
  const target = event.target.closest('.info-title')

  if (!target) {
    return
  }

  const contentId = target.dataset.contentid

  if (contentId) {
    emit('festival-select', contentId)
  }
}

// ============================================================================
// 11. 생명주기
// ============================================================================
onMounted(() => {
  document.addEventListener('click', handleInfoTitleClick)

  function checkKakaoMap() {
    if (window.kakao && window.kakao.maps) {
      initMap()
    } else {
      window.setTimeout(checkKakaoMap, 100)
    }
  }

  checkKakaoMap()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleInfoTitleClick)

  closeActiveOverlay()

  clearMarkers(festivalMarkers.value)

  clearMarkers(tourMarkers.value)

  clearMarkers(lodgingMarkers.value)
})

// ============================================================================
// 12. props와 토글 상태 감시
// ============================================================================
watch(
  () => props.selectedDistrict,
  (districtName) => {
    if (districtName === ALL_DISTRICTS) {
      resetMap()
    } else {
      focusDistrict(districtName)
    }
  },
)

watch(
  () => props.festivals,
  () => {
    createFestivalMarkers()
  },
)

watch(
  () => props.tourSpots,
  () => {
    createTourMarkers()
  },
)

watch(
  () => props.lodgings,
  () => {
    createLodgingMarkers()
  },
)

watch(showTourSpots, () => {
  createTourMarkers()
})

watch(showLodgings, () => {
  createLodgingMarkers()
})

defineExpose({
  focusDistrict,
  resetMap,
})
</script>

<template>
  <div class="map-panel">
    <!-- ================================================================ -->
    <!-- 지도 제목 및 마커 토글 -->
    <!-- ================================================================ -->
    <div class="map-info">
      <h3 class="neon-text">서울 축제 지도</h3>

      <p>축제 위치를 지도에서 확인하세요.</p>

      <div class="poi-toggle-row">
        <button type="button" class="poi-toggle poi-toggle-festival" disabled>🎪 축제</button>

        <button
          type="button"
          class="poi-toggle poi-toggle-tour"
          :class="{
            active: showTourSpots,
          }"
          @click="toggleTourSpots"
        >
          🏛 관광지
        </button>

        <button
          type="button"
          class="poi-toggle poi-toggle-lodging"
          :class="{
            active: showLodgings,
          }"
          @click="toggleLodgings"
        >
          🏨 숙박
        </button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 카카오 지도 -->
    <!-- ================================================================ -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- ================================================================ -->
    <!-- 지도 하단 정보 -->
    <!-- ================================================================ -->
    <div class="quick-info">
      <div class="info-item">
        <span class="label"> 표시된 축제 마커 </span>

        <span class="value"> {{ festivals.length }}개 </span>
      </div>

      <div class="info-item">
        <span class="label"> 현재 선택 지역 </span>

        <span class="value">
          {{ selectedDistrict }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-panel {
  display: flex;
  flex-direction: column;
  min-height: 760px;
  padding: 24px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 0, 127, 0.3);
  border-radius: 20px;
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.1);
  backdrop-filter: blur(10px);
}

.map-info {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 0, 127, 0.2);
}

.map-info h3 {
  margin: 0 0 6px;
  color: #f3f4f6;
  font-size: 1.3rem;
  font-weight: 700;
}

.neon-text {
  font-family: 'Orbitron', sans-serif;
  background: linear-gradient(135deg, #ff007f, #7b2cbf);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 10px #ff007f,
    0 0 20px #ff007f;
}

.map-info p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.poi-toggle-row {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.poi-toggle {
  flex: 1;
  padding: 8px 10px;
  color: #9ca3af;
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(20, 30, 50, 0.6);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.poi-toggle:disabled {
  color: #f472b6;
  background: rgba(255, 0, 127, 0.12);
  border-color: rgba(255, 0, 127, 0.6);
  cursor: default;
}

.poi-toggle-tour.active {
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.15);
  border-color: #22d3ee;
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
}

.poi-toggle-lodging.active {
  color: #facc15;
  background: rgba(250, 204, 21, 0.15);
  border-color: #facc15;
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.3);
}

.poi-toggle:not(.active):not(:disabled):hover {
  color: #d1d5db;
  border-color: rgba(255, 255, 255, 0.4);
}

.map-container {
  flex: 1;
  width: 100%;
  min-height: 560px;
  height: 100%;
  margin: 16px 0;
  overflow: hidden;
  border: 1px solid rgba(255, 0, 127, 0.2);
  border-radius: 12px;
}

.quick-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 0, 127, 0.2);
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: rgba(255, 0, 127, 0.05);
  border: 1px solid rgba(255, 0, 127, 0.2);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(255, 0, 127, 0.1);
  box-shadow: 0 0 10px rgba(255, 0, 127, 0.2);
}

.label {
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.value {
  margin-top: 4px;
  color: #f472b6;
  font-size: 1.2rem;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.3);
}

@media (max-width: 640px) {
  .map-panel {
    min-height: auto;
    padding: 16px;
  }

  .map-container {
    min-height: 380px;
  }

  .quick-info {
    grid-template-columns: 1fr;
  }

  .poi-toggle-row {
    flex-wrap: wrap;
  }

  .poi-toggle {
    min-width: calc(50% - 4px);
  }
}
</style>

<style>
.marker-info {
  max-width: 220px;
  padding: 10px 12px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.marker-info .info-title {
  display: block;
  color: #d6336c;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.marker-info .info-title:hover {
  color: #ff007f;
}

.marker-info p {
  margin: 4px 0 0;
  color: #333;
}

.poi-card {
  width: 220px;
  overflow: hidden;
  font-family: inherit;
  background: #10192e;
  border: 1px solid var(--poi-accent, #ff007f);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.poi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--poi-accent, #ff007f);
}

.poi-card-badge {
  color: #0b0f19;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.poi-card-close {
  padding: 2px 4px;
  color: #0b0f19;
  font-size: 0.95rem;
  line-height: 1;
  background: transparent;
  border: none;
  cursor: pointer;
}

.poi-card-img {
  display: block;
  width: 100%;
  height: 110px;
  object-fit: cover;
}

.poi-card-body {
  padding: 10px 12px 12px;
}

.poi-card-title {
  margin: 0 0 6px;
  color: #f3f4f6;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.poi-card-addr,
.poi-card-tel {
  margin: 4px 0 0;
  color: #d1d5db;
  font-size: 0.78rem;
  line-height: 1.4;
}

.poi-card-tel.muted {
  color: #6b7280;
}
</style>
