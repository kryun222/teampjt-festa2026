<script setup>
import { computed } from 'vue'
import festivalData from '@/data/서울_축제공연행사.json'
import { analyticsInsights } from '@/analytics/insights'

import KpiCard from '@/analytics/components/KpiCard.vue'
import CrossDataAnalysis from '@/analytics/components/CrossDataAnalysis.vue'

const emit = defineEmits(['navigate-calendar'])

const festivalItems = festivalData.items || []
const currentYear = new Date().getFullYear()

function todayAsYYYYMMDD() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

function findNearestUpcomingFestival() {
  const today = todayAsYYYYMMDD()

  return (
    festivalItems
      .filter((item) => item.eventstartdate && item.eventstartdate > today)
      .sort((a, b) => a.eventstartdate.localeCompare(b.eventstartdate))[0] || null
  )
}

const kpis = computed(() => {
  const upcomingFestival = analyticsInsights.upcomingFestivals[0] || null
  const upcomingFestivalSource = findNearestUpcomingFestival()
  const topDistrict = analyticsInsights.districtScore[0] || null
  const topMonth = analyticsInsights.topFestivalMonth || null

  const topMonthNumber = Number(String(topMonth?.month || '').replace('월', ''))

  return [
    {
      title: '다가오는 축제',
      value: upcomingFestival?.title || 'N/A',
      subtitle: upcomingFestival ? `D-${upcomingFestival.dDay}` : '예정된 축제 없음',
      actionLabel: '축제 보기 →',
      disabled: !upcomingFestivalSource?.contentid,
      request: upcomingFestivalSource?.contentid
        ? {
            type: 'festival',
            contentId: String(upcomingFestivalSource.contentid),
          }
        : null,
    },
    {
      title: '가장 볼거리 많은 구',
      value: topDistrict?.name || '미등록',
      subtitle: `콘텐츠 ${topDistrict?.contentScore || 0}건`,
      actionLabel: '지도에서 보기 →',
      disabled: !topDistrict?.name,
      request: topDistrict?.name
        ? {
            type: 'district',
            districtName: topDistrict.name,
          }
        : null,
    },
    {
      title: '가장 활발한 축제월',
      value: topMonth?.month || 'N/A',
      subtitle: `${topMonth?.count || 0}건`,
      actionLabel: '일정 보기 →',
      disabled: !topMonthNumber,
      request: topMonthNumber
        ? {
            type: 'month',
            year: currentYear,
            month: topMonthNumber,
          }
        : null,
    },
    {
      title: '지금 진행 중인 축제',
      value: `${analyticsInsights.ongoingFestivalCount}건`,
      subtitle: analyticsInsights.ongoingFestivals[0]?.title || '진행 중인 축제 없음',
      actionLabel: '이번 달 보기 →',
      disabled: false,
      request: {
        type: 'current',
      },
    },
  ]
})

function handleCalendarNavigation(request) {
  if (!request?.type) {
    return
  }

  emit('navigate-calendar', request)
}
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
        :action-label="card.actionLabel"
        :disabled="card.disabled"
        @activate="handleCalendarNavigation(card.request)"
      />
    </div>

    <CrossDataAnalysis @navigate-calendar="handleCalendarNavigation" />
  </section>
</template>
