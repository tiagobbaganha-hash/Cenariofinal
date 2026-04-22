import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb(token?: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
  const opts = (!process.env.SUPABASE_SERVICE_ROLE_KEY && token)
    ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  return createClient('https://slxzmyiwcsjyahahkppe.supabase.co', key, opts)
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const db = getDb(token)
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { schedule_id } = await req.json()
    const { data: schedule } = await db.from('market_schedules').select('*').eq('id', schedule_id).single()
    if (!schedule) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

    const slug = schedule.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '-' + Date.now().toString(36)

    const { data: market, error } = await db.from('markets').insert({
      title: schedule.title,
      description: schedule.description,
      category: schedule.category,
      slug, status: 'open',
      closes_at: schedule.closes_at,
      resolves_at: schedule.resolves_at || schedule.closes_at,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const options = schedule.options || []
    await db.from('market_options').insert(
      options.map((o: any, i: number) => ({
        market_id: market.id,
        label: o.label,
        option_key: o.option_key || (i === 0 ? 'yes' : i === 1 ? 'no' : `opt${i}`),
        probability: o.probability || 0.5,
        odds: o.odds || 2.0,
        liquidity_pool: 100,
        sort_order: i,
        is_active: true
      }))
    )

    await db.from('market_schedules').update({ status: 'published', market_id: market.id }).eq('id', schedule_id)

    return NextResponse.json({ success: true, market_id: market.id })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
