<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  festivals: { type: Array, default: () => [] },
})

const mapContainer = ref(null)
let map = null
let markers = []

function loadKakao() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) return resolve(window.kakao)

    const script = document.createElement('script')
    script.src =
      '//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&autoload=false'
    script.onload = () => {
      if (window.kakao) resolve(window.kakao)
      else reject(new Error('Kakao API load failed'))
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function createMap() {
  const center = new window.kakao.maps.LatLng(37.5665, 126.9780)
  map = new window.kakao.maps.Map(mapContainer.value, {
    center,
    level: 7,
  })
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

function updateMarkers() {
  if (!map) return
  clearMarkers()

  props.festivals.forEach((item) => {
    const lat = parseFloat(item.mapy)
    const lng = parseFloat(item.mapx)
    if (!lat || !lng) return

    const position = new window.kakao.maps.LatLng(lat, lng)
    const marker = new window.kakao.maps.Marker({ position })
    marker.setMap(map)
    markers.push(marker)
  })

  if (markers.length > 0) {
    const bounds = new window.kakao.maps.LatLngBounds()
    markers.forEach((marker) => bounds.extend(marker.getPosition()))
    map.setBounds(bounds)
  }
}

onMounted(async () => {
  const kakao = await loadKakao()
  kakao.maps.load(() => {
    createMap()
    updateMarkers()
  })
})

watch(
  () => props.festivals,
  () => updateMarkers(),
  { deep: true }
)
</script>

<template>
  <div class="map-panel">
    <div class="map-info">
      <div>
        <h3>서울 축제 지도</h3>
        <p>선택된 축제 위치를 핀으로 표시합니다.</p>
      </div>
    </div>
    <div ref="mapContainer" class="map-box" />
  </div>
</template>

<style scoped>
.map-panel {
  background: #ffffff;
  border-radius: 24px;
  padding: 18px;
  min-height: 520px;
  box-shadow: 0 24px 60px rgba(34, 56, 99, 0.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.map-info h3 {
  margin: 0;
  font-size: 1.2rem;
}

.map-info p {
  margin: 6px 0 0;
  color: #6b7280;
}

.map-box {
  flex: 1;
  min-height: 420px;
  border-radius: 18px;
  overflow: hidden;
}
</style>