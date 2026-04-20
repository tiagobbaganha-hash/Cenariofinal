'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Copy, Check, Users, Gift, TrendingUp, Share2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function IndicacaoPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, earned: 0 })
  const [referrals, setReferrals] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)
      const code = user.id.slice(0, 8).toUpperCase()
      setReferralCode(code)

      const { data: profile } = await supabase.from('profiles')
        .select('username, full_name').eq('id', user.id).single()
      setUsername((profile as any)?.username || (profile as any)?.full_name?.split(' ')[0] || 'Você')

      // Buscar indicações (usuários que usaram o código)
      const { data: refs } = await supabase.from('profiles')
        .select('id, full_name, username, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const refList = refs || []
      setReferrals(refList)

      // Calcular ganhos (R$10 por indicação que fez 1+ apostas)
      const earned = refList.length * 10
      setStats({ total: refList.length, active: refList.length, earned })
      setLoading(false)
    }
    load()
  }, [])

  const referralUrl = `https://cenariox.com.br/cadastro?ref=${referralCode}`

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappMsg = `🎯 Estou ganhando dinheiro prevendo o futuro no CenárioX!\n\nA plataforma brasileira de mercados preditivos. Você aposta em eventos reais e ganha se acertar.\n\nUse meu link e ganhe R$10 de bônus ao se cadastrar:\n${referralUrl}`

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 p-7 text-center space-y-3">
        <div className="text-5xl">🎁</div>
        <h1 className="text-2xl font-black text-foreground">Programa de Indicação</h1>
        <p className="text-muted-foreground text-sm">Indique amigos e ganhe <span className="text-primary font-bold">R$10,00</span> para cada um que se cadastrar e fizer a primeira aposta!</p>
        <div className="flex justify-center gap-6 pt-2">
          {[
            { icon: '👥', label: 'Indicados', value: stats.total },
            { icon: '✅', label: 'Ativos', value: stats.active },
            { icon: '💰', label: 'Ganhos', value: `R$${stats.earned}` },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.icon} {s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seu link */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">🔗 Seu link de indicação</p>
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs text-muted-foreground truncate">
            {referralUrl}
          </div>
          <button onClick={copyLink}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${copied ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-lg">🔑</span>
          <div>
            <p className="text-xs font-semibold text-foreground">Seu código: <span className="text-primary font-mono text-base">{referralCode}</span></p>
            <p className="text-[10px] text-muted-foreground">Os amigos usam este código no cadastro</p>
          </div>
        </div>
      </div>

      {/* Compartilhar */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">📢 Compartilhar nas redes</p>
        <div className="grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 hover:bg-green-500/20 transition-colors">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-xs font-semibold text-green-400">WhatsApp</p>
              <p className="text-[10px] text-muted-foreground">Enviar convite</p>
            </div>
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Vem apostar no CenárioX! Use meu link e ganhe R$10 de bônus 🎁')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 hover:bg-blue-500/20 transition-colors">
            <span className="text-2xl">✈️</span>
            <div>
              <p className="text-xs font-semibold text-blue-400">Telegram</p>
              <p className="text-[10px] text-muted-foreground">Enviar convite</p>
            </div>
          </a>
          <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Estou ganhando no @CenarioX prevendo o futuro! 🎯\nUse meu link e ganhe R$10 de bônus: ${referralUrl}\n#mercadopreditivo #cenariox`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 hover:bg-accent transition-colors">
            <span className="text-xl font-black text-muted-foreground">𝕏</span>
            <div>
              <p className="text-xs font-semibold text-foreground">Twitter / X</p>
              <p className="text-[10px] text-muted-foreground">Postar tweet</p>
            </div>
          </a>
          <button onClick={copyLink}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 hover:bg-accent transition-colors">
            {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">{copied ? 'Copiado!' : 'Copiar link'}</p>
              <p className="text-[10px] text-muted-foreground">Para qualquer lugar</p>
            </div>
          </button>
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">📋 Como funciona</p>
        <div className="space-y-3">
          {[
            { n: '1', icon: '🔗', title: 'Compartilhe seu link', desc: 'Envie seu link exclusivo para amigos pelo WhatsApp, Instagram ou onde quiser' },
            { n: '2', icon: '📝', title: 'Amigo se cadastra', desc: 'Ele cria a conta usando seu link ou código de indicação' },
            { n: '3', icon: '🎯', title: 'Ele faz a primeira aposta', desc: 'Quando o indicado depositar e fizer a primeira previsão' },
            { n: '4', icon: '💰', title: 'Você recebe R$10', desc: 'O bônus é creditado automaticamente na sua carteira' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary">{step.n}</div>
              <div>
                <p className="text-xs font-semibold text-foreground">{step.icon} {step.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de indicados */}
      {referrals.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">👥 Seus indicados</p>
          {referrals.map(r => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-lg">
                {['🚀','🐂','🦁','🔮','🎯'][r.id.charCodeAt(0) % 5]}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{r.full_name || r.username || 'Usuário'}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <span className="text-xs font-bold text-primary">+R$10,00</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
