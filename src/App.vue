<script setup>
import { ref, computed, nextTick } from 'vue'
import FestivalDashboard from '@/views/FestivalDashboard.vue'

import AnalyticsDashboard from '@/analytics/components/AnalyticsDashboard.vue'
import ChatWidget from '@/components/ChatWidget.vue'

import festivalData from '@/data/서울_축제공연행사.json'

const activeTab = ref('main')
const festivalDashboardRef = ref(null)
const festivals = festivalData.items || []

// 홈에 노출할 추천 축제 (contentid로 JSON에서 직접 조회 -> 날짜 하드코딩 제거)
const FEATURED = [
  { id: '1998564', badge: '★ Hot', badgeClass: 'bg-pink-600' },
  { id: '2756396', badge: 'Night', badgeClass: 'bg-purple-600' },
  { id: '4074598', badge: 'Nature', badgeClass: 'bg-blue-600' },
]

const featuredFestivals = computed(() =>
  FEATURED.map((f) => {
    const festival = festivals.find((item) => item.contentid === f.id)
    return festival ? { ...f, festival } : null
  }).filter(Boolean),
)

function formatYmd(str) {
  if (!str || str.length < 8) return null
  return `${str.slice(0, 4)}.${str.slice(4, 6)}.${str.slice(6, 8)}`
}

function formatDateRange(festival) {
  const start = formatYmd(festival.eventstartdate)
  if (!start) return '일정 미정'
  const end = formatYmd(festival.eventenddate)
  if (!end || end === start) return start
  return `${start} ~ ${end}`
}

// 상세보기 -> 캘린더 탭 이동 + 해당 축제의 달로 이동 + 목록에서 하이라이트
async function goToFestivalDetail(contentId) {
  activeTab.value = 'calendar'
  await nextTick()
  festivalDashboardRef.value?.focusFestival(contentId)
}

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

// --- Community state and handlers ---
const posts = ref([
  {
    id: 1,
    author: '서울여행자',
    title: '올해 축제 중 가장 추천하는 행사는 무엇인가요?',
    content: '가족과 함께 방문하기 좋은 축제를 추천받고 싶습니다.',
    password: 'pass123',
    date: '2026-07-14',
    likes: 3,
    liked: false,
    comments: [
      { id: 1, author: '관리자', text: '좋은 질문이에요!', date: '2026-07-14', password: 'cpass' },
    ],
    showComments: false,
    newCommentAuthor: '',
    newCommentText: '',
    newCommentPassword: '',
    editingCommentId: null,
    editingCommentText: '',
  },
])

const form = ref({
  author: '',
  password: '',
  title: '',
  content: '',
})

const editingId = ref(null)

const pwPrompt = ref({ visible: false, mode: '', post: null, comment: null, input: '' })

function resetForm() {
  form.value = { author: '', password: '', title: '', content: '' }
  editingId.value = null
}

function submitPost() {
  if (!form.value.author || !form.value.title || !form.value.content || !form.value.password) {
    alert('모든 필드를 입력하세요.')
    return
  }

  if (editingId.value === null) {
    posts.value.unshift({
      id: Date.now(),
      author: form.value.author,
      title: form.value.title,
      content: form.value.content,
      password: form.value.password,
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
      liked: false,
      comments: [],
      showComments: false,
      newCommentAuthor: '',
      newCommentText: '',
      newCommentPassword: '',
      editingCommentId: null,
      editingCommentText: '',
    })
    resetForm()
    return
  }

  // apply edit
  const idx = posts.value.findIndex((p) => p.id === editingId.value)
  if (idx !== -1) {
    posts.value[idx].author = form.value.author
    posts.value[idx].title = form.value.title
    posts.value[idx].content = form.value.content
    posts.value[idx].password = form.value.password
  }

  resetForm()
}

function onEditClick(post) {
  pwPrompt.value = { visible: true, mode: 'edit', post, comment: null, input: '' }
}

function onDeleteClick(post) {
  pwPrompt.value = { visible: true, mode: 'delete', post, comment: null, input: '' }
}

function onEditCommentClick(post, comment) {
  pwPrompt.value = { visible: true, mode: 'editComment', post, comment, input: '' }
}

function onDeleteCommentClick(post, comment) {
  pwPrompt.value = { visible: true, mode: 'deleteComment', post, comment, input: '' }
}

function confirmPw() {
  const { post, comment, input, mode } = pwPrompt.value
  if (!post) return hidePwPrompt()

  // determine expected password based on mode
  const expected = (mode === 'editComment' || mode === 'deleteComment') ? (comment && comment.password) : post.password
  if (input !== expected) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  if (mode === 'edit') {
    form.value.author = post.author
    form.value.password = post.password
    form.value.title = post.title
    form.value.content = post.content
    editingId.value = post.id
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (mode === 'delete') {
    if (!confirm('정말 삭제하시겠습니까?')) return
    posts.value = posts.value.filter((p) => p.id !== post.id)
  } else if (mode === 'editComment') {
    if (!comment) return hidePwPrompt()
    // enable inline edit for the comment
    post.editingCommentId = comment.id
    post.editingCommentText = comment.text
  } else if (mode === 'deleteComment') {
    if (!comment) return hidePwPrompt()
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    post.comments = (post.comments || []).filter((c) => c.id !== comment.id)
  }

  hidePwPrompt()
}

function hidePwPrompt() {
  pwPrompt.value = { visible: false, mode: '', post: null, comment: null, input: '' }
}

// Likes and comments
function toggleLike(post) {
  post.liked = !post.liked
  post.likes = post.liked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
}

function toggleComments(post) {
  post.showComments = !post.showComments
}

function addComment(post) {
  const author = (post.newCommentAuthor || '').trim() || '익명'
  const text = (post.newCommentText || '').trim()
  const password = (post.newCommentPassword || '').trim()
  if (!text) {
    alert('댓글 내용을 입력하세요.')
    return
  }
  if (!password) {
    alert('댓글 비밀번호를 입력하세요.')
    return
  }

  const id = Date.now()
  post.comments = post.comments || []
  post.comments.push({ id, author, text, date: new Date().toISOString().slice(0, 10), password })
  post.newCommentAuthor = ''
  post.newCommentText = ''
  post.newCommentPassword = ''
  post.showComments = true
}

function saveEditedComment(post) {
  const id = post.editingCommentId
  if (!id) return
  const idx = (post.comments || []).findIndex((c) => c.id === id)
  if (idx === -1) return
  post.comments[idx].text = post.editingCommentText || post.comments[idx].text
  post.editingCommentId = null
  post.editingCommentText = ''
}

function cancelEditComment(post) {
  post.editingCommentId = null
  post.editingCommentText = ''
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
    <main
      class="flex-grow w-full"
      :class="activeTab === 'main' ? 'px-0 py-0' : 'max-w-7xl mx-auto px-4 py-8'"
    >
      <!-- ================================================== -->
      <!-- 1. 홈 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'main'" class="festival-main-stage relative overflow-hidden">
        <div class="festival-main-stage__wave festival-main-stage__wave--one" aria-hidden="true"></div>
        <div class="festival-main-stage__wave festival-main-stage__wave--two" aria-hidden="true"></div>
        <div class="festival-main-stage__spark festival-main-stage__spark--one" aria-hidden="true"></div>
        <div class="festival-main-stage__spark festival-main-stage__spark--two" aria-hidden="true"></div>
        <div class="festival-main-stage__spark festival-main-stage__spark--three" aria-hidden="true"></div>
        <div class="festival-main-stage__spark festival-main-stage__spark--four" aria-hidden="true"></div>

        <div class="relative z-10 mx-auto max-w-7xl px-4 py-8 space-y-12">
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
                  @click="switchTab('community')"
                >
                  커뮤니티 광장
                </button>

                <button
                  type="button"
                  class="bg-gray-800/80 border border-gray-700 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold transition"
                  @click="switchTab('dashboard')"
                >
                  데이터 분석
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
              <article
                v-for="item in featuredFestivals"
                :key="item.id"
                class="festival-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg"
              >
                <div class="h-48 overflow-hidden relative">
                  <img
                    :src="item.festival.firstimage"
                    :alt="item.festival.title"
                    class="w-full h-full object-cover"
                  />

                  <span
                    class="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-bold"
                    :class="item.badgeClass"
                  >
                    {{ item.badge }}
                  </span>
                </div>

                <div class="p-5 space-y-3">
                  <span class="text-xs text-pink-400 font-bold">
                    {{ formatDateRange(item.festival) }}
                  </span>

                  <h3 class="text-lg font-extrabold text-white">{{ item.festival.title }}</h3>

                  <p class="text-xs text-gray-400">{{ item.festival.addr1 }}</p>

                  <div
                    class="pt-3 border-t border-gray-800 flex justify-between items-center text-xs"
                  >
                    <span class="text-gray-500">☎ {{ item.festival.tel || '정보 없음' }}</span>

                    <button
                      type="button"
                      class="text-pink-500 hover:underline"
                      @click="goToFestivalDetail(item.id)"
                    >
                      상세보기 →
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================== -->
      <!-- 2. 축제 캘린더 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'calendar'">
        <FestivalDashboard
          ref="festivalDashboardRef"
          :navigation-request="calendarNavigationRequest"
        />
      </section>

      <!-- ================================================== -->
      <!-- 3. 커뮤니티 탭 -->
      <!-- ================================================== -->
      <section v-show="activeTab === 'community'">
        <div>
          <!-- 게시판 영역 -->
          <div>
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
                      v-model="form.author"
                      type="text"
                      placeholder="작성자"
                      class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label class="block text-xs text-gray-400 mb-1"> 수정용 비밀번호 </label>

                    <input
                      v-model="form.password"
                      type="password"
                      placeholder="수정 및 삭제 시 사용"
                      class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1"> 제목 </label>

                  <input
                    v-model="form.title"
                    type="text"
                    placeholder="제목을 입력하세요"
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label class="block text-xs text-gray-400 mb-1"> 내용 </label>

                  <textarea
                    v-model="form.content"
                    rows="4"
                    placeholder="내용을 입력하세요"
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white outline-none resize-y focus:border-pink-500"
                  ></textarea>
                </div>

                <div class="flex justify-end gap-2">
                  <button type="button" class="bg-gray-800 px-4 py-2 rounded-lg text-sm" @click="resetForm">
                    취소
                  </button>

                  <button
                    type="button"
                    class="bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded-lg text-sm font-bold text-white"
                    @click="submitPost"
                  >
                    {{ editingId === null ? '등록하기' : '수정완료' }}
                  </button>
                </div>
              </div>

              <!-- 게시글 카드 -->
              <template v-if="posts.length">
                <article v-for="post in posts" :key="post.id" class="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-3 mb-4">
                  <div class="flex justify-between items-start gap-4">
                    <div>
                      <span class="text-xs text-gray-500 font-mono">작성자: {{ post.author }} | {{ post.date }}</span>

                      <h3 class="text-base font-bold text-white mt-1">{{ post.title }}</h3>
                    </div>

                    <div class="flex gap-1.5 items-center">
                      <button type="button" class="text-xs text-yellow-300 bg-gray-800 px-2 py-1 rounded flex items-center gap-1" @click="toggleLike(post)">
                        <span>{{ post.liked ? '💖' : '🤍' }}</span>
                        <span class="text-xs">{{ post.likes || 0 }}</span>
                      </button>

                      <button type="button" class="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded flex items-center justify-center" @click="toggleComments(post)" :aria-pressed="post.showComments">
                        <span class="text-sm">{{ post.showComments ? '▴' : '▾' }}</span>
                      </button>

                      <button type="button" class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded" @click="onEditClick(post)">수정</button>

                      <button type="button" class="text-xs text-red-400 bg-red-950/20 px-2 py-1 rounded" @click="onDeleteClick(post)">삭제</button>
                    </div>
                  </div>

                  <p class="text-sm text-gray-300">{{ post.content }}</p>

                  <div v-if="post.showComments" class="mt-3 border-t border-gray-800 pt-3 space-y-3">
                    <div v-if="post.comments && post.comments.length" class="space-y-2">
                        <div v-for="c in post.comments" :key="c.id" class="text-sm text-gray-300 bg-gray-900 p-2 rounded">
                          <div class="flex justify-between items-start gap-2">
                            <div>
                              <div class="text-xs text-gray-500">{{ c.author }} · {{ c.date }}</div>
                            </div>
                            <div class="flex gap-2">
                              <button class="text-xs text-gray-400 px-2 py-0.5 rounded" @click="onEditCommentClick(post, c)">수정</button>
                              <button class="text-xs text-red-400 px-2 py-0.5 rounded" @click="onDeleteCommentClick(post, c)">삭제</button>
                            </div>
                          </div>

                          <div v-if="post.editingCommentId === c.id" class="mt-2">
                            <textarea v-model="post.editingCommentText" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white outline-none mb-2"></textarea>
                            <div class="flex justify-end gap-2">
                              <button class="bg-gray-800 px-3 py-1 rounded text-sm" @click="cancelEditComment(post)">취소</button>
                              <button class="bg-pink-600 px-3 py-1 rounded text-sm text-white" @click="saveEditedComment(post)">저장</button>
                            </div>
                          </div>

                          <div v-else class="mt-1">{{ c.text }}</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                      <input v-model="post.newCommentAuthor" placeholder="이름(선택)" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white outline-none" />
                      <input v-model="post.newCommentPassword" type="password" placeholder="비밀번호(댓글 수정/삭제용)" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white outline-none" />
                      <textarea v-model="post.newCommentText" rows="2" placeholder="댓글을 입력하세요" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white outline-none"></textarea>
                      <div class="flex justify-end">
                        <button class="bg-pink-600 px-3 py-1 rounded text-sm text-white" @click="addComment(post)">댓글 등록</button>
                      </div>
                    </div>
                  </div>
                </article>
              </template>
              <p v-else class="text-sm text-gray-400">등록된 게시글이 없습니다.</p>

              <!-- 비밀번호 입력 모달 -->
              <div v-if="pwPrompt.visible" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/60" @click="hidePwPrompt"></div>

                <div class="relative bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-md z-10">
                  <h4 class="text-lg font-bold mb-2 text-white">비밀번호 입력</h4>
                  <p class="text-sm text-gray-400 mb-4">이 작업을 진행하려면 비밀번호를 입력하세요.</p>

                  <input v-model="pwPrompt.input" type="password" placeholder="비밀번호" class="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white outline-none mb-4" />

                  <div class="flex justify-end gap-2">
                    <button type="button" class="bg-gray-800 px-3 py-2 rounded text-sm" @click="hidePwPrompt">취소</button>
                    <button type="button" class="bg-pink-600 px-3 py-2 rounded text-sm text-white" @click="confirmPw">확인</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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