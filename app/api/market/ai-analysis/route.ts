import { NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/activity-log'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://slxzmyiwcsjyahahkppe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { marketId, title, description, category, options: clientOptions } = await req.json()
    if (!marketId) return NextResponse.json({ error: 'marketId obrigatório' }, { status: 400 })

    // Cache check
    try {
      const { data: cached } = await supabaseAdmin
        .from('market_ai_analysis').select('analysis, expires_at').eq('market_id', marketId).maybeSingle()
      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({ analysis: cached.analysis, cached: true })
      }
    } catch (_) {}

    // Usar dados enviados pelo cliente (mais confiável) ou buscar do banco
    let marketTitle = title || ''
    let marketDesc = description || ''
    let marketCategory = category || 'Geral'
    let optionsList: any[] = clientOptions || []

    // Se não vieram dados do cliente, buscar do banco
    if (!marketTitle) {
      try {
        const { data: m } = await supabaseAdmin
          .from('markets').select('title, description, category').eq('id', marketId).maybeSingle()
        if (m) { marketTitle = m.title; marketDesc = m.description || ''; marketCategory = m.category || 'Geral' }
      } catch (_) {}
    }

    if (optionsList.length === 0) {
      try {
        const { data: opts } = await supabaseAdmin
          .from('market_options').select('label, probability, odds').eq('market_id', marketId)
        optionsList = opts || []
      } catch (_) {}
    }

    // Dados de volume
    let totalVolume = 0, betCount = 0
    try {
      const { data: vd } = await supabaseAdmin
        .from('orders').select('stake_amount').eq('market_id', marketId)
      totalVolume = (vd || []).reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0)
      betCount = (vd || []).length
    } catch (_) {}

    if (!marketTitle) return NextResponse.json({ error: 'Dados do mercado não encontrados' }, { status: 404 })

    const optsSummary = optionsList.map(o =>
      `${o.label}: ${((o.probability || 0.5) * 100).toFixed(0)}% probabilidade, odds ${(o.odds || 2).toFixed(2)}`
    ).join('\n') || 'Opções não disponíveis'

    const prompt = `Você é um analista especialista em mercados preditivos brasileiros. 
Analise este mercado e forneça insights objetivos para apostadores.

MERCADO: ${marketTitle}
DESCRIÇÃO: ${marketDesc || 'Sem descrição'}
CATEGORIA: ${marketCategory}
OPÇÕES:\n${optsSummary}
VOLUME: R$ ${totalVolume.toFixed(2)} | ${betCount} apostas

Responda SOMENTE com JSON válido (sem markdown):
{
  "resumo": "2-3 frases sobre o mercado e contexto",
  "cenarios": [
    {
      "opcao": "nome",
      "probabilidade": 50,
      "analise": "2 frases explicando a chance",
      "fatores_favor": ["fator 1", "fator 2"],
      "riscos": ["risco 1"]
    }
  ],
  "fatores_chave": ["fator 1", "fator 2", "fator 3"],
  "momento_mercado": "quente",
  "confianca_analise": "media",
  "data_resolucao_dica": "quando e como acompanhar a resolução"
}`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      return NextResponse.json({ error: `API Claude: ${errText}` }, { status: 500 })
    }

    const aiData = await aiRes.json()
    const raw = aiData.content?.[0]?.text || '{}'
    const analysis = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    try {
      await supabaseAdmin.from('market_ai_analysis').upsert({
        market_id: marketId, analysis,
        expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
      }, { onConflict: 'market_id' })
    } catch (_) {}

    // Log
    try {
      const { data: { user } } = await (await import('@/lib/supabase/server')).createClient().auth.getUser()
      await logActivity({ userId: user?.id, action: 'ai.analysis_viewed', entityType: 'market', entityId: marketId, entityLabel: marketTitle, request: req })
    } catch(_) {}

    return NextResponse.json({ analysis, cached: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
