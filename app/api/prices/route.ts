import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const result: Record<string, { value: number; change: number; symbol: string }> = {}

  // 1. CoinGecko — cripto completo
  try {
    const ids = 'bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2,matic-network,chainlink,polkadot,shiba-inu'
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`,
      { next: { revalidate: 0 }, headers: { 'Accept': 'application/json' } }
    )
    if (res.ok) {
      const data = await res.json()
      const MAP: Record<string, string> = {
        bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL',
        binancecoin: 'BNB', ripple: 'XRP', dogecoin: 'DOGE',
        cardano: 'ADA', 'avalanche-2': 'AVAX', 'matic-network': 'MATIC',
        chainlink: 'LINK', polkadot: 'DOT', 'shiba-inu': 'SHIB',
      }
      for (const [id, sym] of Object.entries(MAP)) {
        if (data[id]) result[id] = { value: data[id].brl, change: data[id].brl_24h_change || 0, symbol: sym }
      }
    }
  } catch (_) {}

  // 2. AwesomeAPI — moedas + ouro + petróleo
  try {
    const res = await fetch(
      'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,XAU-BRL,XAG-BRL',
      { next: { revalidate: 0 } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.USDBRL) result['USD']  = { value: parseFloat(data.USDBRL.bid), change: parseFloat(data.USDBRL.pctChange||'0'), symbol: 'USD' }
      if (data.EURBRL) result['EUR']  = { value: parseFloat(data.EURBRL.bid), change: parseFloat(data.EURBRL.pctChange||'0'), symbol: 'EUR' }
      if (data.GBPBRL) result['GBP']  = { value: parseFloat(data.GBPBRL.bid), change: parseFloat(data.GBPBRL.pctChange||'0'), symbol: 'GBP' }
      if (data.JPYBRL) result['JPY']  = { value: parseFloat(data.JPYBRL.bid), change: parseFloat(data.JPYBRL.pctChange||'0'), symbol: 'JPY' }
      if (data.XAUBRL) result['GOLD'] = { value: parseFloat(data.XAUBRL.bid), change: parseFloat(data.XAUBRL.pctChange||'0'), symbol: 'OURO' }
      if (data.XAGBRL) result['SILVER']= { value: parseFloat(data.XAGBRL.bid), change: parseFloat(data.XAGBRL.pctChange||'0'), symbol: 'PRATA' }
    }
  } catch (_) {}

  // 3. WTI
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/WTI-BRL', { next: { revalidate: 0 } })
    if (res.ok) {
      const data = await res.json()
      if (data.WTIBRL) result['WTI'] = { value: parseFloat(data.WTIBRL.bid), change: parseFloat(data.WTIBRL.pctChange||'0'), symbol: 'WTI' }
    }
  } catch (_) {}

  // 4. Bolsa BR via brapi.dev
  try {
    const symbols = 'IBOV,PETR4,VALE3,BBDC4,ITUB4,BBAS3,ABEV3'
    const res = await fetch(
      `https://brapi.dev/api/quote/${symbols}?range=1d&interval=1d`,
      { next: { revalidate: 15 } }
    )
    if (res.ok) {
      const data = await res.json()
      for (const item of (data.results || [])) {
        const price = item.regularMarketPrice || item.price
        const change = item.regularMarketChangePercent || 0
        if (price) result[item.symbol] = { value: price, change, symbol: item.symbol }
      }
    }
  } catch (_) {}

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' }
  })
}
