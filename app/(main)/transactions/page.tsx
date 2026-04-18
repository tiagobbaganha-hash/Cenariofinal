'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getUserTransactions, Transaction } from '@/lib/api/wallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, Loader2, Download } from 'lucide-react'
import Link from 'next/link'

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all')

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session?.user) {
          router.push('/login')
          return
        }

        const transactions = await getUserTransactions(data.session.user.id, 100)
        setTransactions(transactions)
      } catch (error) {
        console.error('Erro ao carregar transações:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [router])

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'in') {
      return !tx.type.includes('withdrawal') && !tx.type.includes('bet')
    }
    if (filter === 'out') {
      return tx.type.includes('withdrawal') || tx.type.includes('bet')
    }
    return true
  })

  const total = {
    in: transactions
      .filter((tx) => !tx.type.includes('withdrawal') && !tx.type.includes('bet'))
      .reduce((sum, tx) => sum + tx.amount, 0),
    out: transactions
      .filter((tx) => tx.type.includes('withdrawal') || tx.type.includes('bet'))
      .reduce((sum, tx) => sum + tx.amount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Transações</h1>
          <p className="text-muted-foreground">Todas as suas movimentações</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+{formatCurrency(total.in)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-{formatCurrency(total.out)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${total.in - total.out >= 0 ? 'text-success' : 'text-destructive'}`}>
              {total.in - total.out >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(total.in - total.out))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({transactions.length})
        </Button>
        <Button
          variant={filter === 'in' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in')}
        >
          Entradas
        </Button>
        <Button
          variant={filter === 'out' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('out')}
        >
          Saídas
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Link */}
      <Link href="/wallet">
        <Button variant="outline" className="w-full">
          Voltar à Carteira
        </Button>
      </Link>
    </div>
  )
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isDebit = transaction.type.includes('withdrawal') || transaction.type.includes('bet')
  const Icon = isDebit ? ArrowUpRight : ArrowDownLeft

  const statusColors = {
    completed: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    failed: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            isDebit
              ? 'bg-destructive/10 text-destructive'
              : 'bg-success/10 text-success'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium">{transaction.description}</p>
          <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isDebit ? 'text-destructive' : 'text-success'}`}>
          {isDebit ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        <Badge
          variant="secondary"
          className={`text-xs mt-1 ${statusColors[transaction.status] || ''}`}
        >
          {transaction.status === 'completed' ? 'Concluída' :
           transaction.status === 'pending' ? 'Pendente' : 'Falha'}
        </Badge>
      </div>
    </div>
  )
}
