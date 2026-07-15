<script setup>
import { nextTick, ref } from 'vue'
import FestivalDashboard from '@/views/FestivalDashboard.vue'

import AnalyticsDashboard from '@/analytics/components/AnalyticsDashboard.vue'
import ChatWidget from '@/components/ChatWidget.vue'

const activeTab = ref('main')
const calendarNavigationRequest = ref(null)

const tabs = [
  {
    id: 'main',
    label: '홈 / 메인',
  },
  {
    id: 'calendar',
    label: '축제 캘린더',
  },
  {
    id: 'community',
    label: '커뮤니티 광장',
  },
  {
    id: 'dashboard',
    label: '데이터 분석',
  },
]

function switchTab(tabId) {
  activeTab.value = tabId

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

async function handleDashboardCalendarNavigation(request) {
  if (!request?.type) return

  // 먼저 캘린더 탭을 표시한 뒤 요청을 전달합니다.
  // 그래야 숨겨져 있던 카카오 지도의 크기와 중심을
  // 정상적으로 다시 계산할 수 있습니다.
  activeTab.value = 'calendar'

  await nextTick()

  calendarNavigationRequest.value = {
    ...request,
    requestId: Date.now(),
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#0b0f19] text-gray-100">
    <!-- ==================== Header ==================== -->
    <header class="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-4"
      >
        <!-- Logo -->
        <button
          type="button"
          class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 neon-text"
          @click="switchTab('main')"
        >
          FESTA 2026
        </button>

        <!-- Navigation -->
        <nav class="flex flex-wrap gap-1 sm:gap-4">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="px-3 sm:px-4 py-2 rounded-lg border-b-2 transition"
            :class="
              activeTab === tab.id
                ? 'text-pink-500 font-bold border-pink-500'
                : 'text-gray-400 hover:text-white border-transparent'
            "
            @click="switchTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <!-- ==================== Main ==================== -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
      <!-- ================================================== -->
      <!-- 1. 홈 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'main'" class="space-y-12">
        <!-- Hero -->
        <div
          class="relative h-[420px] rounded-3xl overflow-hidden neon-border flex items-center justify-center text-center p-6 bg-cover bg-center"
          style="
            background-image:
              linear-gradient(to bottom, rgba(11, 15, 25, 0.25), rgba(11, 15, 25, 0.95)),
              url('https://tong.visitkorea.or.kr/cms/resource/86/4055386_image2_1.jpg');
          "
        >
          <div class="relative z-10 space-y-6">
            <span
              class="inline-block px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500 text-pink-400 text-sm font-bold tracking-widest"
            >
              SEOUL FESTIVAL PORTAL
            </span>

            <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight neon-text text-white">
              서울, 축제의 빛으로 물들다
            </h1>

            <p class="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
              공공데이터를 기반으로 서울에서 개최되는 축제와 행사를 한눈에 확인해 보세요.
            </p>

            <div class="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                class="neon-btn px-6 py-3 rounded-xl font-bold text-white shadow-lg"
                @click="switchTab('calendar')"
              >
                축제 일정 보러가기
              </button>

              <button
                type="button"
                class="bg-gray-800/80 border border-gray-700 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold transition"
                @click="switchTab('dashboard')"
              >
                통계 분석
              </button>
            </div>
          </div>
        </div>

        <!-- 축제 카드 영역 -->
        <div>
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span class="w-2.5 h-6 bg-pink-500 rounded"></span>
            지금 뜨고 있는 서울의 주요 축제
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- 카드 1 -->
            <article
              class="festival-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
            >
              <div class="h-48 overflow-hidden relative">
                <img
                  src="https://tong.visitkorea.or.kr/cms/resource/86/4055386_image2_1.jpg"
                  alt="궁중문화축전"
                  class="w-full h-full object-cover"
                />

                <span
                  class="absolute top-3 left-3 bg-pink-600 text-xs px-2.5 py-1 rounded-full font-bold"
                >
                  ★ Hot
                </span>
              </div>

              <div class="p-5 space-y-3">
                <span class="text-xs text-pink-400 font-bold"> 2026-05-06 </span>

                <h3 class="text-lg font-extrabold text-white">궁중문화축전</h3>

                <p class="text-xs text-gray-400">서울특별시 종로구 사직로 161</p>

                <div
                  class="pt-3 border-t border-gray-800 flex justify-between items-center text-xs"
                >
                  <span class="text-gray-500"> ☎ 1522-2295 </span>

                  <button
                    type="button"
                    class="text-pink-500 hover:underline"
                    @click="switchTab('calendar')"
                  >
                    상세보기 →
                  </button>
                </div>
              </div>
            </article>

            <!-- 카드 2 -->
            <article
              class="festival-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
            >
              <div class="h-48 overflow-hidden relative">
                <img
                  src="https://tong.visitkorea.or.kr/cms/resource/03/4073903_image2_1.jpg"
                  alt="덕수궁 밤의 석조전"
                  class="w-full h-full object-cover"
                />

                <span
                  class="absolute top-3 left-3 bg-purple-600 text-xs px-2.5 py-1 rounded-full font-bold"
                >
                  Night
                </span>
              </div>

              <div class="p-5 space-y-3">
                <span class="text-xs text-pink-400 font-bold"> 2026-06-12 </span>

                <h3 class="text-lg font-extrabold text-white">덕수궁 밤의 석조전</h3>

                <p class="text-xs text-gray-400">서울특별시 중구 세종대로 99</p>

                <div
                  class="pt-3 border-t border-gray-800 flex justify-between items-center text-xs"
                >
                  <span class="text-gray-500"> ☎ 1522-2295 </span>

                  <button
                    type="button"
                    class="text-pink-500 hover:underline"
                    @click="switchTab('calendar')"
                  >
                    상세보기 →
                  </button>
                </div>
              </div>
            </article>

            <!-- 카드 3 -->
            <article
              class="festival-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
            >
              <div class="h-48 overflow-hidden relative">
                <img
                  src="https://tong.visitkorea.or.kr/cms/resource/00/4074600_image2_1.jpg"
                  alt="초안산 수국축제"
                  class="w-full h-full object-cover"
                />

                <span
                  class="absolute top-3 left-3 bg-blue-600 text-xs px-2.5 py-1 rounded-full font-bold"
                >
                  Nature
                </span>
              </div>

              <div class="p-5 space-y-3">
                <span class="text-xs text-pink-400 font-bold"> 2026-06-12 </span>

                <h3 class="text-lg font-extrabold text-white">초안산 수국축제</h3>

                <p class="text-xs text-gray-400">서울특별시 노원구 월계동 산46-3</p>

                <div
                  class="pt-3 border-t border-gray-800 flex justify-between items-center text-xs"
                >
                  <span class="text-gray-500"> ☎ 02-2116-7142 </span>

                  <button
                    type="button"
                    class="text-pink-500 hover:underline"
                    @click="switchTab('calendar')"
                  >
                    상세보기 →
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- ================================================== -->
      <!-- 2. 축제 캘린더 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'calendar'">
        <FestivalDashboard :navigation-request="calendarNavigationRequest" />
      </section>

      <!-- ================================================== -->
      <!-- 3. 커뮤니티 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'community'">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- 게시판 영역 -->
          <div class="lg:col-span-2">
            <div class="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
              <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-white">축제 후기 & 동행 구하기</h2>

                  <p class="text-sm text-gray-400 mt-1">
                    지역 축제에 관한 이야기를 자유롭게 나눠보세요.
                  </p>
                </div>

                <button
                  type="button"
                  class="neon-btn px-4 py-2 rounded-xl text-sm font-bold text-white"
                >
                  글쓰기
                </button>
              </div>

              <!-- 게시글 입력 폼 -->
              <div class="bg-gray-950 p-6 rounded-xl border border-gray-800 space-y-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1"> 작성자 </label>

                    <input
                      type="text"
                      placeholder="작성자"
                      class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1"> 수정용 비밀번호 </label>

                    <input
                      type="password"
                      placeholder="수정 및 삭제 시 사용"
                      class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1"> 제목 </label>

                  <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1"> 내용 </label>

                  <textarea
                    rows="4"
                    placeholder="내용을 입력하세요"
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none resize-y focus:border-pink-500"
                  ></textarea>
                </div>

                <div class="flex justify-end gap-2">
                  <button type="button" class="bg-gray-800 px-4 py-2 rounded-lg text-sm">
                    취소
                  </button>

                  <button
                    type="button"
                    class="bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded-lg text-sm font-bold text-white"
                  >
                    등록하기
                  </button>
                </div>
              </div>

              <!-- 게시글 카드 -->
              <article class="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-3">
                <div class="flex justify-between items-start gap-4">
                  <div>
                    <span class="text-xs text-gray-500 font-mono">
                      작성자: 서울여행자 | 2026-07-14
                    </span>

                    <h3 class="text-base font-bold text-white mt-1">
                      올해 축제 중 가장 추천하는 행사는 무엇인가요?
                    </h3>
                  </div>

                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      class="text-xs text-red-400 bg-red-950/20 px-2 py-1 rounded"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <p class="text-sm text-gray-300">
                  가족과 함께 방문하기 좋은 축제를 추천받고 싶습니다.
                </p>
              </article>
            </div>
          </div>

          <!-- 챗봇 영역 -->
          <aside
            class="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex flex-col h-[520px]"
          >
            <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              서울축제 인공지능 챗봇
            </h3>

            <p class="text-xs text-gray-400 mb-4">찾고 싶은 축제나 장소를 입력해 보세요.</p>

            <div
              class="flex-grow overflow-y-auto bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3 mb-3 text-sm"
            >
              <div class="text-left">
                <span class="inline-block bg-gray-800 p-2.5 rounded-lg text-gray-200">
                  반갑습니다! 저는 축제 가이드 봇입니다.
                </span>
              </div>

              <div class="text-right">
                <span class="inline-block bg-pink-600 p-2.5 rounded-lg text-white">
                  야간 축제를 추천해줘.
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                class="min-w-0 flex-grow bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500"
              />

              <button
                type="button"
                class="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                전송
              </button>
            </div>
          </aside>
        </div>
      </section>

      <!-- ================================================== -->
      <!-- 4. 데이터 분석 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'dashboard'">
        <div class="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <div class="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 class="mb-2 text-2xl font-bold text-white">서울 데이터 분석 대시보드</h2>

              <p class="text-sm text-gray-400">
                서울 관광 데이터를 기반으로 핵심 지표와 주요 패턴을 한눈에 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <AnalyticsDashboard @navigate-calendar="handleDashboardCalendarNavigation" />
        </div>
      </section>
    </main>

    <!-- ==================== Footer ==================== -->
    <footer class="border-t border-gray-800 bg-gray-950 py-6 mt-12">
      <div
        class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500"
      >
        <p>© 2026 SEOUL FESTA. All rights reserved.</p>

        <p>Source Data: 한국관광공사 국문 관광정보 서비스</p>
      </div>
    </footer>
    <ChatWidget />
  </div>
</template>
