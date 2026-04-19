'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter,
  Eye,
  Ban,
  CheckCircle,
  UserX,
  Shield,
  RefreshCw,
  Mail,
  Calendar,
  Wallet
} from 'lucide-react'

interface User {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  role?: string
  is_active?: boolean
  balance?: number
  total_bets?: number
  created_at: string
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const supabase = createClient()
    
    // Tentar buscar da view admin ou profiles
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) {
      // Buscar saldos
      const userIds = data.map(u => u.id)
      const { data: wallets } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .in('user_id', userIds)

      const walletMap = new Map(wallets?.map(w => [w.user_id, parseFloat(w.available_balance || '0')]))

      setUsers(data.map((u: any) => ({
        id: u.id,
        email: u.email || '',
        display_name: u.display_name || u.username || u.full_name,
        avatar_url: u.avatar_url,
        role: u.role || 'user',
        is_active: u.is_active !== false,
        balance: walletMap.get(u.id) || 0,
        total_bets: u.total_bets || 0,
        created_at: u.created_at,
      })))
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">Gerenciar contas de usuarios</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email ou nome..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border focus:border-primary outline-none"
          />
        </div>
        <Button variant="outline" onClick={loadUsers}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{users.filter(u => u.is_active).length}</p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <p className="text-2xl font-bold text-cyan-400">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-sm text-muted-foreground">Admins</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">
            R$ {(users.reduce((s, u) => s + (u.available_balance || 0), 0) / 1000).toFixed(1)}k
          </p>
          <p className="text-sm text-muted-foreground">Saldo Total</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left p-4 font-medium">Usuario</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Saldo</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Cadastro</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum usuario encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-background font-bold">
                          {(user.display_name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                        user.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-accent'
                      }`}>
                        {user.role === 'admin' && <Shield className="h-3 w-3" />}
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="p-4 tabular-nums">
                      <div className="flex items-center gap-1">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        R$ {(user.available_balance || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm bg-green-500/10 text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm bg-red-500/10 text-red-400">
                          <UserX className="h-3 w-3" />
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
