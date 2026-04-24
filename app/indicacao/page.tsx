'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Copy, Check, Users, Gift, Share2, Loader2, Trophy, TrendingUp } from 'lucide-react'

export default function IndicacaoPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string|null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({ total: 0, paid: 0, earned: 0 })
  const [referrals, setReferrals] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bonus, setBonus] = useState(10)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Carregar perfil e código de referral
      const { data: profile } = await supabase.from('profiles')
        .select('referral_code, full_name').eq('id', user.id).single()

      const code = profile?.referral_code || user.id.slice(0,8)
      setReferralCode(code)

      // Carregar configurações de bônus
      const { data: cfg } = await supabase.from('platform_settings')
        .select('value').eq('key', 'referral_bonus').single()
      if (cfg?.value) setBonus(parseFloat(cfg.value))

      // Carregar indicações feitas
      const { data: refs } = await supabase.from('referrals')
        .select('id, status, bonus_amount, created_at, referred_id, profiles!referred_id(full_name, email)')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      setReferrals(refs || [])
      const paid = (refs || []).filter(r => r.status === 'paid')
      setStats({
        total: (refs || []).length,
        paid: paid.length,
        earned: paid.reduce((s: number, r: any) => s + parseFloat(r.bonus_amount || 0), 0)
      })
      setLoading(false)
    }
    load()
  }, [router])

  const referralUrl = `https://v0-cenariox-arquitetura-e-plano.vercel.app/cadastro?ref=${referralCode}`

  async function copy() {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-xl mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Programa de Indicação</h1>
          <p className="text-muted-foreground mt-1">Indique amigos e ganhe R$ {bonus.toFixed(2)} por cada cadastro confirmado</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Indicados', value: stats.total },
            { icon: Trophy, label: 'Confirmados', value: stats.paid },
            { icon: TrendingUp, label: 'Ganho Total', value: `R$ ${stats.earned.toLocaleString('pt-BR', {minimumFractionDigits:2})}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Link de indicação */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <p className="text-sm font-semibold">Seu link de indicação</p>
          <div className="flex gap-2">
            <input readOnly value={referralUrl}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono truncate focus:outline-none" />
            <button onClick={copy}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-center">
            <p className="text-xs text-muted-foreground">Código:</p>
            <span className="font-mono font-bold text-primary text-sm">{referralCode}</span>
          </div>

          {/* Compartilhar */}
          <div className="flex gap-2">
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🎯 Use meu link no CenárioX e ganhe R$${bonus} de bônus: ${referralUrl}`)}`}
              target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 py-2 text-sm font-medium hover:bg-green-500/30 transition-colors">
              📱 WhatsApp
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(`Ganhe R$${bonus} no CenárioX! 🎯`)}`}
              target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 py-2 text-sm font-medium hover:bg-blue-500/30 transition-colors">
              ✈️ Telegram
            </a>
          </div>
        </div>

        {/* Como funciona */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">Como funciona</p>
          {[
            { n: '1', label: 'Compartilhe seu link', desc: 'Envie seu link único para amigos' },
            { n: '2', label: 'Amigo se cadastra', desc: 'Ele acessa o CenárioX pelo seu link' },
            { n: '3', label: 'Cadastro confirmado', desc: 'Assim que ele completar o cadastro' },
            { n: '4', label: `R$ ${bonus.toFixed(0)} para você e para ele`, desc: 'Crédito automático nas carteiras de ambos' },
          ].map(s => (
            <div key={s.n} className="flex gap-3 items-start">
              <span className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista de indicados */}
        {referrals.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Seus indicados ({referrals.length})</p>
            {referrals.map(r => {
              const profile = (r as any).profiles
              return (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile?.full_name || profile?.email?.split('@')[0] || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status==='paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {r.status === 'paid' ? '✅ Bônus pago' : '⏳ Pendente'}
                    </span>
                    {r.status === 'paid' && <p className="text-xs text-green-400 font-mono mt-0.5">+R$ {parseFloat(r.bonus_amount||0).toFixed(2)}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
