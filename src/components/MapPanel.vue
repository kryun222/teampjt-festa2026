<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  festivals: { type: Array, default: () => [] },
})

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])

// 마커 생성
function createMarkers() {
  if (!map.value) return
  
  // 기존 마커 제거
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []
  
  // 새로운 마커 생성
  props.festivals.forEach(festival => {
    const markerPosition = new kakao.maps.LatLng(
      parseFloat(festival.mapy),
      parseFloat(festival.mapx)
    )
    
    const marker = new kakao.maps.Marker({
      position: markerPosition,
      title: festival.title,
      image: createMarkerImage(),
    })
    
    marker.setMap(map.value)
    
    // 마커 클릭 시 정보창 표시
    kakao.maps.event.addListener(marker, 'click', () => {
      showMarkerInfo(festival, marker)
    })
    
    markers.value.push(marker)
  })
}

// 커스텀 마커 이미지
function createMarkerImage() {
  const imageSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 10 16 24 16 24s16-14 16-24c0-8.8-7.2-16-16-16z" fill="%23ff007f"/><circle cx="16" cy="16" r="5" fill="white"/></svg>'
  const imageSize = new kakao.maps.Size(32, 40)
  const imageOption = { offset: new kakao.maps.Point(16, 40) }
  
  return new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)
}

// 마커 정보창
function showMarkerInfo(festival, marker) {
  const content = `
    <div class="marker-info">
      <strong>${festival.title}</strong>
      <p>${festival.addr1} ${festival.addr2}</p>
      ${festival.tel ? `<p>☎ ${festival.tel}</p>` : ''}
    </div>
  `
  
  const infowindow = new kakao.maps.InfoWindow({
    content: content,
    removable: true,
  })
  
  infowindow.open(map.value, marker)
}

// 지도 초기화
function initMap() {
  if (!mapContainer.value) return
  
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
    level: 9,
  }
  
  map.value = new kakao.maps.Map(mapContainer.value, options)
  
  // 축제 마커 생성
  createMarkers()
}

onMounted(() => {
  // 카카오 맵 로드 확인
  function checkKakaoMap() {
    if (window.kakao && window.kakao.maps) {
      initMap()
    } else {
      // 아직 로드 안 됨, 100ms 후 다시 확인
      setTimeout(checkKakaoMap, 100)
    }
  }
  
  checkKakaoMap()
})

// 축제 목록 변경 시 마커 업데이트
watch(() => props.festivals, () => {
  if (map.value) {
    createMarkers()
  }
})
</script>

<template>
  <div class="map-panel">
    <div class="map-info">
      <h3 class="neon-text">서울 축제 지도</h3>
      <p>축제 위치를 지도에서 확인하세요</p>
    </div>
    
    <div ref="mapContainer" class="map-container"></div>
    
    <div class="quick-info">
      <div class="info-item">
        <span class="label">표시된 마커</span>
        <span class="value">{{ festivals.length }}개</span>
      </div>
      <div class="info-item">
        <span class="label">지역</span>
        <span class="value">서울 전체</span>
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
  min-height: 520px;
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
  text-shadow: 0 0 10px #ff007f, 0 0 20px #ff007f;
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

.map-container {
  flex: 1;
  margin: 16px 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 0, 127, 0.2);
  overflow: hidden;
  min-height: 300px;
  height: 100%;
}

.map-placeholder {
  flex: 1;
  background: radial-gradient(circle, rgba(255, 0, 127, 0.05) 0%, rgba(123, 44, 191, 0.03) 100%);
  border: 1px solid rgba(255, 0, 127, 0.2);
  border-radius: 12px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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