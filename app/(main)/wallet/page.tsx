'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getUserBalance, getUserTransactions, Transaction, UserBalance } from '@/lib/api/wallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function WalletPage() {
  const router = useRouter()
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const initWallet = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session?.user) {
          router.push('/login')
          return
        }

        setUser(data.session.user)
        const userBalance = await getUserBalance(data.session.user.id)
        const userTransactions = await getUserTransactions(data.session.user.id, 10)

        setBalance(userBalance)
        setTransactions(userTransactions)
      } catch (error) {
        console.error('Erro ao carregar wallet:', error)
      } finally {
        setLoading(false)
      }
    }

    initWallet()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Carteira</h1>
        <p className="text-muted-foreground">Gerencie seu saldo e transações</p>
      </div>

      {/* Saldo Principal */}
      {balance && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-bold">{formatCurrency(balance.balance)}</div>
                <p className="text-sm text-muted-foreground">
                  Total depositado: {formatCurrency(balance.totalDeposited)}
                </p>
              </div>

              {/* Pending Balances */}
              {(balance.pendingDeposits > 0 || balance.pendingWithdrawals > 0) && (
                <div className="space-y-2 rounded-lg bg-background/50 p-3">
                  {balance.pendingDeposits > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Depósito pendente</span>
                      <Badge variant="warning">
                        +{formatCurrency(balance.pendingDeposits)}
                      </Badge>
                    </div>
                  )}
                  {balance.pendingWithdrawals > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Saque pendente</span>
                      <Badge variant="warning">
                        -{formatCurrency(balance.pendingWithdrawals)}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Link href="/wallet/deposit" className="flex-1">
                  <Button className="w-full" size="sm">
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Depositar
                  </Button>
                </Link>
                <Link href="/wallet/withdraw" className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Sacar
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma transação ainda
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Seu saldo é mantido em segurança com criptografia de ponta a ponta e auditoria completa
            de todas as transações.
          </p>
          <p>Depósitos via Pix são processados instantaneamente. Saques levam 1-2 dias úteis.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isDebit = transaction.type.includes('withdrawal') || transaction.type.includes('bet')
  const Icon = isDebit ? ArrowUpRight : ArrowDownLeft

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
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
          <p className="font-medium text-sm">{transaction.description}</p>
          <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${isDebit ? 'text-destructive' : 'text-success'}`}>
          {isDebit ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        <Badge variant="secondary" className="text-xs mt-1">
          {transaction.status}
        </Badge>
      </div>
    </div>
  )
}
