<script setup>
const props = defineProps({
  festivals: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="festival-list">
    <div
      class="festival-card"
      v-for="festival in festivals"
      :key="festival.contentid"
    >
      <img
        class="festival-thumb"
        :src="festival.firstimage || festival.firstimage2 || 'https://via.placeholder.com/340x220'"
        alt="festival"
      />
      <div class="festival-info">
        <h3>{{ festival.title }}</h3>
        <p class="festival-date">
          {{ festival.eventstart || festival.createdtime || festival.modifiedtime }}
        </p>
        <p>{{ festival.addr1 }} {{ festival.addr2 }}</p>
        <p>{{ festival.tel || '전화번호 없음' }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.festival-list {
  display: grid;
  gap: 18px;
}

.festival-card {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(34, 56, 99, 0.08);
  min-height: 170px;
}

.festival-thumb {
  width: 100%;
  object-fit: cover;
}

.festival-info {
  padding: 22px;
}

.festival-info h3 {
  margin: 0 0 10px;
  font-size: 1.25rem;
}

.festival-info p {
  margin: 6px 0;
  color: #475569;
}

.festival-date {
  font-weight: 700;
  color: #1f2937;
}
</style>