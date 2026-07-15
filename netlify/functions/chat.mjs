// package.json에 "type": "module"이 있으므로 ESM 문법 사용 (.mjs + export const handler)
// exports.handler 방식으로 쓰면 "exports is not defined" 에러가 남

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
        '너는 "FESTA 2026" 서울 축제 포털의 안내 챗봇이야. 서울에서 열리는 축제, 관광지, 숙박 정보에 대해 한국어로 친절하고 간결하게 답해줘. 답변은 3~4문장 이내로 짧게. 모르는 정보는 모른다고 솔직히 말해.',
    },
    // history: [{ role: 'user'|'assistant', content: '...' }]
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
        max_completion_tokens: 2000,
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