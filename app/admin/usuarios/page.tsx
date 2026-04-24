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
  full_name?: string
  role?: string
  status?: string
  kyc_status?: string
  available_balance?: number
  cpf?: string
  phone?: string
  created_at: string
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '', cpf: '', phone: '', pix_key: '', role: 'user',
    referral_code: '', commission_pct: 2, kyc_status: 'pending'
  })
  const [newRole, setNewRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

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
        .select('user_id, available_balance')
        .in('user_id', userIds)

      const walletMap = new Map(wallets?.map(w => [w.user_id, parseFloat(w.available_balance || '0')]))

      setUsers(data.map((u: any) => ({
        id: u.id,
        email: u.email || '',
        display_name: u.full_name || u.email?.split('@')[0] || '',
        full_name: u.full_name,
        role: u.role || 'user',
        status: u.status || 'active',
        kyc_status: u.kyc_status || 'pending',
        available_balance: walletMap.get(u.id) || 0,
        cpf: u.cpf,
        phone: u.phone,
        created_at: u.created_at,
      })))
    }
    setLoading(false)
  }

  async function changeRole(userId: string, role: string) {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
      if (error) throw error
      setMsg('Role atualizada!')
      setEditUser(null)
      loadUsers()
    } catch (err: any) {
      setMsg('Erro: ' + err?.message)
    } finally { setSaving(false) }
  }

  async function toggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    const supabase = createClient()
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId)
    loadUsers()
  }

  async function updateKyc(userId: string, decision: string) {
    const supabase = createClient()
    await supabase.from('profiles').update({
      kyc_status: decision,
      kyc_reviewed_at: new Date().toISOString(),
    }).eq('id', userId)
    loadUsers()
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
                      <div className="flex items-center justify-end gap-1">
                        {/* KYC */}
                        {user.kyc_status === 'pending' && (
                          <Button size="sm" variant="ghost" className="text-green-400 text-xs" onClick={() => updateKyc(user.id, 'approved')}>
                            KYC ✓
                          </Button>
                        )}
                        {/* Role */}
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditUser(user)
                          setEditForm({
                            full_name: user.full_name || '',
                            cpf: user.cpf || '',
                            phone: user.phone || '',
                            pix_key: user.pix_key || '',
                            role: user.role || 'user',
                            referral_code: user.referral_code || '',
                            commission_pct: user.commission_pct || 2,
                            kyc_status: user.kyc_status || 'pending',
                          })
                          setMsg(null)
                        }}>
                          <Shield className="h-4 w-4" />
                        </Button>
                        {/* Ban/Unban */}
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => toggleStatus(user.id, user.status || 'active')}>
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

      {/* Role Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {(editUser.full_name || editUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold">{editUser.full_name || editUser.email}</h2>
                  <p className="text-xs text-muted-foreground">{editUser.id.slice(0,8)}...</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditUser(null)}>✕</Button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nome completo</label>
                  <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                     value={editForm.full_name} onChange={e => setEditForm(f => ({...f, full_name: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm opacity-60" disabled
                    defaultValue={editUser.email || ''} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">CPF</label>
                  <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                     value={editForm.cpf} onChange={e => setEditForm(f => ({...f, cpf: e.target.value}))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                  <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                     value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} placeholder="+55 (11) 99999-9999" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Chave PIX</label>
                  <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                     value={editForm.pix_key} onChange={e => setEditForm(f => ({...f, pix_key: e.target.value}))} placeholder="CPF, email ou telefone" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm(f => ({...f, role: e.target.value}))} 
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="user">Usuário</option>
                    <option value="influencer">Influencer</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Influencer fields */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-primary">⭐ Configurações de Influencer</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Código de referral</label>
                    <input className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                       value={editForm.referral_code} onChange={e => setEditForm(f => ({...f, referral_code: e.target.value}))} placeholder="ex: joao2024" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Comissão (%)</label>
                    <input type="number" min="0" max="20" step="0.5"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                       value={editForm.commission_pct} onChange={e => setEditForm(f => ({...f, commission_pct: parseFloat(e.target.value)||2}))} />
                  </div>
                </div>
              </div>

              {/* Saldo */}
              <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo disponível</p>
                  <p className="font-bold text-green-400">R$ {(editUser.available_balance || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">KYC Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${editUser.kyc_status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {editUser.kyc_status || 'pendente'}
                  </span>
                </div>
              </div>

              {msg && <p className={`text-sm font-medium ${msg.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button className="flex-1" disabled={saving} onClick={async () => {
                setSaving(true)
                const supabase = createClient()
                const { error } = await supabase.from('profiles').update({
                  full_name: editForm.full_name,
                  cpf: editForm.cpf,
                  phone: editForm.phone,
                  pix_key: editForm.pix_key,
                  role: editForm.role,
                  referral_code: editForm.referral_code,
                  kyc_status: editForm.kyc_status,
                }).eq('id', editUser.id)

                if (editForm.role === 'influencer' && editForm.referral_code) {
                  await supabase.from('influencers').upsert({
                    user_id: editUser.id,
                    name: editForm.full_name || editUser.email,
                    referral_code: editForm.referral_code,
                    commission_pct: editForm.commission_pct,
                    is_active: true,
                  }, { onConflict: 'user_id' })
                }

                if (error) setMsg('❌ ' + error.message)
                else { setMsg('✅ Usuário atualizado!'); loadUsers(); setTimeout(() => setEditUser(null), 1000) }
                setSaving(false)
              }}>
                {saving ? 'Salvando...' : '💾 Salvar alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
