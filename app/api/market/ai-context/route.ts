import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { marketId, title, description, category, options } = await req.json()

    const optsSummary = (options || []).map((o: any) =>
      `${o.label}${o.probability ? ` (${Math.round(o.probability * 100)}%)` : ''}`
    ).join(', ')

    const prompt = `Você é um especialista em mercados preditivos brasileiros. Gere um contexto completo e educativo sobre este mercado preditivo.

MERCADO: ${title}
DESCRIÇÃO: ${description || 'Sem descrição'}
CATEGORIA: ${category || 'Geral'}
OPÇÕES: ${optsSummary}

Escreva em português brasileiro, formato markdown:

## O que é este Mercado Preditivo
(1 parágrafo explicando o conceito e o evento específico)

## Contexto e Resolução do Evento
(2 parágrafos: contexto atual do evento e como/quando será resolvido)

## Alternativas de Resultado
(explique cada opção disponível e o que significa cada resultado)

## Como Participar
(3-4 dicas práticas para entender e apostar neste mercado)

Seja informativo, imparcial e educativo. Foque em educar o usuário sobre o evento e o mercado. NÃO recomende qual opção escolher.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const context = data.content?.[0]?.text || ''

    return NextResponse.json({ context })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
