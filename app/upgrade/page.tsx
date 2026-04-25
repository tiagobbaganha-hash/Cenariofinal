'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Brain, TrendingUp, Star, Check, Zap, Users, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PLANS = [
  {
    id: 'pro',
    name: 'PRO',
    price: 29.90,
    color: 'primary',
    icon: Brain,
    description: 'Para apostadores sérios',
    features: [
      'Análise IA em cada mercado',
      'Sugestões personalizadas de apostas',
      'Acesso antecipado a novos mercados',
      'Propor mercados para a plataforma',
      'Badge PRO no perfil',
    ],
    cta: 'Assinar PRO',
    highlight: true,
  },
  {
    id: 'influencer',
    name: 'Influencer',
    price: 0,
    color: 'orange',
    icon: Users,
    description: 'Para criadores de conteúdo',
    features: [
      'Criar mercados próprios',
      'Comissão em cada aposta nos seus mercados',
      'Link de referral personalizado',
      'Comissão em apostas de indicados',
      'Dashboard de performance',
      'Tudo do plano PRO incluído',
    ],
    cta: 'Candidatar-se',
    highlight: false,
    note: 'Aprovação sujeita a análise',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [success, setSuccess] = useState('')

  async function handlePro() {
    setLoading('pro')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Em produção: redirecionar para Stripe/Pix
      // Por enquanto: ativar direto (sem pagamento)
      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: 'pro',
        status: 'active',
        price: 29.90,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      }, { onConflict: 'user_id,plan' })

      setSuccess('PRO ativado com sucesso! Redirecionando...')
      setTimeout(() => router.push('/mercados'), 2000)
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  async function handleInfluencer() {
    setLoading('influencer')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Buscar dados do perfil para a candidatura
      const { data: profile } = await supabase.from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      
      const { error: appError } = await supabase.from('influencer_applications').insert({
        user_id: user.id,
        name: (profile as any)?.full_name || (profile as any)?.email?.split('@')[0] || 'Candidato',
        email: (profile as any)?.email || '',
        status: 'pending',
        message: 'Candidatura enviada pelo painel de upgrade',
      })
      
      if (appError) {
        // Fallback: usar market_proposals com tipo específico
        await supabase.from('market_proposals').insert({
          user_id: user.id,
          title: '[CANDIDATURA INFLUENCER]',
          description: 'Usuário se candidatou para o plano Influencer',
          category: '__influencer__',
          status: 'pending',
        })
      }

      setSuccess('✅ Candidatura enviada! Nossa equipe vai analisar em até 48h. Você receberá uma notificação quando sua conta for aprovada como influencer. Enquanto isso, explore os mercados e comece a indicar amigos com seu link de indicação.')
      // Redirecionar para conta após 4s
      setTimeout(() => router.push('/indicacao'), 4000)
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Zap className="h-4 w-4" /> Desbloqueie o poder total do CenárioX
        </div>
        <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
        <p className="text-muted-foreground">Análise com IA, criação de mercados e muito mais</p>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center text-green-400 font-medium">
          ✅ {success}
        </div>
      )}

      {/* Plano FREE */}
      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground">Free</p>
            <p className="text-sm text-muted-foreground">Seu plano atual</p>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">R$ 0</span>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {['Apostar em mercados', 'Ver odds e probabilidades', 'Leaderboard e comunidade'].map(f => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-muted-foreground" />{f}</li>
          ))}
        </ul>
      </div>

      {/* Planos pagos */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map(plan => {
          const Icon = plan.icon
          return (
            <div key={plan.id} className={`rounded-2xl border p-6 space-y-5 relative ${plan.highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  RECOMENDADO
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.highlight ? 'bg-primary/20' : 'bg-orange-500/20'}`}>
                    <Icon className={`h-5 w-5 ${plan.highlight ? 'text-primary' : 'text-orange-400'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {plan.price > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-foreground">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-orange-400">Por aprovação</p>
                  )}
                </div>
              </div>

              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-primary' : 'text-orange-400'}`} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              {plan.note && (
                <p className="text-xs text-muted-foreground/60 italic">{plan.note}</p>
              )}

              <Button
                onClick={plan.id === 'pro' ? handlePro : handleInfluencer}
                disabled={!!loading}
                className={`w-full gap-2 ${!plan.highlight ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                variant={plan.highlight ? 'default' : 'outline'}
              >
                {loading === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {plan.cta}
              </Button>
            </div>
          )
        })}
      </div>

      {/* FAQ rápido */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Dúvidas frequentes</p>
        {[
          ['Posso cancelar quando quiser?', 'Sim. Cancele a qualquer momento e o acesso continua até o fim do período pago.'],
          ['Como funciona o plano Influencer?', 'Você cria mercados na plataforma e recebe comissão sobre cada aposta. Quanto mais pessoas apostam nos seus mercados, mais você ganha.'],
          ['A análise IA é confiável?', 'A IA analisa dados públicos e probabilidades, mas não é consultoria financeira. Use como auxílio, não como verdade absoluta.'],
        ].map(([q, a]) => (
          <div key={q} className="rounded-xl border border-border bg-card/50 p-4">
            <p className="text-sm font-medium text-foreground">{q}</p>
            <p className="text-xs text-muted-foreground mt-1">{a}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
