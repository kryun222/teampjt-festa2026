import attractionsData from '@/data/서울_관광지.json'
import lodgingData from '@/data/서울_숙박.json'
import courseData from '@/data/서울_여행코스.json'
import festivalData from '@/data/서울_축제공연행사.json'

// ============================================================================
// 1. 서울 25개 구 코드 매핑표
// ============================================================================
const SEOUL_DISTRICT_CODE_MAP = {
  110: '종로구',
  140: '중구',
  170: '용산구',
  200: '성동구',
  215: '광진구',
  230: '동대문구',
  260: '중랑구',
  290: '성북구',
  305: '강북구',
  320: '도봉구',
  350: '노원구',
  380: '은평구',
  410: '서대문구',
  440: '마포구',
  470: '양천구',
  500: '강서구',
  530: '구로구',
  545: '금천구',
  560: '영등포구',
  590: '동작구',
  620: '관악구',
  650: '서초구',
  680: '강남구',
  710: '송파구',
  740: '강동구',
}

function getDistrict(item) {
  return SEOUL_DISTRICT_CODE_MAP[item?.lDongSignguCd] || '미등록'
}

function countByDistrict(items) {
  const map = new Map()

  ;(items || []).forEach((item) => {
    const district = getDistrict(item)
    map.set(district, (map.get(district) || 0) + 1)
  })

  return map
}

function mapToSortedArray(map) {
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

function topOne(map) {
  const sorted = mapToSortedArray(map)

  return {
    topDistrict: sorted[0]?.name || '미등록',
    topDistrictCount: sorted[0]?.count || 0,
  }
}

const attractionItems = attractionsData.items || []
const lodgingItems = lodgingData.items || []
const courseItems = courseData.items || []
const festivalItems = festivalData.items || []

function firstImageInDistrict(items, districtName) {
  const match = items.find((item) => getDistrict(item) === districtName && item.firstimage)

  return match ? match.firstimage : null
}

function representativeImage(districtName) {
  return (
    firstImageInDistrict(attractionItems, districtName) ||
    firstImageInDistrict(festivalItems, districtName) ||
    firstImageInDistrict(courseItems, districtName) ||
    firstImageInDistrict(lodgingItems, districtName) ||
    null
  )
}

/**
 * 해당 구 안에서 화면에 보여줄 대표 항목을 찾습니다.
 *
 * 우선순위:
 * 1. 제목과 이미지가 있는 항목
 * 2. 제목과 주소가 있는 항목
 * 3. 제목이 있는 항목
 *
 * 다른 구의 항목은 대신 반환하지 않습니다.
 */
function findRepresentativeItem(items, districtName) {
  const districtItems = items.filter((item) => getDistrict(item) === districtName && item.title)

  return (
    districtItems.find((item) => item.firstimage) ||
    districtItems.find((item) => item.addr1 || item.eventplace) ||
    districtItems[0] ||
    null
  )
}

function findRecommendedLodging(districtName) {
  return findRepresentativeItem(lodgingItems, districtName)
}

function findRecommendedCourse(districtName) {
  return findRepresentativeItem(courseItems, districtName)
}

/**
 * 원본 데이터를 화면에서 공통으로 사용할 수 있는
 * 대표 스팟 데이터 형태로 변환합니다.
 */
function normalizeSpot(label, item, districtName) {
  return {
    label,
    district: districtName,
    title: item?.title || '',
    image: item?.firstimage || null,
    address: item?.addr1 || item?.eventplace || '',
    available: Boolean(item),
  }
}

/**
 * 특정 구의 관광지·숙박·여행코스·축제 대표 항목을 반환합니다.
 *
 * 데이터가 없는 카테고리도 배열에 남겨두어
 * 화면에서 빈 상태를 표시할 수 있도록 합니다.
 */
function categoryHighlightsInDistrict(districtName) {
  const sources = [
    ['관광지', attractionItems],
    ['숙박', lodgingItems],
    ['여행코스', courseItems],
    ['축제·행사', festivalItems],
  ]

  return sources.map(([label, items]) =>
    normalizeSpot(label, findRepresentativeItem(items, districtName), districtName),
  )
}

/**
 * 특정 구의 대표 이미지 카드 한 개를 선택합니다.
 *
 * 이미지가 있는 항목을 먼저 선택하고,
 * 이미지가 전혀 없으면 제목이 있는 항목을 선택합니다.
 */
function highlightInDistrict(districtName) {
  const districtHighlights = categoryHighlightsInDistrict(districtName)

  return (
    districtHighlights.find((item) => item.available && item.image) ||
    districtHighlights.find((item) => item.available) ||
    null
  )
}

// ============================================================================
// 2. 콘텐츠 유형별 건수
// ============================================================================
const contentTypeSummary = [
  {
    label: '관광지',
    count: attractionItems.length,
    color: '#ff007f',
  },
  {
    label: '숙박',
    count: lodgingItems.length,
    color: '#7b2cbf',
  },
  {
    label: '여행코스',
    count: courseItems.length,
    color: '#00b4d8',
  },
  {
    label: '축제·행사',
    count: festivalItems.length,
    color: '#f59e0b',
  },
]

const totalRecords = contentTypeSummary.reduce((sum, item) => sum + item.count, 0)

// ============================================================================
// 3. 구별 콘텐츠 건수
// ============================================================================
const districtCountsByDataset = {
  관광지: countByDistrict(attractionItems),
  숙박: countByDistrict(lodgingItems),
  여행코스: countByDistrict(courseItems),
  '축제·행사': countByDistrict(festivalItems),
}

// ============================================================================
// 4. 서울 전체 기준 카테고리 대표 스팟
// ============================================================================
function categoryHighlight(label, items, districtMap) {
  const { topDistrict } = topOne(districtMap)

  const representative = findRepresentativeItem(items, topDistrict)

  return normalizeSpot(label, representative, topDistrict)
}

const categoryHighlights = [
  categoryHighlight('관광지', attractionItems, districtCountsByDataset.관광지),
  categoryHighlight('숙박', lodgingItems, districtCountsByDataset.숙박),
  categoryHighlight('여행코스', courseItems, districtCountsByDataset.여행코스),
  categoryHighlight('축제·행사', festivalItems, districtCountsByDataset['축제·행사']),
]

// ============================================================================
// 5. 축제 데이터 분석
// ============================================================================
const festivalMonthCounts = (() => {
  const counts = Array(12).fill(0)

  festivalItems.forEach((item) => {
    const source = item.eventstartdate || item.modifiedtime || item.createdtime || ''

    const month = Number(source.slice(4, 6))

    if (month >= 1 && month <= 12) {
      counts[month - 1] += 1
    }
  })

  return counts
})()

const festivalMonthlySummary = festivalMonthCounts.map((count, index) => ({
  month: `${index + 1}월`,
  count,
}))

const topFestivalMonth = [...festivalMonthlySummary].sort((a, b) => b.count - a.count)[0]

const SEASON_MONTHS = {
  봄: [3, 4, 5],
  여름: [6, 7, 8],
  가을: [9, 10, 11],
  겨울: [12, 1, 2],
}

const seasonalSummary = Object.entries(SEASON_MONTHS).map(([season, months]) => ({
  season,
  count: months.reduce((sum, month) => sum + festivalMonthCounts[month - 1], 0),
}))

const MONTH_TO_SEASON = {}

Object.entries(SEASON_MONTHS).forEach(([season, months]) => {
  months.forEach((month) => {
    MONTH_TO_SEASON[month] = season
  })
})

const freeFestivalCount = festivalItems.filter(
  (item) => (item.usetimefestival || '').trim() === '무료',
).length

const freeFestivalRate = festivalItems.length
  ? Math.round((freeFestivalCount / festivalItems.length) * 100)
  : 0

function todayAsYYYYMMDD() {
  const now = new Date()

  const yyyy = now.getFullYear()

  const mm = String(now.getMonth() + 1).padStart(2, '0')

  const dd = String(now.getDate()).padStart(2, '0')

  return `${yyyy}${mm}${dd}`
}

function parseYYYYMMDD(value) {
  if (!value || value.length < 8) {
    return null
  }

  const yyyy = Number(value.slice(0, 4))

  const mm = Number(value.slice(4, 6))

  const dd = Number(value.slice(6, 8))

  return new Date(yyyy, mm - 1, dd)
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

const today = todayAsYYYYMMDD()

const todayDate = parseYYYYMMDD(today)

function districtRankingForSeason(months) {
  const seasonItems = festivalItems.filter((item) => {
    const source = item.eventstartdate || item.modifiedtime || item.createdtime || ''

    const month = Number(source.slice(4, 6))

    return months.includes(month)
  })

  return mapToSortedArray(countByDistrict(seasonItems))
    .filter((district) => district.name !== '미등록')
    .slice(0, 5)
}

const seasonalDistrictRanking = Object.fromEntries(
  Object.entries(SEASON_MONTHS).map(([season, months]) => [
    season,
    districtRankingForSeason(months),
  ]),
)

const todayMonth = Number(today.slice(4, 6))

const currentSeason = MONTH_TO_SEASON[todayMonth]

// 현재 진행 중인 축제
const ongoingFestivalItemsRaw = festivalItems.filter(
  (item) =>
    item.eventstartdate &&
    item.eventenddate &&
    item.eventstartdate <= today &&
    today <= item.eventenddate,
)

const ongoingFestivals = ongoingFestivalItemsRaw.map((item) => ({
  title: item.title,
  eventplace: item.eventplace || '',
  eventenddate: item.eventenddate,
  image: item.firstimage || null,
  district: getDistrict(item),
}))

const ongoingFestivalCount = ongoingFestivals.length

const ongoingDistrictRanking = mapToSortedArray(countByDistrict(ongoingFestivalItemsRaw)).filter(
  (district) => district.name !== '미등록',
)

// 오늘 이후 시작하는 축제 중 가장 가까운 5개
const upcomingFestivals = festivalItems
  .filter((item) => item.eventstartdate && item.eventstartdate > today)
  .map((item) => {
    const startDate = parseYYYYMMDD(item.eventstartdate)

    const dDay = Math.round((startDate - todayDate) / MS_PER_DAY)

    return {
      title: item.title,
      eventplace: item.eventplace || '',
      dDay,
      image: item.firstimage || null,
    }
  })
  .sort((a, b) => a.dDay - b.dDay)
  .slice(0, 5)

// ============================================================================
// 6. 구별 콘텐츠 밀집도 + 숙박 격차 + 코스 공백지 분석
// ============================================================================
const allDistrictNames = Array.from(
  new Set([
    ...districtCountsByDataset.관광지.keys(),
    ...districtCountsByDataset['축제·행사'].keys(),
    ...districtCountsByDataset.여행코스.keys(),
    ...districtCountsByDataset.숙박.keys(),
  ]),
).filter((name) => name !== '미등록')

const districtScore = allDistrictNames
  .map((name) => {
    const attractionCount = districtCountsByDataset.관광지.get(name) || 0

    const festivalCount = districtCountsByDataset['축제·행사'].get(name) || 0

    const courseCount = districtCountsByDataset.여행코스.get(name) || 0

    const lodgingCount = districtCountsByDataset.숙박.get(name) || 0

    return {
      name,
      attractionCount,
      festivalCount,
      courseCount,
      lodgingCount,
      contentScore: attractionCount + festivalCount + courseCount,
      image: representativeImage(name),
    }
  })
  .sort((a, b) => b.contentScore - a.contentScore)

const byContentRank = [...districtScore].sort((a, b) => b.contentScore - a.contentScore)

const byLodgingRank = [...districtScore].sort((a, b) => b.lodgingCount - a.lodgingCount)

const contentRankMap = new Map(byContentRank.map((district, index) => [district.name, index]))

const lodgingRankMap = new Map(byLodgingRank.map((district, index) => [district.name, index]))

const supplyGapDistricts = districtScore
  .map((district) => ({
    ...district,
    rankGap: (lodgingRankMap.get(district.name) ?? 0) - (contentRankMap.get(district.name) ?? 0),
  }))
  .sort((a, b) => b.rankGap - a.rankGap)
  .slice(0, 5)

const courseGapDistricts = districtScore
  .filter((district) => district.attractionCount > 0 && district.courseCount === 0)
  .sort((a, b) => b.attractionCount - a.attractionCount)
  .slice(0, 5)

// ============================================================================
// 7. 구별 상세 정보
// ============================================================================
function buildDistrictDetail(district) {
  const lodging = findRecommendedLodging(district.name)

  const course = findRecommendedCourse(district.name)

  const lodgingNote = lodging
    ? `“${lodging.title}”을(를) 확인해보세요.${lodging.addr1 ? ` 위치: ${lodging.addr1}.` : ''}`
    : `${district.name}에 등록된 숙소 정보가 없습니다. 인접 지역의 숙소도 함께 확인해보세요.`

  const courseNote = course
    ? `“${course.title}” 코스를 확인해보세요.${course.addr1 ? ` 위치: ${course.addr1}.` : ''}`
    : `${district.name}에 등록된 여행코스가 없습니다. 관광지 대표 스팟을 참고해 나만의 코스를 구성해보세요.`

  return {
    name: district.name,
    summary: district,
    lodging,
    lodgingNote,
    course,
    courseNote,
    categoryHighlights: categoryHighlightsInDistrict(district.name),
  }
}

const districtDetails = Object.fromEntries(
  districtScore.map((district) => [district.name, buildDistrictDetail(district)]),
)

// ============================================================================
// 8. 오늘의 추천
// ============================================================================
const recommendedDistrictName =
  ongoingDistrictRanking[0]?.name || districtScore[0]?.name || '미등록'

const recommendedFestival =
  ongoingFestivals.find((item) => item.district === recommendedDistrictName) ||
  ongoingFestivals[0] ||
  null

const recommendedLodging = findRecommendedLodging(recommendedDistrictName)

const recommendedDistrictInfo = districtScore.find(
  (district) => district.name === recommendedDistrictName,
)

const recommendedLodgingNote = recommendedLodging
  ? `${recommendedDistrictName}의 추천 숙소는 “${recommendedLodging.title}”입니다.${
      recommendedLodging.addr1 ? ` 위치: ${recommendedLodging.addr1}.` : ''
    }${recommendedLodging.zipcode ? ` 우편번호: ${recommendedLodging.zipcode}.` : ''}`
  : recommendedDistrictInfo
    ? `${recommendedDistrictName}에 등록된 숙소 정보가 ${recommendedDistrictInfo.lodgingCount}건이에요. 주변 지역의 숙소도 함께 확인해보세요.`
    : `${recommendedDistrictName} 주변 숙소를 미리 확인해보세요.`

const recommendedCategory = highlightInDistrict(recommendedDistrictName)

const todayRecommendation = {
  district: recommendedDistrictName,
  festival: recommendedFestival,
  lodging: recommendedLodging,
  lodgingNote: recommendedLodgingNote,
  category: recommendedCategory,
}

// ============================================================================
// 9. 사용자용 여행 인사이트 카드
// ============================================================================
const insightCards = [
  {
    title: '가장 많이 수집된 데이터 유형',
    detail: `관광지 정보가 ${contentTypeSummary[0].count}건으로 가장 많고, 축제·행사도 ${contentTypeSummary[3].count}건이 있습니다.`,
  },
  {
    title: '볼거리 많은 구',
    detail: `${districtScore[0]?.name || '미등록'}가 관광지·축제·코스를 합쳐 ${districtScore[0]?.contentScore || 0}건으로 가장 풍성합니다. 첫 여행지로 추천드립니다.`,
  },
  {
    title: '숙소는 여유 있게 알아보세요',
    detail: supplyGapDistricts[0]
      ? `${supplyGapDistricts[0].name}는 볼거리는 많은데 (${supplyGapDistricts[0].contentScore}건) 숙소는 ${supplyGapDistricts[0].lodgingCount}건뿐입니다.`
      : '뚜렷한 격차 구간이 확인되지 않았습니다.',
  },
  {
    title: '숨은 명소, 나만의 코스 만들기',
    detail: courseGapDistricts[0]
      ? `${courseGapDistricts[0].name}는 관광지가 ${courseGapDistricts[0].attractionCount}건 있지만 아직 정해진 여행 코스가 없습니다. 나만의 코스를 짜보기 좋은 지역입니다.`
      : '모든 구에 여행코스가 하나 이상 등록되어 있습니다.',
  },
  {
    title: '무료로 즐길 수 있는 축제도 많아요',
    detail: `서울 축제·행사 ${festivalItems.length}건 중 ${freeFestivalCount}건(${freeFestivalRate}%)이 무료로 즐길 수 있어요.`,
  },
  {
    title: '데이터 규모',
    detail: `총 ${totalRecords.toLocaleString()}건의 서울 관광 데이터를 만나볼 수 있습니다.`,
  },
]

export const analyticsInsights = {
  totalRecords,
  contentTypeSummary,
  categoryHighlights,
  festivalMonthlySummary,
  seasonalSummary,
  topFestivalMonth,
  currentSeason,
  seasonalDistrictRanking,
  todayRecommendation,
  freeFestivalCount,
  freeFestivalRate,
  ongoingFestivals,
  ongoingFestivalCount,
  upcomingFestivals,
  districtScore,
  districtDetails,
  supplyGapDistricts,
  courseGapDistricts,
  insightCards,
}

export default analyticsInsights
