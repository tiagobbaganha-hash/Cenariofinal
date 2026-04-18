'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import type { MeProfile, Notification } from '@/lib/types'
import {
  User, Wallet, ArrowDownToLine, ArrowUpFromLine,
  Bell, Activity, ShieldCheck, ShieldAlert, LogOut, Copy,
} from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [me, setMe] = useState<MeProfile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push('/login')
        return
      }

      try {
        const [meRes, notifRes, txRes] = await Promise.all([
          supabase.from('v_front_me').select('*').single(),
          supabase
            .from('v_my_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', auth.user.id)
            .order('created_at', { ascending: false })
            .limit(20),
        ])
        setMe((meRes.data as any) ?? null)
        setNotifications((notifRes.data ?? []) as any)
        setTransactions((txRes.data ?? []) as any)
      } catch (e) {
        console.error('[v0] Erro ao carregar conta:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast({ type: 'success', title: 'Você saiu da sua conta' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  const balance = me?.balance_available ?? 0
  const locked = me?.balance_locked ?? 0
  const total = balance + locked

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Minha conta</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie seu perfil, carteira e atividade.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* LEFT: Profile + Wallet */}
          <aside className="space-y-6">
            {/* Profile */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/20">
                    {(me?.full_name ?? me?.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">
                      {me?.full_name ?? me?.username ?? 'Sem nome'}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {me?.email}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <KycBadge status={me?.kyc_status} />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar perfil
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Wallet */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-wider text-xs">Saldo disponível</span>
                </div>
                <div className="mt-2 text-4xl font-bold tabular-nums">
                  {formatCurrency(balance)}
                </div>
                {locked > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    + {formatCurrency(locked)} bloqueado em apostas
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button className="gap-2">
                    <ArrowDownToLine className="h-4 w-4" />
                    Depositar
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpFromLine className="h-4 w-4" />
                    Sacar
                  </Button>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
                  <span className="text-muted-foreground">Saldo total</span>
                  <span className="font-mono font-medium tabular-nums">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* RIGHT: Activity */}
          <section className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-border/60 p-5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <h2 className="font-semibold">Notificações</h2>
                  </div>
                  {notifications.length > 0 && (
                    <Badge variant="muted">{notifications.length}</Badge>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    Nenhuma notificação ainda.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {notifications.slice(0, 5).map((n) => (
                      <li key={n.id} className="flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors">
                        <div className={cn(
                          'mt-1 h-2 w-2 rounded-full',
                          n.read ? 'bg-muted' : 'bg-primary'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-sm truncate">{n.title}</p>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatDateTime(n.created_at)}
                            </span>
                          </div>
                          {n.body && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b border-border/60 p-5">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">Histórico de transações</h2>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    Nenhuma transação ainda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                        <tr className="border-b border-border/60">
                          <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                          <th className="px-5 py-2.5 text-left font-medium">Status</th>
                          <th className="px-5 py-2.5 text-right font-medium">Valor</th>
                          <th className="px-5 py-2.5 text-right font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-accent/30">
                            <td className="px-5 py-3 capitalize">{t.type}</td>
                            <td className="px-5 py-3">
                              <TxStatusBadge status={t.status} />
                            </td>
                            <td
                              className={cn(
                                'px-5 py-3 text-right font-mono tabular-nums',
                                Number(t.amount) > 0 ? 'text-success' : 'text-foreground'
                              )}
                            >
                              {Number(t.amount) > 0 ? '+' : ''}
                              {formatCurrency(Number(t.amount))}
                            </td>
                            <td className="px-5 py-3 text-right text-muted-foreground text-xs">
                              {formatDateTime(t.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

function KycBadge({ status }: { status?: string | null }) {
  if (status === 'approved')
    return (
      <Badge variant="success" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        KYC aprovado
      </Badge>
    )
  if (status === 'rejected')
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        KYC rejeitado
      </Badge>
    )
  if (status === 'pending')
    return (
      <Badge variant="warning" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        KYC em análise
      </Badge>
    )
  return (
    <Badge variant="muted" className="gap-1">
      <ShieldAlert className="h-3 w-3" />
      KYC pendente
    </Badge>
  )
}

function TxStatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    completed: 'success',
    approved: 'success',
    pending: 'warning',
    processing: 'warning',
    failed: 'destructive',
    rejected: 'destructive',
    canceled: 'muted',
  }
  return <Badge variant={map[status] ?? 'muted'}>{status}</Badge>
}
