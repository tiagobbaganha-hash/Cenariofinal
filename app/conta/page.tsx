'use client'
import { ThemeToggle } from '@/components/theme-toggle'

import Link from 'next/link'
const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import type { MeProfile, Notification } from '@/lib/types'
import {
  User, Wallet, ArrowDownToLine, ArrowUpFromLine,
  Bell, Activity, ShieldCheck, ShieldAlert, LogOut, Copy, Lightbulb, TrendingUp, Zap,
} from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [me, setMe] = useState<MeProfile | null>(null)
  const [editando, setEditando] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push('/login')
        return
      }

      try {
        const [meRes, notifRes, txRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email, avatar_url, username, kyc_status, plan, role, referral_code').eq('id', (await supabase.auth.getUser()).data.user!.id).single(),
          supabase
            .from('user_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('wallet_ledger')
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

  async function handleSalvarPerfil() {
    setSalvando(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ full_name: editNome, username: editUsername, avatar_url: editAvatar || null }).eq('id', user.id)
      setMe(prev => prev ? { ...prev, full_name: editNome, username: editUsername } : prev)
      setEditando(false)
    }
    setSalvando(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast({ type: 'success', title: 'Você saiu da sua conta' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </main>
    )
  }

  const balance = me?.available_balance ?? 0
  const locked = me?.balance_locked ?? 0
  const total = balance + locked

  return (
    <>
      {/* Modal Editar Perfil */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Editar perfil</h2>
            <div className="space-y-3">
              {/* Upload de foto */}
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
                  {editAvatar
                    ? <img src={editAvatar} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">{editNome[0]?.toUpperCase() || '?'}</div>
                  }
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Foto de perfil</label>
                  <label className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-fit">
                    {uploadingAvatar ? 'Enviando...' : '📸 Carregar foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 2 * 1024 * 1024) { alert('Máximo 2MB'); return }
                      setUploadingAvatar(true)
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) return
                      const path = `avatars/${user.id}.${file.name.split('.').pop()}`
                      const { error } = await supabase.storage.from('community').upload(path, file, { upsert: true })
                      if (!error) {
                        const { data: url } = supabase.storage.from('community').getPublicUrl(path)
                        setEditAvatar(url.publicUrl)
                      } else { alert('Erro ao enviar foto') }
                      setUploadingAvatar(false)
                    }} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Nome completo</label>
                <input value={editNome} onChange={e => setEditNome(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Username</label>
                <input value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="sem espaços ou caracteres especiais"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditando(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={handleSalvarPerfil} disabled={salvando}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary/20">
                    {me?.avatar_url
                      ? <img src={me.avatar_url} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full bg-primary/10 flex items-center justify-center text-3xl">
                          {['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅'][(me?.id?.charCodeAt(0) ?? 0) % 10]}
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">
                      {me?.full_name ?? me?.email?.split('@')[0] ?? 'Sem nome'}
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
                  <Link href="/perfil" className="flex-1 flex items-center justify-center rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
                    Editar perfil
                  </Link>
                  <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade PRO */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Planos CenárioX</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Análise IA, criar mercados e comissão como influencer</p>
              <Link href="/upgrade" className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Zap className="h-4 w-4" />
                Ver planos PRO e Influencer
              </Link>
            </div>

            {/* Propor Mercado */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tem uma ideia de mercado?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Proponha um mercado preditivo e ganhe comissão quando outras pessoas apostarem.</p>
                  </div>
                </div>
                <Link href="/propor-mercado" className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  <TrendingUp className="h-4 w-4" />
                  Propor um mercado
                </Link>
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
                  <Link href="/carteira"><Button className="gap-2">
                    <ArrowDownToLine className="h-4 w-4" />
                    Depositar
                  </Button></Link>
                  <Link href="/carteira"><Button variant="outline" className="gap-2">
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

          {/* Referral */}
          <section>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">Indicações</h2>
                <ReferralSection />
              </CardContent>
            </Card>
          </section>

          {/* Promo Code */}
          <section>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">Código Promocional</h2>
                <PromoSection />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

    </>
  )
}

function ReferralSection() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.rpc('get_or_create_referral_code')
      setCode((data as any)?.code || (data as string) || '')
      setLoading(false)
    }
    load()
  }, [])

  const link = code ? `https://cenariox.com.br/login?ref=${code}` : ''

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Convide amigos e ganhe bônus quando eles apostarem!</p>
      <div className="flex gap-2">
        <input value={link} readOnly className="flex-1 h-10 px-4 rounded-lg bg-background border border-border text-sm font-mono" />
        <Button variant="outline" onClick={copy}>{copied ? 'Copiado!' : 'Copiar'}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Seu código: <span className="font-mono font-bold">{code}</span></p>
    </div>
  )
}

function PromoSection() {
  const [code, setPromoCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function apply() {
    if (!code.trim()) return
    setLoading(true)
    setMsg(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('validate_promo_code_v2', { p_code: code.trim() })
      if (error) throw error
      const result = data as any
      if (result?.valid) {
        const { error: redeemErr } = await supabase.rpc('redeem_promo_code', { p_code: code.trim() })
        if (redeemErr) throw redeemErr
        setMsg('Código aplicado com sucesso!')
        setPromoCode('')
      } else {
        setMsg(result?.reason || 'Código inválido')
      }
    } catch (err: any) {
      setMsg(err?.message || 'Erro ao aplicar código')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Tem um código? Digite abaixo.</p>
      <div className="flex gap-2">
        <input value={code} onChange={e => setPromoCode(e.target.value.toUpperCase())}
          placeholder="CODIGO123" className="flex-1 h-10 px-4 rounded-lg bg-background border border-border text-sm font-mono uppercase" />
        <Button onClick={apply} disabled={loading}>{loading ? 'Aplicando...' : 'Aplicar'}</Button>
      </div>
      {msg && <p className={`text-sm ${msg.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
    </div>
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
