import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb(token?: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
  const opts = (!process.env.SUPABASE_SERVICE_ROLE_KEY && token)
    ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  return createClient('https://slxzmyiwcsjyahahkppe.supabase.co', key, opts)
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const db = getDb(token)
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { topic, count = 5 } = await req.json()
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Crie ${count} mercados preditivos brasileiros baseados neste tópico: "${topic}"

Responda APENAS em JSON válido:
{
  "source": "resumo em 1 frase",
  "markets": [
    {
      "title": "pergunta em português",
      "description": "contexto de 1-2 frases",
      "category": "Política|Esportes|Cripto|Entretenimento|Economia|Tecnologia|Geral",
      "closes_at_days": 30,
      "resolves_at_days": 37,
      "options": [
        {"label": "Sim", "option_key": "yes", "probability": 0.6, "odds": 1.58},
        {"label": "Não", "option_key": "no", "probability": 0.4, "odds": 2.38}
      ]
    }
  ]
}`
        }]
      })
    })

    const aiData = await aiResponse.json()
    const text = aiData.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])
    const markets = result.markets || []

    let created = 0
    for (const mkt of markets) {
      await db.from('news_market_queue').insert({
        headline: topic.slice(0, 200),
        source: result.source,
        category: mkt.category,
        ai_generated_market: mkt,
        status: 'pending'
      })
      created++
    }

    return NextResponse.json({ success: true, created })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
