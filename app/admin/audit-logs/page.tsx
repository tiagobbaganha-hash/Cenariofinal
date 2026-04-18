'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { getAllAuditLogs, AuditLog } from '@/lib/audit/auditLog'

const actionLabels: Record<string, string> = {
  create_market: 'Criar Mercado',
  update_market: 'Atualizar Mercado',
  delete_market: 'Deletar Mercado',
  update_user: 'Atualizar Usuário',
  approve_kyc: 'Aprovar KYC',
  reject_kyc: 'Rejeitar KYC',
  update_settings: 'Atualizar Configurações',
}

const actionColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  create_market: 'success',
  update_market: 'secondary',
  delete_market: 'destructive',
  update_user: 'secondary',
  approve_kyc: 'success',
  reject_kyc: 'destructive',
  update_settings: 'warning',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getAllAuditLogs(200)
        setLogs(data)
      } catch (error) {
        console.error('Erro ao carregar audit logs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const columns = [
    {
      key: 'action',
      header: 'Ação',
      cell: (log: AuditLog) => (
        <Badge variant={actionColors[log.action] || 'default'}>
          {actionLabels[log.action] || log.action}
        </Badge>
      ),
    },
    {
      key: 'resource_type',
      header: 'Tipo de Recurso',
      cell: (log: AuditLog) => (
        <span className="text-sm capitalize">{log.resource_type}</span>
      ),
    },
    {
      key: 'user_id',
      header: 'Usuário',
      cell: (log: AuditLog) => (
        <code className="rounded bg-muted px-2 py-1 text-xs">
          {log.user_id.slice(0, 8)}...
        </code>
      ),
    },
    {
      key: 'resource_id',
      header: 'ID do Recurso',
      cell: (log: AuditLog) =>
        log.resource_id ? (
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {log.resource_id.slice(0, 8)}...
          </code>
        ) : (
          '—'
        ),
    },
    {
      key: 'created_at',
      header: 'Data e Hora',
      cell: (log: AuditLog) => formatDate(log.created_at),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Histórico de todas as operações administrativas"
      />

      {loading ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Carregando audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Nenhum audit log encontrado</p>
        </div>
      ) : (
        <DataTable data={logs} columns={columns} />
      )}
    </div>
  )
}
