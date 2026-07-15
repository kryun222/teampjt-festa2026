<script setup>
import { ref } from 'vue'

defineProps({
  festivals: { type: Array, default: () => [] },
  selectedFestivalId: { type: String, default: null },
})

function formatYmd(dateStr) {
  if (!dateStr || dateStr.length < 8) return null
  return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`
}

// 축제 기간 표시 (시작일 ~ 종료일, 종료일 없거나 시작일과 같으면 하루만 표시)
function formatDateRange(festival) {
  const start = formatYmd(festival.eventstartdate)
  if (!start) return '일정 미정'

  const end = formatYmd(festival.eventenddate)
  if (!end || end === start) return start

  return `${start} ~ ${end}`
}

// eventhomepage가 데이터에 실질적으로 비어있어서, 좌표 기반 카카오맵 길찾기 링크로 대체
function kakaoMapLink(festival) {
  if (!festival || !festival.mapx || !festival.mapy) return null
  return `https://map.kakao.com/link/to/${encodeURIComponent(festival.title)},${festival.mapy},${festival.mapx}`
}

// 상세 소개 모달 (행사명 클릭 시)
const selectedDetail = ref(null)

function openDetail(festival) {
  selectedDetail.value = festival
}

function closeDetail() {
  selectedDetail.value = null
}
</script>

<template>
  <div class="festival-list">
    <div v-if="festivals.length === 0" class="empty-state">
      <p>🎪 축제 정보가 없습니다</p>
    </div>

    <div
      v-for="festival in festivals"
      :key="festival.contentid"
      :data-festival-id="festival.contentid"
      class="festival-card"
      :class="{ 'is-selected': selectedFestivalId === festival.contentid }"
    >
      <img
        class="festival-thumb"
        :src="festival.firstimage || 'https://via.placeholder.com/340x220'"
        alt="festival"
      />
      <div class="festival-info">
        <h3 class="festival-title-link" @click="openDetail(festival)">{{ festival.title }}</h3>
        <p class="festival-date">📅 {{ formatDateRange(festival) }}</p>
        <p class="festival-addr">📍 {{ festival.addr1 }} {{ festival.addr2 }}</p>
        <p class="festival-tel">☎ {{ festival.tel || '전화번호 없음' }}</p>
        <a
          v-if="kakaoMapLink(festival)"
          :href="kakaoMapLink(festival)"
          target="_blank"
          rel="noopener noreferrer"
          class="festival-link"
          @click.stop
        >
          🗺️ 카카오맵에서 길찾기
        </a>
      </div>
    </div>

    <!-- 축제 상세 소개 모달 -->
    <div
      v-if="selectedDetail"
      class="detail-modal-backdrop"
      @click.self="closeDetail"
    >
      <div class="detail-modal">
        <button type="button" class="detail-modal-close" @click="closeDetail" aria-label="닫기">×</button>

        <img
          v-if="selectedDetail.firstimage"
          class="detail-modal-img"
          :src="selectedDetail.firstimage"
          alt=""
        />

        <div class="detail-modal-body">
          <h2 class="detail-modal-title">{{ selectedDetail.title }}</h2>

          <div class="detail-modal-meta-grid">
            <p class="detail-modal-meta">📅 {{ formatDateRange(selectedDetail) }}</p>
            <p v-if="selectedDetail.eventplace" class="detail-modal-meta">📍 {{ selectedDetail.eventplace }}</p>
            <p v-if="selectedDetail.playtime" class="detail-modal-meta">🕒 {{ selectedDetail.playtime }}</p>
            <p v-if="selectedDetail.usetimefestival" class="detail-modal-meta">💰 {{ selectedDetail.usetimefestival }}</p>
            <p v-if="selectedDetail.agelimit" class="detail-modal-meta">🔞 {{ selectedDetail.agelimit }}</p>
            <p v-if="selectedDetail.bookingplace" class="detail-modal-meta">🎫 {{ selectedDetail.bookingplace }}</p>
            <p v-if="selectedDetail.sponsor1" class="detail-modal-meta">🏢 {{ selectedDetail.sponsor1 }}</p>
          </div>

          <div class="detail-modal-section">
            <h3>프로그램 안내</h3>
            <p v-if="selectedDetail.program" class="program-text">{{ selectedDetail.program }}</p>
            <p v-else class="detail-modal-empty">상세 프로그램 정보가 제공되지 않았습니다.</p>
          </div>

          <a
            v-if="kakaoMapLink(selectedDetail)"
            :href="kakaoMapLink(selectedDetail)"
            target="_blank"
            rel="noopener noreferrer"
            class="detail-modal-link"
          >
            🗺️ 카카오맵에서 길찾기
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.festival-list {
  display: grid;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 1.1rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed rgba(255, 0, 127, 0.2);
  border-radius: 12px;
}

.festival-card {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 0, 127, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.05);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.festival-card:hover {
  border-color: rgba(255, 0, 127, 0.5);
  background: rgba(15, 23, 42, 0.7);
  box-shadow: 0 0 30px rgba(255, 0, 127, 0.2);
  transform: translateY(-4px);
}

/* 선택된 축제 하이라이트 */
.festival-card.is-selected {
  border-color: #ff007f;
  background: rgba(255, 0, 127, 0.1);
  box-shadow: 0 0 30px rgba(255, 0, 127, 0.4), inset 0 0 20px rgba(255, 0, 127, 0.1);
}

/* 하이라이트 애니메이션 */
.festival-card.highlight {
  animation: highlightPulse 2s ease-out;
}

@keyframes highlightPulse {
  0% {
    box-shadow: 0 0 30px rgba(255, 0, 127, 0.8), inset 0 0 20px rgba(255, 0, 127, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 0, 127, 0.6), inset 0 0 30px rgba(255, 0, 127, 0.2);
  }
  100% {
    box-shadow: 0 0 30px rgba(255, 0, 127, 0.2), inset 0 0 10px rgba(255, 0, 127, 0.05);
  }
}

.festival-thumb {
  width: 100%;
  height: 180px;
  object-fit: cover;
  filter: brightness(0.9);
  transition: filter 0.3s ease;
}

.festival-card:hover .festival-thumb {
  filter: brightness(1.1);
}

.festival-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #f3f4f6;
}

.festival-title-link {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #f472b6;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.3);
  cursor: pointer;
  width: fit-content;
}

.festival-title-link:hover {
  text-decoration: underline;
  color: #ff007f;
}

.festival-info p {
  margin: 6px 0;
  color: #d1d5db;
  font-size: 0.95rem;
  line-height: 1.5;
}

.festival-date {
  font-weight: 700;
  color: #f472b6;
}

.festival-addr,
.festival-tel {
  font-size: 0.9rem;
  color: #9ca3af;
}

.festival-link {
  display: inline-block;
  margin-top: 8px;
  width: fit-content;
  font-size: 0.85rem;
  font-weight: 600;
  color: #22d3ee;
  text-decoration: none;
}

.festival-link:hover {
  text-decoration: underline;
  color: #67e8f9;
}

/* 상세 소개 모달 */
.detail-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 16, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.detail-modal {
  position: relative;
  width: min(640px, 100%);
  max-height: 85vh;
  overflow-y: auto;
  background: #0f1420;
  border: 1px solid rgba(255, 0, 127, 0.4);
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(255, 0, 127, 0.25);
}

.detail-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  z-index: 2;
}

.detail-modal-close:hover {
  background: rgba(255, 0, 127, 0.6);
}

.detail-modal-img {
  display: block;
  width: 100%;
  height: 240px;
  object-fit: cover;
}

.detail-modal-body {
  padding: 24px 28px 28px;
}

.detail-modal-title {
  margin: 0 0 16px;
  font-size: 1.5rem;
  color: #f3f4f6;
  font-weight: 800;
}

.detail-modal-meta-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 0, 127, 0.2);
}

.detail-modal-meta {
  margin: 0;
  color: #d1d5db;
  font-size: 0.92rem;
}

.detail-modal-section h3 {
  margin: 0 0 10px;
  font-size: 1.05rem;
  color: #f472b6;
}

.program-text {
  white-space: pre-line;
  color: #d1d5db;
  font-size: 0.9rem;
  line-height: 1.7;
}

.detail-modal-empty {
  color: #6b7280;
  font-size: 0.9rem;
}

.detail-modal-link {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid #22d3ee;
  color: #22d3ee;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
}

.detail-modal-link:hover {
  background: rgba(34, 211, 238, 0.12);
}

@media (max-width: 768px) {
  .festival-card {
    grid-template-columns: 1fr;
  }

  .festival-thumb {
    height: 250px;
  }
}
</style>