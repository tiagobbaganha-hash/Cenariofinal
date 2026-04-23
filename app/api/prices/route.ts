import { NextResponse } from 'next/server'

// Proxy de preços — roda no servidor, sem problemas de CORS
// Agrega: CoinGecko (cripto) + AwesomeAPI (moedas/ouro/petróleo)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const result: Record<string, { value: number; change: number; symbol: string }> = {}

  // 1. CoinGecko — cripto
  try {
    const ids = 'bitcoin,ethereum,solana,binancecoin,ripple,dogecoin'
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
      { next: { revalidate: 0 } }
    )
    if (res.ok) {
      const data = await res.json()
      const MAP: Record<string, string> = {
        bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL',
        binancecoin: 'BNB', ripple: 'XRP', dogecoin: 'DOGE',
      }
      for (const [id, sym] of Object.entries(MAP)) {
        if (data[id]) result[id] = { value: data[id].brl, change: data[id].brl_24h_change || 0, symbol: sym }
      }
    }
  } catch (_) {}

  // 2. AwesomeAPI — moedas + ouro + petróleo (WTI via XAG aproximado)
  try {
    const res = await fetch(
      'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,XAU-BRL,BTC-BRL',
      { next: { revalidate: 0 } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.USDBRL) result['USD'] = { value: parseFloat(data.USDBRL.bid), change: parseFloat(data.USDBRL.pctChange || '0'), symbol: 'USD' }
      if (data.EURBRL) result['EUR'] = { value: parseFloat(data.EURBRL.bid), change: parseFloat(data.EURBRL.pctChange || '0'), symbol: 'EUR' }
      if (data.GBPBRL) result['GBP'] = { value: parseFloat(data.GBPBRL.bid), change: parseFloat(data.GBPBRL.pctChange || '0'), symbol: 'GBP' }
      if (data.XAUBRL) result['GOLD'] = { value: parseFloat(data.XAUBRL.bid), change: parseFloat(data.XAUBRL.pctChange || '0'), symbol: 'OURO' }
    }
  } catch (_) {}

  // 3. Petróleo WTI via API pública
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/WTI-BRL', { next: { revalidate: 0 } })
    if (res.ok) {
      const data = await res.json()
      if (data.WTIBRL) result['WTI'] = { value: parseFloat(data.WTIBRL.bid), change: parseFloat(data.WTIBRL.pctChange || '0'), symbol: 'WTI' }
    }
  } catch (_) {}

  // 4. Bolsa BR via brapi.dev (gratuito, sem API key)
  try {
    const symbols = 'IBOV,PETR4,VALE3,BBDC4'
    const res = await fetch(
      `https://brapi.dev/api/quote/${symbols}?range=1d&interval=1d`,
      { next: { revalidate: 15 } }
    )
    if (res.ok) {
      const data = await res.json()
      for (const item of (data.results || [])) {
        const sym = item.symbol
        const price = item.regularMarketPrice || item.price
        const change = item.regularMarketChangePercent || 0
        if (price) result[sym] = { value: price, change, symbol: sym }
      }
    }
  } catch (_) {}

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' }
  })
}
