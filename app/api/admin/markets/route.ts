import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ApiResponse, Market, CreateMarketInput } from '@/lib/types/api'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/markets - Lista todos os mercados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json<ApiResponse>(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Market[]>>({ data })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json<ApiResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/markets - Cria um novo mercado
export async function POST(request: NextRequest) {
  try {
    const body: CreateMarketInput = await request.json()

    // Validate required fields
    if (!body.title || !body.category || !body.closes_at || !body.resolves_at) {
      return NextResponse.json<ApiResponse>(
        { error: 'Missing required fields: title, category, closes_at, resolves_at' },
        { status: 400 }
      )
    }

    if (!body.options || body.options.length < 2) {
      return NextResponse.json<ApiResponse>(
        { error: 'At least 2 options are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create market
    const { data: market, error: marketError } = await supabaseAdmin
      .from('markets')
      .insert({
        title: body.title,
        slug: `${slug}-${Date.now()}`,
        description: body.description || null,
        category: body.category,
        status: 'draft',
        closes_at: body.closes_at,
        resolves_at: body.resolves_at,
        resolution_source: body.resolution_source || null,
      })
      .select()
      .single()

    if (marketError) {
      return NextResponse.json<ApiResponse>(
        { error: marketError.message },
        { status: 500 }
      )
    }

    // Create options
    const optionsToInsert = body.options.map((opt, index) => ({
      market_id: market.id,
      label: opt.label,
      option_key: opt.key,
      sort_order: index,
      is_active: true,
    }))

    const { error: optionsError } = await supabaseAdmin
      .from('market_options')
      .insert(optionsToInsert)

    if (optionsError) {
      // Rollback: delete the market if options failed
      await supabaseAdmin.from('markets').delete().eq('id', market.id)
      return NextResponse.json<ApiResponse>(
        { error: optionsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Market>>(
      { data: market, message: 'Market created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating market:', error)
    return NextResponse.json<ApiResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
