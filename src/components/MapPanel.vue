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
})

const emit = defineEmits(['festival-select'])

const FESTIVAL_COLOR = '#ff007f'

const TOUR_COLOR = '#22d3ee'

const LODGING_COLOR = '#facc15'

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
const activeRegion = ref('서울 전체')

let pendingMapAction = null
let activeOverlay = null

const festivalMarkers = ref([])
const tourMarkers = ref([])
const lodgingMarkers = ref([])

const showTourSpots = ref(false)

const showLodgings = ref(false)

function closeActiveOverlay() {
  if (!activeOverlay) return

  activeOverlay.setMap(null)
  activeOverlay = null
}

function clearMarkers(list) {
  list.forEach((marker) => {
    marker.setMap(null)
  })
}

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

function createFestivalMarkers() {
  clearMarkers(festivalMarkers.value)

  festivalMarkers.value = []

  props.festivals.forEach((festival) => {
    if (!festival.mapx || !festival.mapy) {
      return
    }

    const markerPosition = new kakao.maps.LatLng(
      parseFloat(festival.mapy),
      parseFloat(festival.mapx),
    )

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

  const infowindow = new kakao.maps.InfoWindow({
    content,
    removable: true,
  })

  infowindow.open(map.value, marker)
}

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

    ${item.firstimage ? `<img class="poi-card-img" src="${item.firstimage}" alt="" />` : ''}

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

function createTourMarkers() {
  clearMarkers(tourMarkers.value)

  tourMarkers.value = []

  if (!showTourSpots.value) {
    return
  }

  props.tourSpots.forEach((spot) => {
    if (!spot.mapx || !spot.mapy) {
      return
    }

    const position = new kakao.maps.LatLng(parseFloat(spot.mapy), parseFloat(spot.mapx))

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

function createLodgingMarkers() {
  clearMarkers(lodgingMarkers.value)

  lodgingMarkers.value = []

  if (!showLodgings.value) {
    return
  }

  props.lodgings.forEach((lodging) => {
    if (!lodging.mapx || !lodging.mapy) {
      return
    }

    const position = new kakao.maps.LatLng(parseFloat(lodging.mapy), parseFloat(lodging.mapx))

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

function toggleTourSpots() {
  showTourSpots.value = !showTourSpots.value
}

function toggleLodgings() {
  showLodgings.value = !showLodgings.value
}

function executeMapAction(action) {
  if (!map.value) {
    pendingMapAction = action

    return
  }

  window.requestAnimationFrame(() => {
    map.value.relayout()

    if (action.type === 'district') {
      const target = SEOUL_DISTRICT_CENTER_MAP[action.districtName]

      if (!target) return

      map.value.setLevel(target.level)

      map.value.setCenter(new kakao.maps.LatLng(target.latitude, target.longitude))

      activeRegion.value = action.districtName

      return
    }

    map.value.setLevel(SEOUL_DEFAULT_VIEW.level)

    map.value.setCenter(
      new kakao.maps.LatLng(SEOUL_DEFAULT_VIEW.latitude, SEOUL_DEFAULT_VIEW.longitude),
    )

    activeRegion.value = '서울 전체'
  })
}

function focusDistrict(districtName) {
  if (!districtName) return

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
  }
}

function handleInfoTitleClick(event) {
  const target = event.target.closest('.info-title')

  if (!target) return

  const contentId = target.dataset.contentid

  if (contentId) {
    emit('festival-select', contentId)
  }
}

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
})

watch(
  () => props.festivals,
  () => {
    if (map.value) {
      createFestivalMarkers()
    }
  },
)

watch(
  () => props.tourSpots,
  () => {
    if (map.value) {
      createTourMarkers()
    }
  },
)

watch(
  () => props.lodgings,
  () => {
    if (map.value) {
      createLodgingMarkers()
    }
  },
)

watch(showTourSpots, () => {
  if (map.value) {
    createTourMarkers()
  }
})

watch(showLodgings, () => {
  if (map.value) {
    createLodgingMarkers()
  }
})

defineExpose({
  focusDistrict,
  resetMap,
})
</script>

<template>
  <div class="map-panel">
    <div class="map-info">
      <h3 class="neon-text">서울 축제 지도</h3>

      <p>축제 위치를 지도에서 확인하세요</p>

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

    <div ref="mapContainer" class="map-container"></div>

    <div class="quick-info">
      <div class="info-item">
        <span class="label"> 표시된 축제 마커 </span>

        <span class="value"> {{ festivals.length }}개 </span>
      </div>

      <div class="info-item">
        <span class="label"> 지역 </span>

        <span class="value">
          {{ activeRegion }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-panel {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 0, 127, 0.3);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.1);
  min-height: 760px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.map-info {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 0, 127, 0.2);
}

.map-info h3 {
  margin: 0 0 6px;
  font-size: 1.3rem;
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
  border-radius: 10px;
  border: 1px solid rgba(156, 163, 175, 0.3);
  background: rgba(20, 30, 50, 0.6);
  color: #9ca3af;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.poi-toggle:disabled {
  cursor: default;
  border-color: rgba(255, 0, 127, 0.6);
  background: rgba(255, 0, 127, 0.12);
  color: #f472b6;
}

.poi-toggle-tour.active {
  border-color: #22d3ee;
  background: rgba(34, 211, 238, 0.15);
  color: #22d3ee;
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
}

.poi-toggle-lodging.active {
  border-color: #facc15;
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.3);
}

.poi-toggle:not(.active):not(:disabled):hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #d1d5db;
}

.map-container {
  flex: 1;
  margin: 16px 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 0, 127, 0.2);
  overflow: hidden;
  min-height: 560px;
  height: 100%;
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
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  color: #f472b6;
  font-weight: 700;
  font-size: 1.2rem;
  margin-top: 4px;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.3);
}
</style>

<style>
.marker-info {
  padding: 10px 12px;
  font-size: 0.85rem;
  line-height: 1.5;
  max-width: 220px;
}

.marker-info .info-title {
  display: block;
  cursor: pointer;
  color: #d6336c;
  text-decoration: underline;
  text-underline-offset: 2px;
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
  background: #10192e;
  border: 1px solid var(--poi-accent, #ff007f);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: inherit;
}

.poi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--poi-accent, #ff007f);
}

.poi-card-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #0b0f19;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.poi-card-close {
  border: none;
  background: transparent;
  color: #0b0f19;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
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
  font-size: 0.92rem;
  font-weight: 700;
  color: #f3f4f6;
  line-height: 1.3;
}

.poi-card-addr,
.poi-card-tel {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #d1d5db;
  line-height: 1.4;
}

.poi-card-tel.muted {
  color: #6b7280;
}
</style>
