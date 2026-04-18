'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface AdminUser {
  id: string
  email: string
  name: string | null
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  role?: 'user' | 'admin' | 'super_admin'
  balance?: number
  totalBets?: number
  totalVolume?: number
  created_at: string
  last_sign_in_at: string | null
}

const kycStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  none: { label: 'Não Iniciado', variant: 'secondary' },
  pending: { label: 'Pendente', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
}

const roleLabels: Record<string, string> = {
  user: 'Usuário',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'kyc_pending' | 'kyc_rejected' | 'admins'>('all')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // TODO: Usar endpoint REST quando disponível
        // Por enquanto, retorna array vazio para evitar timeout
        setUsers([])
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true
    if (filter === 'kyc_pending') return user.kycStatus === 'pending'
    if (filter === 'kyc_rejected') return user.kycStatus === 'rejected'
    if (filter === 'admins') return user.role && user.role !== 'user'
    return true
  })

  const counts = {
    all: users.length,
    kyc_pending: users.filter((u) => u.kycStatus === 'pending').length,
    kyc_rejected: users.filter((u) => u.kycStatus === 'rejected').length,
    admins: users.filter((u) => u.role && u.role !== 'user').length,
  }

  const columns = [
    {
      key: 'email',
      header: 'Usuário',
      cell: (user: AdminUser) => (
        <div>
          <p className="font-medium">{user.name ?? 'Sem nome'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      cell: (user: AdminUser) => (
        <span className="text-sm">
          {user.role ? roleLabels[user.role] : 'Usuário'}
        </span>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      cell: (user: AdminUser) => (
        <Badge variant={kycStatusConfig[user.kycStatus || 'none'].variant}>
          {kycStatusConfig[user.kycStatus || 'none'].label}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Cadastro',
      cell: (user: AdminUser) => formatDate(user.created_at),
    },
    {
      key: 'last_sign_in_at',
      header: 'Último Login',
      cell: (user: AdminUser) => 
        user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários da plataforma"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton
          label="Todos"
          count={counts.all}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterButton
          label="KYC Pendente"
          count={counts.kyc_pending}
          active={filter === 'kyc_pending'}
          onClick={() => setFilter('kyc_pending')}
        />
        <FilterButton
          label="KYC Rejeitado"
          count={counts.kyc_rejected}
          active={filter === 'kyc_rejected'}
          onClick={() => setFilter('kyc_rejected')}
        />
        <FilterButton
          label="Admins"
          count={counts.admins}
          active={filter === 'admins'}
          onClick={() => setFilter('admins')}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            {users.length === 0
              ? 'Nenhum usuário encontrado'
              : 'Nenhum usuário correspondente ao filtro'}
          </p>
        </div>
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          onRowClick={(user) => {
            window.location.href = `/admin/users/${user.id}`
          }}
        />
      )}
    </div>
  )
}

function FilterButton({
  label,
  count,
  active = false,
  onClick,
}: {
  label: string
  count: number
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs ${
          active ? 'bg-primary-foreground/20' : 'bg-muted'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
