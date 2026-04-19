import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 })
    }

    // Use provided key or env var
    const key = apiKey || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'API key não configurada. Adicione ANTHROPIC_API_KEY na Vercel.' }, { status: 500 })
    }

    // Try Claude API first
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Você é um assistente que cria mercados preditivos para a plataforma CenárioX (brasileira).

O admin descreveu o mercado assim: "${prompt}"

Gere um JSON com os seguintes campos (SEM markdown, SEM backticks, APENAS o JSON puro):
{
  "title": "Pergunta do mercado em formato de pergunta com ?",
  "description": "Descrição detalhada de 2-3 frases explicando o mercado, critérios de resolução e fontes",
  "category": "uma de: Política, Economia, Esportes, Tecnologia, Cripto, Entretenimento, Geopolítica, Geral",
  "options": [
    { "label": "Nome da opção", "option_key": "yes ou no ou opt1/opt2/etc", "probability": 0.50, "odds": 2.00 }
  ],
  "closes_at_days": 30,
  "resolves_at_days": 35,
  "image_prompt": "Prompt em inglês para gerar imagem de capa deste mercado, descritivo e visual"
}

Se tiver apenas 2 opções (sim/não), use option_key "yes" e "no". Se tiver mais, use "opt1", "opt2", etc.
As probabilidades devem somar 1.0 e os odds devem ser 1/probabilidade.
Responda SOMENTE com o JSON, nada mais.`
        }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `API error: ${errText}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    
    // Parse JSON from response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const market = JSON.parse(cleaned)

    return NextResponse.json({ market })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 })
  }
}
