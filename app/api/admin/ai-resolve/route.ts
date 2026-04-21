import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb(token?: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const opts = (!process.env.SUPABASE_SERVICE_ROLE_KEY && token)
    ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, opts)
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const db = getDb(token)
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { market_id } = await req.json()

    const { data: market } = await db.from('markets')
      .select('*, market_options(id, label, option_key)')
      .eq('id', market_id).single()

    if (!market) return NextResponse.json({ error: 'Mercado não encontrado' }, { status: 404 })
    if (market.status === 'resolved') return NextResponse.json({ error: 'Já resolvido' }, { status: 400 })

    const options = market.market_options || []
    const optionsList = options.map((o: any, i: number) => `${i}: ${o.label}`).join('\n')

    // Chamar Claude via API
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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Você resolve mercados preditivos brasileiros com base no seu conhecimento.

Mercado: "${market.title}"
${market.description ? `Descrição: ${market.description}` : ''}
${market.resolution_source ? `Fonte: ${market.resolution_source}` : ''}

Opções:
${optionsList}

Responda APENAS em JSON:
{"winner_index": 0, "winner_label": "nome", "confidence": 0.8, "reasoning": "explicação"}`
        }]
      })
    })

    const aiData = await aiResponse.json()
    const text = aiData.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])
    const winnerOption = options[result.winner_index]
    if (!winnerOption) return NextResponse.json({ error: 'Índice de opção inválido' }, { status: 500 })

    await db.from('markets').update({
      status: 'resolved',
      result_option_id: winnerOption.id,
      resolves_at: new Date().toISOString()
    }).eq('id', market_id)

    await db.from('ai_resolution_log').insert({
      market_id,
      resolution_source: 'ai_claude',
      ai_reasoning: result.reasoning,
      resolved_option_id: winnerOption.id,
      confidence: result.confidence,
      raw_response: text
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      winner_label: winnerOption.label,
      confidence: result.confidence,
      reasoning: result.reasoning
    })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
