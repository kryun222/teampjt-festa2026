<script setup>
defineProps({
  festivals: { type: Array, default: () => [] },
  selectedFestivalId: { type: String, default: null },
})

function formatDate(dateStr) {
  if (!dateStr || dateStr.length < 8) return '일정 미정'
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
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
        <h3>{{ festival.title }}</h3>
        <p class="festival-date">📅 {{ formatDate(festival.modifiedtime) }}</p>
        <p class="festival-addr">📍 {{ festival.addr1 }} {{ festival.addr2 }}</p>
        <p class="festival-tel">☎ {{ festival.tel || '전화번호 없음' }}</p>
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

.festival-info h3 {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #f472b6;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 0, 127, 0.3);
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

@media (max-width: 768px) {
  .festival-card {
    grid-template-columns: 1fr;
  }

  .festival-thumb {
    height: 250px;
  }
}
</style>