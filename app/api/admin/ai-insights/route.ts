import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Cache 1h (opcional)
    try {
      const { data: cached } = await supabaseAdmin
        .from('admin_ai_insights')
        .select('insights, expires_at')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()
      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({ insights: cached.insights, cached: true })
      }
    } catch (_) { /* tabela não existe ainda */ }

    // Coletar todos os dados da plataforma em paralelo
    const [
      usersRes, marketsRes, ordersRes, leaderRes, influRes
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, created_at, balance').limit(500),
      supabaseAdmin.from('markets').select('id, title, category, status, created_at, closes_at').limit(100),
      supabaseAdmin.from('orders').select('market_id, stake_amount, status, created_at').limit(1000),
      supabaseAdmin.from('profiles').select('id, balance').order('balance', { ascending: false }).limit(10),
      supabaseAdmin.from('influencers').select('id, name, commission_rate').limit(20).catch(() => ({ data: [] })),
    ])

    const users = usersRes.data || []
    const markets = marketsRes.data || []
    const orders = ordersRes.data || []
    const topUsers = leaderRes.data || []
    const influencers = (influRes as any).data || []

    const totalVolume = orders.reduce((s, o) => s + parseFloat(o.stake_amount || '0'), 0)
    const openMarkets = markets.filter(m => m.status === 'open')
    const resolvedMarkets = markets.filter(m => m.status === 'resolved')

    // Volume por mercado
    const volByMarket: Record<string, number> = {}
    orders.forEach(o => {
      volByMarket[o.market_id] = (volByMarket[o.market_id] || 0) + parseFloat(o.stake_amount || '0')
    })
    const topMarkets = Object.entries(volByMarket)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, vol]) => {
        const m = markets.find(m => m.id === id)
        return `"${m?.title || id}" R$ ${vol.toFixed(0)} (${m?.category || '?'})`
      })

    // Apostas por dia (últimos 7 dias)
    const last7 = orders.filter(o => new Date(o.created_at) > new Date(Date.now() - 7*86400000))
    const userGrowth = users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7*86400000)).length

    // Categorias populares
    const catCount: Record<string, number> = {}
    orders.forEach(o => {
      const m = markets.find(m => m.id === o.market_id)
      if (m?.category) catCount[m.category] = (catCount[m.category] || 0) + 1
    })
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${c} (${n} apostas)`)

    const prompt = `Você é o Chief Analytics Officer da CenárioX, plataforma brasileira de mercados preditivos. 
Analise os dados abaixo e forneça insights estratégicos acionáveis para o time de gestão.

DADOS DA PLATAFORMA:
- Total usuários: ${users.length}
- Novos usuários (7 dias): ${userGrowth}
- Mercados abertos: ${openMarkets.length}
- Mercados resolvidos: ${resolvedMarkets.length}
- Volume total: R$ ${totalVolume.toFixed(2)}
- Apostas últimos 7 dias: ${last7.length}
- Top mercados por volume: ${topMarkets.join(' | ')}
- Categorias mais apostadas: ${topCats.join(', ')}
- Influenciadores ativos: ${influencers.length}

Responda APENAS com JSON válido:
{
  "resumo_executivo": "3 frases sobre a saúde geral da plataforma",
  "alertas": [
    {"nivel": "critico|atencao|positivo", "mensagem": "alerta importante"}
  ],
  "mercados_sugeridos": [
    {
      "titulo": "Pergunta do mercado em formato ?",
      "categoria": "categoria",
      "justificativa": "por que criar agora",
      "potencial_volume": "baixo|medio|alto|muito_alto",
      "urgencia": "hoje|esta_semana|este_mes"
    }
  ],
  "insights_usuarios": {
    "retencao": "análise de 2 frases sobre engajamento",
    "acao_recomendada": "ação específica para aumentar engajamento"
  },
  "insights_mercados": {
    "categoria_destaque": "categoria com melhor performance",
    "mercados_para_encerrar": "análise sobre mercados que deveriam ser resolvidos logo",
    "acao_recomendada": "ação específica para melhorar o portfólio de mercados"
  },
  "insights_receita": {
    "projecao_30_dias": "projeção de crescimento",
    "acao_recomendada": "ação para aumentar receita"
  },
  "score_saude_plataforma": 75,
  "prioridade_semana": "a ação mais importante a fazer essa semana em 1 frase"
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
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const aiData = await aiRes.json()
    const raw = aiData.content?.[0]?.text || '{}'
    const insights = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    // Cache 1h (opcional)
    try {
      await supabaseAdmin.from('admin_ai_insights').insert({
        insights,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      })
    } catch (_) { /* tabela não existe ainda */ }

    return NextResponse.json({ insights, cached: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
