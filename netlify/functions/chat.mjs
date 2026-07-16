// package.json에 "type": "module"이 있으므로 ESM 문법 사용 (.mjs + export const handler)
// JSON import는 Netlify 빌드(esbuild)가 정적으로 분석해서 번들에 그대로 박아 넣어줌
// (런타임에 파일을 읽는 게 아니라 빌드 시점에 데이터가 코드 안에 포함됨)
import festivalData from '../../src/data/서울_축제공연행사.json'

function formatPeriod(startStr, endStr) {
  const fmt = (s) => (s && s.length >= 8 ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : null)
  const start = fmt(startStr)
  if (!start) return '기간 미정'
  const end = fmt(endStr)
  if (!end || end === start) return start
  return `${start}~${end}`
}

// 축제 데이터를 챗봇이 참고할 수 있도록 한 줄씩 압축한 텍스트로 변환
function buildFestivalContext(items) {
  return items
    .map((it) => {
      const period = formatPeriod(it.eventstartdate, it.eventenddate)
      return `- ${it.title} | ${period} | ${it.addr1 || '주소 미정'} | ${it.tel || '전화없음'}`
    })
    .join('\n')
}

const FESTIVAL_CONTEXT = buildFestivalContext(festivalData.items || [])

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: '잘못된 요청 형식입니다.' }) }
  }

  const { message, history = [] } = payload

  if (!message || typeof message !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'message가 필요합니다.' }) }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY 환경변수 없음')
    return { statusCode: 500, body: JSON.stringify({ error: '서버에 API 키가 설정되어 있지 않습니다.' }) }
  }

  const messages = [
    {
      role: 'system',
      content:
        `너는 "FESTA 2026" 서울 축제 포털의 안내 챗봇이야. 답변은 한국어로 3~4문장 이내로 간결하게 해줘.\n\n` +
        `아래 두 가지를 명확히 구분해서 답해:\n\n` +
        `1) [축제 데이터 기반으로만 답해야 하는 것]\n` +
        `   - 특정 축제가 존재하는지, 언제/어디서 열리는지, 전화번호가 뭔지 등 "그 축제 자체에 대한 사실"\n` +
        `   - 이런 질문엔 반드시 [축제 데이터]만 근거로 답하고, 없으면 지어내지 말고 "FESTA 2026 데이터에는 없는 정보"라고 말해.\n\n` +
        `2) [네가 원래 알고 있는 지식으로 자유롭게 답해도 되는 것]\n` +
        `   - 서울 행정구역의 위치나 방향(예: "노원구가 서울 기준 어디야?"), 교통/이동 방법, 계절별 옷차림, 여행 준비물, 일반적인 여행 팁 등\n` +
        `   - [축제 데이터]에 등장하는 지역명(구/동 등)에 대한 일반 지리 정보도 여기 해당해.\n` +
        `   - 이런 질문은 [축제 데이터]에 없어도 "데이터에 없는 정보"라고 답하지 말고, 네가 아는 지식으로 자연스럽게 답해.\n\n` +
        `헷갈리면 이렇게 판단해: 질문의 답이 "그 축제 자체의 사실(존재 여부/날짜/장소/연락처)"이면 1번, 그 외의 배경지식이나 일반 정보 질문이면 2번이야.\n\n` +
        `날짜를 안내할 땐 반드시 데이터에 있는 기간(YYYY.MM.DD~YYYY.MM.DD) 형식 그대로 말해.\n\n` +
        `[축제 데이터]\n${FESTIVAL_CONTEXT}`,
    },
    ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        reasoning_effort: 'minimal',
        max_completion_tokens: 4000,
        messages,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenAI API 오류:', res.status, errText)
      return { statusCode: 502, body: JSON.stringify({ error: 'LLM 호출에 실패했습니다.' }) }
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? '응답을 생성하지 못했습니다.'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: '서버 오류가 발생했습니다.' }) }
  }
}