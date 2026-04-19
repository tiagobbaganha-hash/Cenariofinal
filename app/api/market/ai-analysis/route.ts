import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { marketId } = await req.json()
    if (!marketId) return NextResponse.json({ error: 'marketId obrigatório' }, { status: 400 })

    // Verificar cache (opcional — tabela pode não existir ainda)
    try {
      const { data: cached } = await supabaseAdmin
        .from('market_ai_analysis')
        .select('analysis, expires_at')
        .eq('market_id', marketId)
        .single()
      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({ analysis: cached.analysis, cached: true })
      }
    } catch (_) { /* tabela não existe ainda, continuar sem cache */ }

    // Buscar dados do mercado
    const { data: market } = await supabaseAdmin
      .from('markets')
      .select('id, title, description, category, closes_at, status')
      .eq('id', marketId)
      .single()

    if (!market) return NextResponse.json({ error: 'Mercado não encontrado' }, { status: 404 })

    const { data: options } = await supabaseAdmin
      .from('market_options')
      .select('label, option_key, probability, odds')
      .eq('market_id', marketId)
      .order('sort_order')

    const { count: betCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', marketId)

    const { data: volumeData } = await supabaseAdmin
      .from('orders')
      .select('stake_amount, option_id')
      .eq('market_id', marketId)

    const totalVolume = (volumeData || []).reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0)

    const closesAt = market.closes_at ? new Date(market.closes_at) : null
    const daysLeft = closesAt ? Math.max(0, Math.ceil((closesAt.getTime() - Date.now()) / 86400000)) : null

    const optionsSummary = (options || []).map(o =>
      `${o.label}: ${((o.probability || 0.5) * 100).toFixed(0)}% probabilidade, odds ${(o.odds || 2).toFixed(2)}`
    ).join('\n')

    const prompt = `Você é um analista especialista em mercados preditivos brasileiros. 
Analise o seguinte mercado e forneça uma análise objetiva e útil para investidores.

MERCADO: ${market.title}
DESCRIÇÃO: ${market.description || 'Sem descrição'}
CATEGORIA: ${market.category || 'Geral'}
OPÇÕES ATUAIS:\n${optionsSummary}
VOLUME TOTAL: R$ ${totalVolume.toFixed(2)}
APOSTAS: ${betCount || 0}
${daysLeft !== null ? `DIAS RESTANTES: ${daysLeft}` : ''}

Responda APENAS com JSON válido (sem markdown, sem backticks):
{
  "resumo": "2-3 frases resumindo o mercado e contexto atual",
  "cenarios": [
    {
      "opcao": "nome da opção",
      "probabilidade": 50,
      "analise": "análise de 2-3 frases sobre por que essa opção pode vencer",
      "fatores_favor": ["fator 1", "fator 2", "fator 3"],
      "riscos": ["risco 1", "risco 2"]
    }
  ],
  "fatores_chave": ["fator decisivo 1", "fator decisivo 2", "fator decisivo 3"],
  "momento_mercado": "quente|neutro|frio",
  "confianca_analise": "alta|media|baixa",
  "data_resolucao_dica": "dica sobre quando o evento será resolvido e como acompanhar"
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

    const aiData = await aiRes.json()
    const raw = aiData.content?.[0]?.text || '{}'
    const analysis = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    // Salvar cache (opcional)
    try {
      await supabaseAdmin.from('market_ai_analysis').upsert({
        market_id: marketId,
        analysis,
        expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
      }, { onConflict: 'market_id' })
    } catch (_) { /* tabela não existe ainda */ }

    return NextResponse.json({ analysis, cached: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
