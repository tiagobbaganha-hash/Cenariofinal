'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface Market {
  id: string
  title: string
  slug: string
  category: string
  status: string
  featured: boolean
  total_volume?: number
  closes_at: string | null
  created_at: string
}

interface MarketOption {
  id: string
  label: string
  option_key: string
}

export default function AdminMercados() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Resolve modal
  const [resolveMarket, setResolveMarket] = useState<Market | null>(null)
  const [resolveOptions, setResolveOptions] = useState<MarketOption[]>([])
  const [selectedOption, setSelectedOption] = useState('')
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolveMsg, setResolveMsg] = useState<string | null>(null)

  useEffect(() => {
    loadMarkets()
  }, [statusFilter])

  async function loadMarkets() {
    setLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    
    const { data } = await query
    setMarkets(data || [])
    setLoading(false)
  }

  async function openResolve(market: Market) {
    setResolveMarket(market)
    setSelectedOption('')
    setResolveNote('')
    setResolveMsg(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('market_options')
      .select('id, label, option_key')
      .eq('market_id', market.id)
      .order('sort_order')
    setResolveOptions((data || []) as MarketOption[])
  }

  async function handleResolve() {
    if (!resolveMarket || !selectedOption) return
    setResolving(true)
    setResolveMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('admin_settle_market', {
        p_market_id: resolveMarket.id,
        p_result_option_id: selectedOption,
        p_note: resolveNote || 'Resolvido pelo admin',
      })
      if (error) throw error
      setResolveMsg('Mercado resolvido e apostas liquidadas!')
      setTimeout(() => { setResolveMarket(null); loadMarkets() }, 1500)
    } catch (err: any) {
      setResolveMsg('Erro: ' + (err?.message || 'Falha ao resolver'))
    } finally {
      setResolving(false)
    }
  }

  const filteredMarkets = markets.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    open: 'bg-green-500/10 text-green-400 border-green-500/20',
    suspended: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    closed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    resolved: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const statusIcons: Record<string, any> = {
    draft: Clock,
    open: CheckCircle,
    suspended: AlertTriangle,
    closed: XCircle,
    resolved: CheckCircle,
    cancelled: XCircle,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mercados</h1>
          <p className="text-muted-foreground">Gerenciar mercados preditivos</p>
        </div>
        <Link href="/admin/mercados/novo">
          <Button className="glow-green">
            <Plus className="mr-2 h-4 w-4" />
            Novo Mercado
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mercados..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border focus:border-primary outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-4 rounded-lg bg-card border border-border focus:border-primary outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="open">Aberto</option>
          <option value="suspended">Suspenso</option>
          <option value="closed">Fechado</option>
          <option value="resolved">Resolvido</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <Button variant="outline" onClick={loadMarkets}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-2xl font-bold">{markets.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{markets.filter(m => m.status === 'open').length}</p>
          <p className="text-sm text-muted-foreground">Abertos</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{markets.filter(m => m.status === 'draft').length}</p>
          <p className="text-sm text-muted-foreground">Rascunho</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-2xl font-bold text-purple-400">{markets.filter(m => m.status === 'resolved').length}</p>
          <p className="text-sm text-muted-foreground">Resolvidos</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left p-4 font-medium">Mercado</th>
                <th className="text-left p-4 font-medium">Categoria</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Volume</th>
                <th className="text-left p-4 font-medium">Encerra</th>
                <th className="text-right p-4 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredMarkets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum mercado encontrado
                  </td>
                </tr>
              ) : (
                filteredMarkets.map(market => {
                  const StatusIcon = statusIcons[market.status] || Clock
                  return (
                    <tr key={market.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {market.featured && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                              Destaque
                            </span>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{market.title}</p>
                            <p className="text-xs text-muted-foreground">{market.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-accent text-sm">
                          {market.category || 'Geral'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm border ${statusColors[market.status] || statusColors.draft}`}>
                          <StatusIcon className="h-3 w-3" />
                          {market.status}
                        </span>
                      </td>
                      <td className="p-4 tabular-nums">
                        R$ {((market.total_volume || 0) / 1000).toFixed(1)}k
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {market.closes_at ? new Date(market.closes_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/mercados/${market.slug || market.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/mercados/${market.id}/editar`}>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {(market.status === 'open' || market.status === 'closed') && (
                            <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300" onClick={() => openResolve(market)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 space-y-4">
            <h2 className="text-lg font-bold">Resolver Mercado</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">{resolveMarket.title}</p>
            
            <div>
              <label className="block text-sm font-medium mb-2">Opção vencedora</label>
              <div className="space-y-2">
                {resolveOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors ${
                      selectedOption === opt.id 
                        ? 'border-green-500 bg-green-500/10 text-green-400' 
                        : 'border-border hover:bg-accent/30'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({opt.option_key})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nota (opcional)</label>
              <input
                type="text"
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                placeholder="Ex: Fonte oficial confirmou resultado"
                className="w-full h-10 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
              />
            </div>

            {resolveMsg && (
              <div className={`p-3 rounded-lg text-sm ${resolveMsg.startsWith('Erro') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {resolveMsg}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setResolveMarket(null)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                disabled={!selectedOption || resolving}
                onClick={handleResolve}
              >
                {resolving ? 'Resolvendo...' : 'Confirmar resultado'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
