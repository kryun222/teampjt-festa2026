<script setup>
import { computed, ref } from 'vue'
import { analyticsInsights } from '@/analytics/insights'

const emit = defineEmits(['navigate-calendar'])

function goToFestivalCalendar() {
  emit('navigate-calendar', {
    type: 'current',
  })
}

// ============================================================================
// 1. 서브탭
// ============================================================================
const subTabs = [
  {
    id: 'now',
    label: '지금',
  },
  {
    id: 'where',
    label: '어디로',
  },
  {
    id: 'when',
    label: '언제',
  },
  {
    id: 'news',
    label: '최신 소식',
  },
]

const activeSubTab = ref('now')

// ============================================================================
// 2. 분석 데이터 연결
// ============================================================================
const monthlyData = computed(() => analyticsInsights.festivalMonthlySummary)

const seasonalSummary = computed(() => analyticsInsights.seasonalSummary)

const districtRanking = computed(() => analyticsInsights.districtScore.slice(0, 5))

const supplyGap = computed(() => analyticsInsights.supplyGapDistricts.slice(0, 3))

const courseGap = computed(() => analyticsInsights.courseGapDistricts.slice(0, 3))

const ongoingFestivals = computed(() => analyticsInsights.ongoingFestivals.slice(0, 5))

const ongoingFestivalCount = computed(() => analyticsInsights.ongoingFestivalCount)

const upcomingFestivals = computed(() => analyticsInsights.upcomingFestivals)

const freeFestivalCount = computed(() => analyticsInsights.freeFestivalCount)

const freeFestivalRate = computed(() => analyticsInsights.freeFestivalRate)

const totalFestivalCount = computed(
  () => analyticsInsights.contentTypeSummary.find((item) => item.label === '축제·행사')?.count || 0,
)

const currentSeason = computed(() => analyticsInsights.currentSeason)

const seasonalDistrictRanking = computed(() => analyticsInsights.seasonalDistrictRanking)

// ============================================================================
// 3. 계절 선택
// ============================================================================
const selectedSeason = ref(analyticsInsights.currentSeason)

const selectedSeasonDistrictRanking = computed(
  () => seasonalDistrictRanking.value[selectedSeason.value] || [],
)

// ============================================================================
// 4. 오늘의 추천
// ============================================================================
const todayRecommendation = computed(() => analyticsInsights.todayRecommendation)

// ============================================================================
// 5. 어디로 탭의 선택 구
// ============================================================================
const selectedDistrictName = ref(districtRanking.value[0]?.name || '')

const selectedDistrictDetail = computed(() => {
  if (!selectedDistrictName.value) {
    return null
  }

  return analyticsInsights.districtDetails[selectedDistrictName.value] || null
})

function selectDistrict(districtName) {
  selectedDistrictName.value = districtName
}

// ============================================================================
// 6. 차트 스케일
// ============================================================================
const maxContentScore = computed(() =>
  Math.max(...districtRanking.value.map((district) => district.contentScore), 1),
)

const maxMonthlyCount = computed(() =>
  Math.max(...monthlyData.value.map((month) => month.count), 1),
)

// ============================================================================
// 7. 화면 표시용 상수
// ============================================================================
const SEASON_ICON = {
  봄: '🌸',
  여름: '☀️',
  가을: '🍁',
  겨울: '❄️',
}

const DONUT_RADIUS = 60

const donutCircumference = 2 * Math.PI * DONUT_RADIUS

const donutDashoffset = computed(() => donutCircumference * (1 - freeFestivalRate.value / 100))
</script>

<template>
  <section class="space-y-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
    <!-- 제목 -->
    <div class="mb-2">
      <h3 class="text-xl font-semibold text-white">여행 인사이트 한눈에 보기</h3>

      <p class="mt-1 text-sm text-gray-400">
        관광지·숙박·코스·축제 데이터를 종합해서 알려드립니다.
      </p>
    </div>

    <!-- 서브탭 -->
    <div class="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
      <button
        v-for="tab in subTabs"
        :key="tab.id"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-medium transition"
        :class="
          activeSubTab === tab.id
            ? 'bg-pink-500/20 text-pink-400'
            : 'text-gray-400 hover:text-white'
        "
        @click="activeSubTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ================================================================ -->
    <!-- 지금 탭 -->
    <!-- ================================================================ -->
    <div v-show="activeSubTab === 'now'" class="space-y-6">
      <!-- 오늘의 추천 축제 -->
      <article
        v-if="todayRecommendation.festival"
        class="relative flex min-h-[180px] flex-col justify-end overflow-hidden rounded-2xl border border-pink-500/30 p-6"
      >
        <div
          v-if="todayRecommendation.festival.image"
          class="absolute inset-0 bg-cover bg-center"
          :style="{
            backgroundImage: `linear-gradient(to bottom, rgba(11,15,25,0.25), rgba(11,15,25,0.95)), url('${todayRecommendation.festival.image}')`,
          }"
        ></div>

        <div class="relative z-10 space-y-1">
          <span
            class="inline-block w-fit rounded-full border border-pink-500 bg-pink-500/20 px-3 py-1 text-xs font-bold tracking-wide text-pink-400"
          >
            오늘의 추천 · {{ todayRecommendation.district }}
          </span>

          <h4 class="text-2xl font-bold text-white">
            {{ todayRecommendation.festival.title }}
          </h4>

          <p v-if="todayRecommendation.festival.eventplace" class="text-sm text-gray-300">
            {{ todayRecommendation.festival.eventplace }}
          </p>

          <p class="text-xs text-emerald-400">
            ~{{ todayRecommendation.festival.eventenddate.slice(4, 6) }}/{{
              todayRecommendation.festival.eventenddate.slice(6, 8)
            }}까지
          </p>
        </div>
      </article>

      <p v-else class="text-sm text-gray-500">
        오늘은 진행 중인 축제가 없지만,
        {{ todayRecommendation.district }}를 둘러보세요.
      </p>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <!-- 오늘의 숙소 팁 -->
        <article class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/80">
          <img
            v-if="todayRecommendation.lodging?.firstimage"
            :src="todayRecommendation.lodging.firstimage"
            :alt="todayRecommendation.lodging.title || '추천 숙소'"
            class="h-28 w-full object-cover"
          />

          <div
            v-else
            class="flex h-28 w-full items-center justify-center bg-gray-800 text-sm text-gray-500"
          >
            등록된 숙소 이미지가 없습니다.
          </div>

          <div class="p-4">
            <p class="text-xs text-purple-300">추천 숙소 · {{ todayRecommendation.district }}</p>

            <h4 class="mt-1 text-lg font-semibold text-white">오늘의 숙소 팁</h4>

            <p class="mt-2 text-sm leading-6 text-gray-300">
              {{ todayRecommendation.lodgingNote }}
            </p>
          </div>
        </article>

        <!-- 오늘의 추천 카테고리 -->
        <article
          v-if="todayRecommendation.category"
          class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/80"
        >
          <img
            v-if="todayRecommendation.category.image"
            :src="todayRecommendation.category.image"
            :alt="todayRecommendation.category.title"
            class="h-28 w-full object-cover"
          />

          <div
            v-else
            class="flex h-28 w-full items-center justify-center bg-gray-800 text-sm text-gray-500"
          >
            등록된 대표 이미지가 없습니다.
          </div>

          <div class="p-4">
            <p class="text-xs text-gray-500">
              {{ todayRecommendation.category.label }} ·
              {{ todayRecommendation.category.district }}
            </p>

            <p class="truncate text-sm font-semibold text-white">
              {{ todayRecommendation.category.title || '정보 없음' }}
            </p>
          </div>
        </article>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 어디로 탭 -->
    <!-- ================================================================ -->
    <div v-show="activeSubTab === 'where'" class="space-y-6">
      <!-- 1. 볼거리 많은 구 선택기 -->
      <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h4 class="mb-1 text-lg font-semibold text-white">볼거리 많은 구 TOP 5</h4>

        <p class="mb-4 text-xs leading-5 text-gray-500">
          관광지·축제·여행코스 등록 건수를 기준으로 보여드립니다. 구를 선택하면 아래 여행 정보가
          바뀝니다.
        </p>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <button
            v-for="(item, index) in districtRanking"
            :key="item.name"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
            :class="
              selectedDistrictName === item.name
                ? 'border-pink-500/70 bg-pink-500/10 ring-1 ring-pink-500/30'
                : 'border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/80'
            "
            :aria-pressed="selectedDistrictName === item.name"
            @click="selectDistrict(item.name)"
          >
            <span
              class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="
                selectedDistrictName === item.name
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-800 text-gray-400'
              "
            >
              {{ index + 1 }}
            </span>

            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              class="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
            />

            <div v-else class="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-800"></div>

            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span
                  class="font-medium"
                  :class="selectedDistrictName === item.name ? 'text-pink-300' : 'text-gray-300'"
                >
                  {{ item.name }}
                </span>

                <span class="font-semibold text-white"> {{ item.contentScore }}건 </span>
              </div>

              <div class="h-2 w-full rounded-full bg-gray-800">
                <div
                  class="h-2 rounded-full bg-gradient-to-r from-pink-600 to-pink-400"
                  :style="{
                    width: `${(item.contentScore / maxContentScore) * 100}%`,
                  }"
                ></div>
              </div>
            </div>
          </button>
        </div>
      </article>

      <!-- 2. 선택 구 상세 정보 -->
      <article
        v-if="selectedDistrictDetail"
        class="space-y-6 rounded-2xl border border-pink-500/30 bg-gray-950/80 p-6"
      >
        <!-- 선택 지역 제목 및 건수 -->
        <div
          class="flex flex-col gap-3 border-b border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p class="text-xs font-semibold text-pink-400">선택한 지역</p>

            <h4 class="mt-1 text-2xl font-bold text-white">
              {{ selectedDistrictDetail.name }} 여행 정보
            </h4>

            <p class="mt-2 text-sm text-gray-400">
              선택한 구에 실제로 등록된 데이터만 보여드립니다.
            </p>
          </div>

          <div class="flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-pink-500/10 px-3 py-1 text-pink-300">
              관광지 {{ selectedDistrictDetail.summary.attractionCount }}건
            </span>

            <span class="rounded-full bg-amber-500/10 px-3 py-1 text-amber-300">
              축제 {{ selectedDistrictDetail.summary.festivalCount }}건
            </span>

            <span class="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300">
              코스 {{ selectedDistrictDetail.summary.courseCount }}건
            </span>

            <span class="rounded-full bg-purple-500/10 px-3 py-1 text-purple-300">
              숙소 {{ selectedDistrictDetail.summary.lodgingCount }}건
            </span>
          </div>
        </div>

        <!-- 숙소 + 여행코스 -->
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <!-- 선택 구 추천 숙소 -->
          <div class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60">
            <img
              v-if="selectedDistrictDetail.lodging?.firstimage"
              :src="selectedDistrictDetail.lodging.firstimage"
              :alt="selectedDistrictDetail.lodging.title"
              class="h-36 w-full object-cover"
            />

            <div
              v-else
              class="flex h-36 items-center justify-center bg-gray-800 text-sm text-gray-500"
            >
              등록된 숙소 이미지가 없습니다.
            </div>

            <div class="p-4">
              <p class="text-xs font-medium text-purple-300">추천 숙소</p>

              <h5 class="mt-1 text-base font-semibold text-white">
                {{ selectedDistrictDetail.lodging?.title || '등록된 숙소가 없습니다.' }}
              </h5>

              <p class="mt-2 text-sm leading-6 text-gray-400">
                {{ selectedDistrictDetail.lodgingNote }}
              </p>
            </div>
          </div>

          <!-- 선택 구 추천 여행코스 -->
          <div class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60">
            <img
              v-if="selectedDistrictDetail.course?.firstimage"
              :src="selectedDistrictDetail.course.firstimage"
              :alt="selectedDistrictDetail.course.title"
              class="h-36 w-full object-cover"
            />

            <div
              v-else
              class="flex h-36 items-center justify-center bg-gray-800 text-sm text-gray-500"
            >
              등록된 여행코스 이미지가 없습니다.
            </div>

            <div class="p-4">
              <p class="text-xs font-medium text-cyan-300">추천 여행코스</p>

              <h5 class="mt-1 text-base font-semibold text-white">
                {{ selectedDistrictDetail.course?.title || '등록된 여행코스가 없습니다.' }}
              </h5>

              <p class="mt-2 text-sm leading-6 text-gray-400">
                {{ selectedDistrictDetail.courseNote }}
              </p>
            </div>
          </div>
        </div>

        <!-- 선택 구 카테고리 대표 스팟 -->
        <div>
          <h5 class="text-lg font-semibold text-white">
            {{ selectedDistrictDetail.name }} 카테고리 대표 스팟
          </h5>

          <p class="mt-1 text-xs leading-5 text-gray-500">
            관광지·숙박·여행코스·축제 데이터에서 선택한 구의 대표 항목을 보여드립니다.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="item in selectedDistrictDetail.categoryHighlights"
              :key="item.label"
              class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/70"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="h-24 w-full object-cover"
              />

              <div
                v-else
                class="flex h-24 items-center justify-center bg-gray-800 text-xs text-gray-500"
              >
                이미지 없음
              </div>

              <div class="p-3">
                <p class="text-[11px] text-gray-500">{{ item.label }} · {{ item.district }}</p>

                <p class="mt-1 truncate text-sm font-semibold text-white">
                  {{ item.title || '등록된 정보가 없습니다.' }}
                </p>

                <p v-if="item.address" class="mt-1 truncate text-xs text-gray-500">
                  {{ item.address }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      <!-- 3. 서울 전체 기준 보조 분석 -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <!-- 전체 서울 기준 숙박 격차 -->
        <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
          <h4 class="mb-1 text-lg font-semibold text-white">숙소는 여유 있게 알아보세요</h4>

          <p class="mb-4 text-xs leading-5 text-gray-500">
            서울 전체 데이터에서 볼거리에 비해 숙소 등록 건수가 상대적으로 적은 구예요.
          </p>

          <div class="space-y-3">
            <div
              v-for="item in supplyGap"
              :key="item.name"
              class="rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-gray-300">
                  {{ item.name }}
                </span>

                <span class="text-right font-semibold text-purple-300">
                  볼거리 {{ item.contentScore }}건 · 숙소 {{ item.lodgingCount }}건
                </span>
              </div>
            </div>

            <p v-if="supplyGap.length === 0" class="text-sm text-gray-500">
              숙소가 부족해 보이는 지역은 없어요.
            </p>
          </div>
        </article>

        <!-- 전체 서울 기준 코스 공백 -->
        <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
          <h4 class="mb-1 text-lg font-semibold text-white">숨은 명소, 나만의 코스 만들기</h4>

          <p class="mb-4 text-xs leading-5 text-gray-500">
            서울 전체 데이터에서 정해진 코스는 없지만 관광지가 많은 구예요.
          </p>

          <div class="space-y-3">
            <div
              v-for="item in courseGap"
              :key="item.name"
              class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 p-3"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name"
                class="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
              />

              <div v-else class="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-800"></div>

              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-300">
                  {{ item.name }}
                </p>

                <p class="text-xs font-semibold text-cyan-300">
                  관광지 {{ item.attractionCount }}건 · 코스 0건
                </p>
              </div>
            </div>

            <p v-if="courseGap.length === 0" class="text-sm text-gray-500">
              모든 구에 여행 코스가 준비되어 있어요.
            </p>
          </div>
        </article>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 언제 탭 -->
    <!-- ================================================================ -->
    <div v-show="activeSubTab === 'when'" class="space-y-6">
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <!-- 무료 축제 도넛 -->
        <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
          <h4 class="mb-4 text-lg font-semibold text-white">무료로 즐길 수 있는 축제</h4>

          <div class="relative mx-auto h-40 w-40">
            <svg viewBox="0 0 160 160" class="h-40 w-40 -rotate-90">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#374151" stroke-width="16" />

              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#f59e0b"
                stroke-width="16"
                stroke-linecap="round"
                :stroke-dasharray="donutCircumference"
                :stroke-dashoffset="donutDashoffset"
              />
            </svg>

            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-bold text-white"> {{ freeFestivalRate }}% </span>

              <span class="text-xs text-gray-500"> 무료 </span>
            </div>
          </div>

          <p class="mt-4 text-center text-xs text-gray-500">
            축제·행사 {{ totalFestivalCount }}건 중 {{ freeFestivalCount }}건이 무료예요.
          </p>
        </article>

        <!-- 계절별 축제 분포 -->
        <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
          <h4 class="mb-4 text-lg font-semibold text-white">계절별 축제 분포</h4>

          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="item in seasonalSummary"
              :key="item.season"
              type="button"
              class="rounded-xl border p-4 text-center transition"
              :class="
                item.season === selectedSeason
                  ? 'border-orange-500/60 bg-orange-500/10'
                  : 'border-gray-800 bg-gray-900/70 hover:border-gray-700'
              "
              @click="selectedSeason = item.season"
            >
              <p class="text-2xl">
                {{ SEASON_ICON[item.season] }}
              </p>

              <p class="mt-1 text-sm text-gray-300">
                {{ item.season }}
              </p>

              <p class="text-xl font-bold text-white">{{ item.count }}건</p>

              <span
                v-if="item.season === currentSeason"
                class="mt-1 inline-block rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400"
              >
                지금
              </span>
            </button>
          </div>
        </article>
      </div>

      <!-- 선택 계절 인기 구 -->
      <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h4 class="mb-1 text-lg font-semibold text-white">{{ selectedSeason }} 인기 구</h4>

        <p class="mb-4 text-xs text-gray-500">
          {{ selectedSeason }}에 축제가 많이 열리는 구를 모아봤어요.
        </p>

        <div class="space-y-2">
          <div
            v-for="(item, index) in selectedSeasonDistrictRanking"
            :key="item.name"
            class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2.5"
          >
            <span
              class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="index === 0 ? 'bg-amber-400 text-gray-900' : 'bg-gray-800 text-gray-400'"
            >
              {{ index + 1 }}
            </span>

            <span class="flex-1 text-sm text-gray-300">
              {{ item.name }}
            </span>

            <span class="text-sm font-semibold text-white"> {{ item.count }}건 </span>
          </div>

          <p v-if="selectedSeasonDistrictRanking.length === 0" class="text-sm text-gray-500">
            {{ selectedSeason }} 축제 정보가 아직 없어요.
          </p>
        </div>
      </article>

      <!-- 월별 축제 개최 현황 -->
      <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <div class="mb-4 flex items-center justify-between">
          <h4 class="text-lg font-semibold text-white">월별 축제 개최 현황</h4>

          <span class="text-xs text-gray-500"> 최대 {{ maxMonthlyCount }}건 </span>
        </div>

        <div class="flex h-32 items-end gap-2">
          <div
            v-for="item in monthlyData"
            :key="item.month"
            class="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div
              class="w-full rounded-t-lg bg-gradient-to-t from-pink-700 to-pink-500"
              :style="{
                height: `${(item.count / maxMonthlyCount) * 100}%`,
              }"
            ></div>

            <span class="text-[11px] text-gray-500">
              {{ item.month }}
            </span>
          </div>
        </div>
      </article>
    </div>

    <!-- ================================================================ -->
    <!-- 최신 소식 탭 -->
    <!-- ================================================================ -->
    <div v-show="activeSubTab === 'news'" class="space-y-6">
      <!-- 진행 중인 축제 -->
      <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <div class="mb-4 flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            ></span>

            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>

          <h4 class="text-lg font-semibold text-white">
            지금 진행 중인 축제 {{ ongoingFestivalCount }}건
          </h4>
        </div>

        <div class="space-y-2">
          <div
            v-for="item in ongoingFestivals"
            :key="`${item.title}-${item.eventenddate}`"
            class="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-3"
          >
            <div class="min-w-0">
              <p class="truncate text-sm text-gray-200">
                {{ item.title }}
              </p>

              <p v-if="item.eventplace" class="truncate text-xs text-gray-500">
                {{ item.eventplace }}
              </p>
            </div>

            <span class="ml-3 whitespace-nowrap text-xs text-emerald-400">
              ~{{ item.eventenddate.slice(4, 6) }}/{{ item.eventenddate.slice(6, 8) }}까지
            </span>
          </div>

          <p v-if="ongoingFestivalCount === 0" class="text-sm text-gray-500">
            지금 진행 중인 축제는 없어요.
          </p>
        </div>
      </article>

      <!-- 다가오는 축제 -->
      <article class="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
        <h4 class="mb-4 text-lg font-semibold text-white">다가오는 축제</h4>

        <div class="space-y-3">
          <div
            v-for="item in upcomingFestivals"
            :key="`${item.title}-${item.dDay}`"
            class="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-3"
          >
            <div class="min-w-0">
              <p class="truncate text-sm text-gray-200">
                {{ item.title }}
              </p>

              <p v-if="item.eventplace" class="truncate text-xs text-gray-500">
                {{ item.eventplace }}
              </p>
            </div>

            <span
              class="ml-2 flex-shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400"
            >
              D-{{ item.dDay }}
            </span>
          </div>

          <p v-if="upcomingFestivals.length === 0" class="text-sm text-gray-500">
            예정된 축제 정보가 없어요.
          </p>
        </div>
      </article>

      <!-- 축제 캘린더 이동 -->
      <div class="flex justify-center border-t border-gray-800 pt-6">
        <button
          type="button"
          class="group flex w-full items-center justify-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-5 py-3 text-sm font-semibold text-pink-300 transition duration-200 hover:-translate-y-0.5 hover:border-pink-400 hover:bg-pink-500/20 hover:text-pink-200 hover:shadow-[0_0_24px_rgba(236,72,153,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/70 sm:w-auto"
          @click="goToFestivalCalendar"
        >
          <span> 축제 캘린더에서 전체 일정 보기 </span>

          <span class="transition-transform duration-200 group-hover:translate-x-1"> → </span>
        </button>
      </div>
    </div>
  </section>
</template>
