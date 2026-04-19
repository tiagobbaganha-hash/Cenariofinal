import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Verificar cache
    const { data: cached } = await supabaseAdmin
      .from('user_ai_suggestions')
      .select('suggestions, expires_at')
      .eq('user_id', user.id)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({ suggestions: cached.suggestions, cached: true })
    }

    // Histórico do usuário
    const { data: history } = await supabaseAdmin
      .from('orders')
      .select('market_id, option_id, stake_amount, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance, available_balance')
      .eq('id', user.id)
      .single()

    // Mercados abertos disponíveis (que o usuário ainda não apostou)
    const betMarketIds = [...new Set((history || []).map((h: any) => h.market_id))]

    const { data: openMarkets } = await supabaseAdmin
      .from('markets')
      .select('id, title, description, category, closes_at')
      .eq('status', 'open')
      .not('id', 'in', betMarketIds.length > 0 ? `(${betMarketIds.join(',')})` : '(null)')
      .limit(15)

    const { data: openOptions } = openMarkets && openMarkets.length > 0
      ? await supabaseAdmin
          .from('market_options')
          .select('market_id, label, probability, odds')
          .in('market_id', openMarkets.map((m: any) => m.id))
      : { data: [] }

    const marketsSummary = (openMarkets || []).map((m: any) => {
      const opts = (openOptions || []).filter((o: any) => o.market_id === m.id)
      return `- "${m.title}" [${m.category}] | ${opts.map((o: any) => `${o.label}: ${((o.probability||0.5)*100).toFixed(0)}%`).join(', ')}`
    }).join('\n')

    const historySummary = history && history.length > 0
      ? `Apostou em ${history.length} mercados recentes, volume médio R$ ${(history.reduce((s: number, h: any) => s + parseFloat(h.stake_amount||0), 0)/history.length).toFixed(2)}`
      : 'Usuário novo, sem histórico de apostas'

    const balance = profile?.available_balance || 0

    const prompt = `Você é um assistente especialista em mercados preditivos. Analise o perfil do usuário e sugira as melhores apostas.

PERFIL DO USUÁRIO:
- Saldo disponível: R$ ${balance.toFixed(2)}
- ${historySummary}

MERCADOS ABERTOS DISPONÍVEIS:
${marketsSummary || 'Nenhum mercado novo disponível'}

Responda APENAS com JSON válido:
{
  "sugestoes": [
    {
      "market_title": "título exato do mercado",
      "opcao_recomendada": "qual opção apostar",
      "odds": 2.00,
      "valor_sugerido": 50.00,
      "confianca": "alta|media|baixa",
      "justificativa": "2 frases explicando por que essa aposta faz sentido",
      "categoria": "categoria do mercado"
    }
  ],
  "mensagem_personalizada": "mensagem de 1 frase motivacional personalizada para o usuário",
  "perfil_apostador": "conservador|moderado|agressivo"
}

Sugira entre 3 e 5 apostas. Considere diversificação de categorias.`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const aiData = await aiRes.json()
    const raw = aiData.content?.[0]?.text || '{}'
    const suggestions = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    // Cache 3h
    await supabaseAdmin.from('user_ai_suggestions').upsert({
      user_id: user.id,
      suggestions,
      expires_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString()
    }, { onConflict: 'user_id' })

    return NextResponse.json({ suggestions, cached: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
