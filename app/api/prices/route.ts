import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const result: Record<string, { value: number; change: number; symbol: string }> = {}

  // 1. CoinGecko — cripto
  try {
    const ids = 'bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2,matic-network,chainlink,polkadot,shiba-inu'
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const MAP: Record<string, string> = {
        bitcoin:'BTC', ethereum:'ETH', solana:'SOL', binancecoin:'BNB',
        ripple:'XRP', dogecoin:'DOGE', cardano:'ADA', 'avalanche-2':'AVAX',
        'matic-network':'MATIC', chainlink:'LINK', polkadot:'DOT', 'shiba-inu':'SHIB',
      }
      for (const [id, sym] of Object.entries(MAP)) {
        if (data[id]) result[id] = { value: data[id].brl, change: data[id].brl_24h_change||0, symbol: sym }
      }
    }
  } catch (_) {}

  // 2. ExchangeRate-API — forex (mais confiável que AwesomeAPI em serverless)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/BRL', { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      const rates = data.rates || {}
      // Converter: BRL/X → X/BRL = 1/rate
      if (rates.USD) result['USD'] = { value: parseFloat((1/rates.USD).toFixed(4)), change: 0, symbol: 'USD' }
      if (rates.EUR) result['EUR'] = { value: parseFloat((1/rates.EUR).toFixed(4)), change: 0, symbol: 'EUR' }
      if (rates.GBP) result['GBP'] = { value: parseFloat((1/rates.GBP).toFixed(4)), change: 0, symbol: 'GBP' }
      if (rates.JPY) result['JPY'] = { value: parseFloat((1/rates.JPY).toFixed(6)), change: 0, symbol: 'JPY' }
    }
  } catch (_) {}

  // 3. AwesomeAPI — ouro, prata, petróleo (fallback)
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/XAU-BRL,XAG-BRL,WTI-BRL', { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const data = await res.json()
      if (data.XAUBRL) result['GOLD']  = { value: parseFloat(data.XAUBRL.bid), change: parseFloat(data.XAUBRL.pctChange||'0'), symbol: 'OURO' }
      if (data.XAGBRL) result['SILVER'] = { value: parseFloat(data.XAGBRL.bid), change: parseFloat(data.XAGBRL.pctChange||'0'), symbol: 'PRATA' }
      if (data.WTIBRL) result['WTI']   = { value: parseFloat(data.WTIBRL.bid), change: parseFloat(data.WTIBRL.pctChange||'0'), symbol: 'WTI' }
    }
  } catch (_) {}

  // 4. Bolsa BR — brapi.dev
  try {
    const symbols = 'IBOV,PETR4,VALE3,BBDC4,ITUB4,BBAS3,ABEV3,JBSS3,MRFG3,AGRO3,SLCE3,SMTO3,CAML3'
    const res = await fetch(`https://brapi.dev/api/quote/${symbols}?range=1d&interval=1d`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      for (const item of (data.results||[])) {
        const price = item.regularMarketPrice || item.price
        if (price) result[item.symbol] = { value: price, change: item.regularMarketChangePercent||0, symbol: item.symbol }
      }
    }
  } catch (_) {}

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' }
  })
}
