import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const description = formData.get('description') as string
    const images: string[] = []

    // Processar imagens enviadas (base64)
    for (let i = 0; i < 4; i++) {
      const img = formData.get(`image_${i}`) as File | null
      if (img) {
        const buf = await img.arrayBuffer()
        const b64 = Buffer.from(buf).toString('base64')
        images.push(`data:${img.type};base64,${b64}`)
      }
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const googleKey = process.env.GOOGLE_API_KEY

    if (!anthropicKey || !googleKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY e GOOGLE_API_KEY são necessárias' }, { status: 500 })
    }

    // Passo 1: Claude Vision analisa as imagens e gera prompt para Imagen
    const visionContent: any[] = []

    if (images.length > 0) {
      visionContent.push({ type: 'text', text: 'Analise estas imagens de referência para criar uma capa de mercado preditivo:' })
      images.forEach((img, i) => {
        const [header, data] = img.split(',')
        const mediaType = header.split(':')[1].split(';')[0]
        visionContent.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data }
        })
      })
    }

    visionContent.push({
      type: 'text',
      text: `Mercado/contexto: "${description}"

Crie um prompt profissional em INGLÊS para o Gemini Imagen 3 gerar uma capa visualmente impactante para este mercado preditivo.

O prompt deve:
- Descrever as pessoas/elementos vistos nas imagens (aparência, vestimenta, expressão)
- Usar estilo editorial moderno de plataforma de previsões (como Polymarket, PredictIt)
- Split screen ou composição dinâmica se houver mais de uma pessoa
- Fundo escuro premium com gradiente sutil
- Elementos gráficos: percentuais, probabilidades, barras de dados sobrepostas
- Tons: azul profundo, verde esmeralda, branco brilhante — estilo financeiro tech
- Iluminação cinematográfica, alta definição, 16:9

Responda APENAS com o prompt de imagem em inglês, sem explicações, sem aspas.`
    })

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: visionContent }]
      })
    })

    const claudeData = await claudeRes.json()
    const imagePrompt = claudeData.content?.[0]?.text?.trim() || description

    // Passo 2: Gemini Imagen 3 gera a imagem
    const imagenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${googleKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            safetyFilterLevel: 'block_only_high',
          }
        })
      }
    )

    if (!imagenRes.ok) {
      const errText = await imagenRes.text()
      // Fallback: retornar o prompt gerado para uso externo
      return NextResponse.json({
        success: false,
        prompt: imagePrompt,
        error: `Imagen API: ${errText}`,
        fallback: true
      })
    }

    const imagenData = await imagenRes.json()
    const imageBase64 = imagenData.predictions?.[0]?.bytesBase64Encoded

    if (!imageBase64) {
      return NextResponse.json({
        success: false,
        prompt: imagePrompt,
        error: 'Imagen não retornou imagem',
        fallback: true
      })
    }

    return NextResponse.json({
      success: true,
      image_base64: imageBase64,
      image_data_url: `data:image/png;base64,${imageBase64}`,
      prompt_used: imagePrompt
    })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
