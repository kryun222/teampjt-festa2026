<script setup>
import { computed } from 'vue'
import { analyticsInsights } from '@/analytics/insights'

import KpiCard from '@/analytics/components/KpiCard.vue'
import CrossDataAnalysis from '@/analytics/components/CrossDataAnalysis.vue'

const kpis = computed(() => [
  {
    // 새로 추가: 가장 빨리 열리는 예정 축제를 D-day로 보여줍니다.
    // 아래 CrossDataAnalysis.vue의 "다가오는 축제" 카드와 같은 데이터를
    // 헤드라인으로 한 번 더 요약해서 보여주는 것입니다.
    title: '다가오는 축제',
    value: analyticsInsights.upcomingFestivals[0]?.title || 'N/A',
    subtitle: analyticsInsights.upcomingFestivals[0]
      ? `D-${analyticsInsights.upcomingFestivals[0].dDay}`
      : '예정된 축제 없음',
  },
  {
    // 관광지+축제+코스를 합산한 "콘텐츠 밀집도" 1위 구입니다.
    title: '가장 볼거리 많은 구',
    value: analyticsInsights.districtScore[0]?.name || '미등록',
    subtitle: `콘텐츠 ${analyticsInsights.districtScore[0]?.contentScore || 0}건`,
  },
  {
    title: '가장 활발한 축제월',
    value: analyticsInsights.topFestivalMonth?.month || 'N/A',
    subtitle: `${analyticsInsights.topFestivalMonth?.count || 0}건`,
  },
  {
    // eventstartdate/eventenddate로 "오늘 진행 중인 축제"를 실시간(페이지를
    // 새로고침할 때마다 오늘 날짜 기준으로 재계산)으로 보여줍니다.
    title: '지금 진행 중인 축제',
    value: `${analyticsInsights.ongoingFestivalCount}건`,
    subtitle: analyticsInsights.ongoingFestivals[0]?.title || '진행 중인 축제 없음',
  },
])
</script>

<template>
  <section class="space-y-6">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        v-for="card in kpis"
        :key="card.title"
        :title="card.title"
        :value="card.value"
        :subtitle="card.subtitle"
      />
    </div>

    <CrossDataAnalysis />
  </section>
</template>
